const User = require("../models/user.model");
const Punch = require("../models/punch.model");
const LeaveApplication = require("../models/leaveApplication.model");
const Candidate = require("../models/candidate.model");
const Performance = require("../models/performance.model");
const Payroll = require("../models/payroll.model");
const Resignation = require("../models/resignation.model");
const Holiday = require("../models/holiday.model");
const Job = require("../models/job.model");

// ---> Welcome Page Greeting <---
exports.getDashboardSummary = async (req, res) => {
    try {
        const totalEmployees = await User.countDocuments({ role: "employee" });
        
        // Find today's date range
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Calculate Present by checking punches today
        const distinctPunches = await Punch.distinct("userId", {
            PunchTime: { $gte: startOfDay, $lte: endOfDay }
        });
        const presentCount = distinctPunches.length;

        // Check if today is a holiday
        const holiday = await Holiday.findOne({
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        res.status(200).json({
            success: true,
            data: {
                totalEmployees,
                presentCount,
                isHoliday: !!holiday,
                holidayDetails: holiday || null,
                greeting: "Welcome to HR Dashboard"
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getHRAdminProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user?._id).select("-password -refreshToken");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const hrProfile = {
            header: {
                profileImage: user.profileImage,
                name: user.name,
                post: user.designation || "HR Administrator",
                hrId: user.employeeId
            },
            personalInfo: {
                fullName: user.name,
                joiningDate: user.joiningDate,
                phoneNumber: user.phone,
                emailId: user.email
            },
            administrativeAccess: {
                accessLevel: user.role, // e.g. "hr", "admin"
                complianceStatus: user.complianceStatus || "Compliant"
            }
        };

        res.status(200).json({ success: true, data: hrProfile });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---> HR Operations: Employee <---
exports.addEmployee = async (req, res) => {
    try {
        const { name, email, phone, employeeId, department, designation, reportingManager, annualSalary, employmentType, password = "Password@123" } = req.body;
        
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ success: false, message: "Email already exists" });

        const newEmployee = new User({
            name, email, phone, password, role: "employee",
            employeeId, department, designation, reportingManager, annualSalary, employmentType
        });
        
        await newEmployee.save();
        res.status(201).json({ success: true, message: "Employee added successfully", data: newEmployee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.editEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        delete updates.password; // Forbid password update here
        
        const employee = await User.findByIdAndUpdate(id, updates, { new: true });
        if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });
        
        res.status(200).json({ success: true, message: "Employee updated successfully", data: employee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllEmployees = async (req, res) => {
    try {
        const { department, role, search, page = 1, limit = 20 } = req.query;
        const filter = { role: { $nin: ["main_admin", "superadmin"] } };
        if (department) filter.department = department;
        if (role) filter.designation = role;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { employeeId: { $regex: search, $options: "i" } }
            ];
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const employees = await User.find(filter)
            .select("-password -refreshToken")
            .populate("reportingManager", "name employeeId")
            .skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });
        const total = await User.countDocuments(filter);
        res.status(200).json({ success: true, data: employees, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getEmployeeProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).populate("reportingManager", "name employeeId").lean();
        if(!user) return res.status(404).json({ success: false, message: "Employee not found" });

        // Basic Profile Info
        const profileInfo = {
            profileImage: user.profileImage,
            name: user.name,
            employeeId: user.employeeId,
        };

        const personalInfo = {
            email: user.email,
            phone: user.phone
        };

        const jobDetails = {
            department: user.department,
            role: user.designation,
            manager: user.reportingManager,
            joiningDate: user.joiningDate,
            employeeType: user.employmentType,
            status: user.status || "Active"
        };

        // Real attendance calculation for current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const punchDays = await Punch.distinct("PunchTime", {
            userId: id,
            PunchType: 1,
            PunchTime: { $gte: startOfMonth, $lte: endOfMonth }
        });
        const presentDays = new Set(punchDays.map(d => new Date(d).toDateString())).size;

        const leaveCount = await LeaveApplication.countDocuments({
            EmployeeID: id,
            ApprovalStatus: "Approved",
            StartDate: { $gte: startOfMonth },
            EndDate: { $lte: endOfMonth }
        });

        const workingDays = now.getDate();
        const absentDays = Math.max(0, workingDays - presentDays - leaveCount);

        const attendanceSummary = { present: presentDays, absent: absentDays, leave: leaveCount };

        const currentMonth = now.toISOString().slice(0, 7);
        const performance = await Performance.findOne({ userId: id, month: currentMonth });
        const payroll = await Payroll.find({ userId: id }).sort({ createdAt: -1 }).limit(1);

        res.status(200).json({
            success: true,
            data: {
                profileInfo,
                attendanceSummary,
                personalInfo,
                jobDetails,
                performance: performance || { message: "No performance data for current month" },
                financial: {
                    currentBaseSalary: user.currentBaseSalary || (user.annualSalary ? Math.round(user.annualSalary / 12) : 0),
                    annualSalaryUSD: user.annualSalary || 0,
                    lastPayslip: payroll[0] || null
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// ---> HR Operations: Attendance <---
// ============================================================

// --- CHECK-IN RECORDS ---

// 1. Daily Overview (Present Today, Absent, Late Arrivals, WFH)
exports.getAttendanceDailyOverview = async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

        const OFFICE_START = 9; // 9 AM — configurable
        const totalEmployees = await User.countDocuments({ role: "employee" });

        // All punch-in records today (PunchType 1 = in)
        const todayPunchIns = await Punch.find({
            PunchType: 1,
            PunchTime: { $gte: startOfDay, $lte: endOfDay }
        }).populate("userId", "name email employeeId department designation");

        // Unique present employees
        const presentMap = new Map();
        todayPunchIns.forEach(p => {
            const uid = p.userId?._id?.toString();
            if (uid && !presentMap.has(uid)) presentMap.set(uid, p);
        });
        const presentToday = presentMap.size;

        // Late Arrivals (punched in after OFFICE_START)
        let lateArrivals = 0;
        presentMap.forEach(punch => {
            const punchHour = new Date(punch.PunchTime).getHours();
            if (punchHour >= OFFICE_START + 1) lateArrivals++; // 1 hour grace
        });

        // WFH (WorkMode 2 = WFH)
        const wfhPunches = await Punch.distinct("userId", {
            PunchType: 1, WorkMode: 2,
            PunchTime: { $gte: startOfDay, $lte: endOfDay }
        });
        const wfhCount = wfhPunches.length;

        const absentCount = Math.max(0, totalEmployees - presentToday);

        res.status(200).json({
            success: true,
            data: {
                date: targetDate.toISOString().slice(0, 10),
                totalEmployees,
                presentToday,
                absent: absentCount,
                lateArrivals,
                wfh: wfhCount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Check-in Records list (Name, Team, Status, In Time, Out Time)
exports.getCheckInRecords = async (req, res) => {
    try {
        const { date, department, page = 1, limit = 30 } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

        const OFFICE_START = 9;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get all employees
        const empFilter = { role: "employee" };
        if (department) empFilter.department = department;
        const employees = await User.find(empFilter)
            .select("name email employeeId department designation")
            .skip(skip).limit(parseInt(limit));
        const totalEmps = await User.countDocuments(empFilter);

        // Get today's punches
        const todayPunches = await Punch.find({
            PunchTime: { $gte: startOfDay, $lte: endOfDay }
        });

        // Build records per employee
        const records = employees.map(emp => {
            const empPunches = todayPunches.filter(p => p.userId.toString() === emp._id.toString());
            const punchIn = empPunches.find(p => p.PunchType === 1);
            const punchOut = empPunches.filter(p => p.PunchType === 2).pop(); // last out

            let status = "Absent";
            if (punchIn) {
                const inHour = new Date(punchIn.PunchTime).getHours();
                status = inHour >= OFFICE_START + 1 ? "Late" : "Present";
            }

            return {
                employeeId: emp.employeeId,
                name: emp.name,
                team: emp.department || "—",
                status,
                inTime: punchIn ? punchIn.PunchTime : null,
                outTime: punchOut ? punchOut.PunchTime : null,
                workMode: punchIn ? punchIn.WorkMode : null // 1=Office, 2=WFH, 3=Meeting, 4=Offside
            };
        });

        res.status(200).json({
            success: true,
            data: records,
            pagination: { total: totalEmps, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(totalEmps / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- CORRECTION REQUESTS ---
const AttendanceCorrection = require("../models/attendanceCorrection.model");

// 3. Submit correction request (employee submits)
exports.submitCorrectionRequest = async (req, res) => {
    try {
        const { correctionDate, correctionTime, reason, duration } = req.body;
        const correction = new AttendanceCorrection({
            userId: req.user._id,
            correctionDate: new Date(correctionDate),
            correctionTime,
            reason,
            duration
        });
        await correction.save();
        res.status(201).json({ success: true, message: "Correction request submitted", data: correction });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Get correction requests with filter (Pending, Approved, Rejected)
exports.getCorrectionRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const requests = await AttendanceCorrection.find(filter)
            .populate("userId", "name email employeeId department designation")
            .populate("reviewedBy", "name")
            .sort({ createdAt: -1 })
            .skip(skip).limit(parseInt(limit));

        const total = await AttendanceCorrection.countDocuments(filter);

        // Format response to match the UI spec
        const formatted = requests.map(r => ({
            _id: r._id,
            employeeName: r.userId?.name,
            employeeId: r.userId?.employeeId,
            department: r.userId?.department,
            status: r.status,
            date: {
                month: new Date(r.correctionDate).toLocaleString("en", { month: "long" }),
                date: new Date(r.correctionDate).getDate(),
                year: new Date(r.correctionDate).getFullYear()
            },
            time: r.correctionTime,
            requestedCorrection: {
                date: r.correctionDate,
                time: r.correctionTime,
                reason: r.reason,
                duration: r.duration
            },
            reviewedBy: r.reviewedBy?.name || null,
            reviewedAt: r.reviewedAt,
            reviewRemarks: r.reviewRemarks,
            createdAt: r.createdAt
        }));

        res.status(200).json({
            success: true,
            data: formatted,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Review / Approve / Reject correction
exports.reviewCorrectionRequest = async (req, res) => {
    try {
        const { correctionId, status, reviewRemarks } = req.body; // status: "Approved" or "Rejected"
        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({ success: false, message: "Status must be Approved or Rejected" });
        }

        const correction = await AttendanceCorrection.findByIdAndUpdate(
            correctionId,
            { status, reviewedBy: req.user._id, reviewedAt: new Date(), reviewRemarks },
            { new: true }
        ).populate("userId", "name employeeId");

        if (!correction) return res.status(404).json({ success: false, message: "Correction request not found" });

        // If approved, update the actual punch record
        if (status === "Approved" && correction.originalPunchId) {
            await Punch.findByIdAndUpdate(correction.originalPunchId, {
                PunchTime: new Date(correction.correctionDate.toISOString().slice(0, 10) + "T" + correction.correctionTime)
            });
        }

        res.status(200).json({ success: true, message: `Correction ${status}`, data: correction });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- REPORTS ---

// 6. Attendance Reports (daily, weekly, monthly + department filter)
exports.getAttendanceReports = async (req, res) => {
    try {
        const { filter = "daily", department, date } = req.query;
        const now = date ? new Date(date) : new Date();
        let start, end;

        if (filter === "daily") {
            start = new Date(now); start.setHours(0, 0, 0, 0);
            end = new Date(now); end.setHours(23, 59, 59, 999);
        } else if (filter === "weekly") {
            const dayOfWeek = now.getDay();
            start = new Date(now); start.setDate(now.getDate() - dayOfWeek); start.setHours(0, 0, 0, 0);
            end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
        } else if (filter === "monthly") {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        const OFFICE_START = 9;

        // Build aggregation
        const pipeline = [
            { $match: { PunchType: 1, PunchTime: { $gte: start, $lte: end } } },
            { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
        ];
        if (department) pipeline.push({ $match: { "user.department": department } });

        pipeline.push({
            $group: {
                _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$PunchTime" } }, department: "$user.department" },
                totalPresent: { $addToSet: "$userId" },
                lateArrivals: {
                    $sum: { $cond: [{ $gte: [{ $hour: "$PunchTime" }, OFFICE_START + 1] }, 1, 0] }
                },
                wfhCount: {
                    $sum: { $cond: [{ $eq: ["$WorkMode", 2] }, 1, 0] }
                }
            }
        });
        pipeline.push({
            $project: {
                _id: 0, date: "$_id.date", department: "$_id.department",
                presentCount: { $size: "$totalPresent" }, lateArrivals: 1, wfhCount: 1
            }
        });
        pipeline.push({ $sort: { date: -1 } });

        const report = await Punch.aggregate(pipeline);

        res.status(200).json({
            success: true,
            filter,
            dateRange: { start, end },
            data: report
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 7. Notifications & Alerts (Late check-ins, Pending corrections)
exports.getAttendanceNotifications = async (req, res) => {
    try {
        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
        const OFFICE_START = 9;

        // Late check-ins today
        const latePunches = await Punch.find({
            PunchType: 1,
            PunchTime: { $gte: startOfDay, $lte: endOfDay }
        }).populate("userId", "name employeeId department");

        const lateAlerts = latePunches
            .filter(p => new Date(p.PunchTime).getHours() >= OFFICE_START + 1)
            .map(p => ({
                type: "late_checkin",
                message: `Late Check-in detected: ${p.userId?.name} (${p.userId?.employeeId})`,
                employee: p.userId?.name,
                employeeId: p.userId?.employeeId,
                department: p.userId?.department,
                punchTime: p.PunchTime
            }));

        // Pending correction requests
        const pendingCorrections = await AttendanceCorrection.find({ status: "Pending" })
            .populate("userId", "name employeeId department");

        const correctionAlerts = pendingCorrections.map(c => ({
            type: "correction_request",
            message: `Correction request from ${c.userId?.name} (${c.userId?.employeeId})`,
            employee: c.userId?.name,
            employeeId: c.userId?.employeeId,
            department: c.userId?.department,
            correctionDate: c.correctionDate,
            reason: c.reason,
            createdAt: c.createdAt
        }));

        res.status(200).json({
            success: true,
            data: {
                lateCheckins: lateAlerts,
                correctionRequests: correctionAlerts,
                totalAlerts: lateAlerts.length + correctionAlerts.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 8. Generate Report (returns data for PDF / share)
exports.generateAttendanceReport = async (req, res) => {
    try {
        const { startDate, endDate, department, format = "json" } = req.body;
        if (!startDate || !endDate) return res.status(400).json({ success: false, message: "startDate and endDate are required" });

        const start = new Date(startDate); start.setHours(0, 0, 0, 0);
        const end = new Date(endDate); end.setHours(23, 59, 59, 999);
        const OFFICE_START = 9;

        const empFilter = { role: "employee" };
        if (department) empFilter.department = department;
        const employees = await User.find(empFilter).select("name employeeId department designation").lean();

        const punches = await Punch.find({ PunchTime: { $gte: start, $lte: end } });

        const reportData = employees.map(emp => {
            const empPunches = punches.filter(p => p.userId.toString() === emp._id.toString());
            const punchInDays = new Set();
            let lateCount = 0;
            let wfhDays = 0;

            empPunches.forEach(p => {
                if (p.PunchType === 1) {
                    const dayStr = new Date(p.PunchTime).toDateString();
                    if (!punchInDays.has(dayStr)) {
                        punchInDays.add(dayStr);
                        if (new Date(p.PunchTime).getHours() >= OFFICE_START + 1) lateCount++;
                        if (p.WorkMode === 2) wfhDays++;
                    }
                }
            });

            return {
                name: emp.name,
                employeeId: emp.employeeId,
                department: emp.department,
                designation: emp.designation,
                totalPresent: punchInDays.size,
                lateArrivals: lateCount,
                wfhDays,
            };
        });

        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        res.status(200).json({
            success: true,
            report: {
                title: "Attendance Report",
                dateRange: { start: startDate, end: endDate },
                department: department || "All Departments",
                totalWorkingDays: totalDays,
                totalEmployees: employees.length,
                records: reportData
            },
            message: format === "pdf" ? "PDF generation can be handled on client side" : "Report generated"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---> HR Operations: Leaves <---

// 1. Get All Pending Leaves (Detailed for Pending Page)
exports.getPendingLeavesDetailed = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const pendingLeaves = await LeaveApplication.find({ ApprovalStatus: "Awaiting Approve" })
            .populate("EmployeeID", "name profileImage department employeeId")
            .sort({ createdAt: -1 })
            .skip(skip).limit(parseInt(limit));
        
        const total = await LeaveApplication.countDocuments({ ApprovalStatus: "Awaiting Approve" });

        // Map data to include duration (number of days)
        const detailedData = pendingLeaves.map(leave => {
            const start = new Date(leave.StartDate);
            const end = new Date(leave.EndDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            return {
                id: leave._id,
                employeeProfile: leave.EmployeeID?.profileImage,
                employeeName: leave.EmployeeID?.name,
                employeeId: leave.EmployeeID?.employeeId,
                department: leave.EmployeeID?.department,
                leaveType: leave.LeaveType,
                durationDays: leave.IsHalfDay ? 0.5 : diffDays,
                startDate: leave.StartDate,
                endDate: leave.EndDate,
                appliedAt: leave.createdAt,
                reason: leave.Reason
            };
        });

        res.status(200).json({ 
            success: true, 
            data: detailedData,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Get Leave Applications (with optional status filter: Pending, Approved, Rejected)
exports.getLeaveApplications = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const filter = {};
        
        // Map status names to ApprovalStatus strings
        if (status === "Pending") filter.ApprovalStatus = "Awaiting Approve";
        else if (status === "Approved") filter.ApprovalStatus = "Approved";
        else if (status === "Rejected") filter.ApprovalStatus = "Rejected";

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const requests = await LeaveApplication.find(filter)
            .populate("EmployeeID", "name department employeeId profileImage")
            .sort({ createdAt: -1 })
            .skip(skip).limit(parseInt(limit));
        
        const total = await LeaveApplication.countDocuments(filter);

        res.status(200).json({ 
            success: true, 
            data: requests,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Get Employees on Leave Today
exports.getEmployeesOnLeaveToday = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeLeaves = await LeaveApplication.find({
            ApprovalStatus: "Approved",
            StartDate: { $lte: today },
            EndDate: { $gte: today }
        }).populate("EmployeeID", "name department employeeId profileImage");

        res.status(200).json({ success: true, data: activeLeaves });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Get Leave Stats (Counts for Pending, Approved, Rejected, On Leave Today)
exports.getLeaveStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [pendingCount, approvedCount, rejectedCount, onLeaveTodayCount] = await Promise.all([
            LeaveApplication.countDocuments({ ApprovalStatus: "Awaiting Approve" }),
            LeaveApplication.countDocuments({ ApprovalStatus: "Approved" }),
            LeaveApplication.countDocuments({ ApprovalStatus: "Rejected" }),
            LeaveApplication.countDocuments({
                ApprovalStatus: "Approved",
                StartDate: { $lte: today },
                EndDate: { $gte: today }
            })
        ]);

        res.status(200).json({
            success: true,
            data: {
                pending: pendingCount,
                approved: approvedCount,
                rejected: rejectedCount,
                onLeaveToday: onLeaveTodayCount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getLeaveRequests = async (req, res) => {
    try {
        const requests = await LeaveApplication.find({ ApprovalStatus: "Awaiting Approve" }).populate("EmployeeID", "name department employeeId");
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.approveLeave = async (req, res) => {
    try {
        const { leaveId, status } = req.body; // status: "Approved" or "Rejected"
        const statusId = status === "Approved" ? 1 : 2;
        const updated = await LeaveApplication.findByIdAndUpdate(
            leaveId,
            { ApprovalStatus: status, ApprovalStatusID: statusId, ApproverID: req.user?._id, ApprovalUsername: req.user?.name },
            { new: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: "Leave application not found" });
        res.status(200).json({ success: true, message: `Leave ${status}`, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getLeaveHistory = async (req, res) => {
    try {
        const { employeeId, status } = req.query;
        const filter = {};
        if (employeeId) filter.EmployeeID = employeeId;
        if (status) filter.ApprovalStatus = status;
        const history = await LeaveApplication.find(filter).populate("EmployeeID", "name department employeeId").sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.generateLeaveReport = async (req, res) => {
    try {
        const { startDate, endDate, department, status, format = "json" } = req.body;
        
        let filter = { ApprovalStatus: { $ne: "Awaiting Approve" } }; // Focus on past records (Approved/Rejected)
        
        if (status) filter.ApprovalStatus = status;

        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate + 'T23:59:59.999Z')
            };
        }

        let applications = await LeaveApplication.find(filter)
            .populate("EmployeeID", "name department employeeId")
            .populate("ApproverID", "name")
            .sort({ createdAt: -1 })
            .lean();

        // Optional department filter
        if (department) {
            applications = applications.filter(app => app.EmployeeID?.department === department);
        }

        const reportData = applications.map(app => ({
            id: app._id,
            employeeName: app.EmployeeID?.name || "N/A",
            employeeId: app.EmployeeID?.employeeId || "N/A",
            department: app.EmployeeID?.department || "N/A",
            leaveType: app.LeaveType,
            reason: app.Reason,
            startDate: app.StartDate,
            endDate: app.EndDate,
            status: app.ApprovalStatus, // Approved or Rejected
            reviewedBy: app.ApproverID?.name || app.ApprovalUsername || "N/A",
            appliedOn: app.createdAt
        }));

        res.status(200).json({
            success: true,
            report: {
                title: "Leave History Report",
                filters: { startDate, endDate, department, status },
                totalRecords: reportData.length,
                records: reportData
            },
            message: format === "pdf" || format === "excel" ? `${format.toUpperCase()} generation can be handled on client side using this data.` : "Report generated successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---> HR Operations: Recruitment <---

// 1. Get Recruitment Dashboard Summary (Open Jobs, Candidates, Interview, Filled Roles)
// 1. Get Recruitment Dashboard Summary
exports.getRecruitmentDashboard = async (req, res) => {
    try {
        const [openJobs, totalCandidates, interviewCount, filledRoles] = await Promise.all([
            Job.countDocuments({ status: "Open" }),
            Candidate.countDocuments(),
            Candidate.countDocuments({ status: "Technical Interview" }),
            Job.countDocuments({ status: "Hired" })
        ]);

        res.status(200).json({
            success: true,
            data: { openJobs, totalCandidates, interviewCount, filledRoles }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Candidate Tracking — List all candidates with filters
exports.getCandidateTrackingList = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const filter = {};
        if (status) filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const candidates = await Candidate.find(filter)
            .select("applicantName profileImage jobTitle yearsOfExperience appliedDate status")
            .sort({ appliedDate: -1 })
            .skip(skip).limit(parseInt(limit));
        
        const total = await Candidate.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: candidates,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. View Candidate Profile — Detailed view
exports.getCandidateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const candidate = await Candidate.findById(id).populate("jobId");
        if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found" });

        res.status(200).json({ success: true, data: candidate });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Shortlist Candidate
exports.shortlistCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const candidate = await Candidate.findByIdAndUpdate(id, { 
            status: "Shortlisted",
            $push: { recruitmentProgress: { stage: "Shortlisted", remarks: "Candidate shortlisted for technical round" } }
        }, { new: true });
        res.status(200).json({ success: true, message: "Candidate shortlisted", data: candidate });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Reject Candidate
exports.rejectCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const candidate = await Candidate.findByIdAndUpdate(id, { 
            status: "Rejected",
            $push: { recruitmentProgress: { stage: "Rejected", remarks: reason || "Does not meet requirements" } }
        }, { new: true });
        res.status(200).json({ success: true, message: "Candidate rejected", data: candidate });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. Technical Interview Stage
exports.updateTechnicalInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, interviewer, score, feedback, passed } = req.body;
        
        const status = passed ? "Selected" : "Rejected";
        const progressStage = passed ? "Technical Interview Passed" : "Technical Interview Failed";

        const candidate = await Candidate.findByIdAndUpdate(id, {
            status: passed ? "Selected" : "Rejected",
            technicalInterview: { date, interviewer, score, feedback, status: passed ? "Passed" : "Failed" },
            $push: { recruitmentProgress: { stage: progressStage, remarks: feedback } }
        }, { new: true });

        res.status(200).json({ success: true, message: "Technical interview updated", data: candidate });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 7. Select Candidate (Move to Offer Stage)
exports.selectCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const candidate = await Candidate.findByIdAndUpdate(id, { 
            status: "Selected",
            $push: { recruitmentProgress: { stage: "Selected", remarks: "Final selection completed" } }
        }, { new: true });
        res.status(200).json({ success: true, message: "Candidate selected", data: candidate });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 8. Send Offer Letter (Trigger logic)
exports.sendOfferLetter = async (req, res) => {
    try {
        const { id } = req.params;
        // Placeholder for logic (e.g., email service)
        const candidate = await Candidate.findByIdAndUpdate(id, { 
            $push: { recruitmentProgress: { stage: "Offer Sent", remarks: "Offer letter sent via email" } }
        }, { new: true });
        res.status(200).json({ success: true, message: "Offer letter sent successfully", data: candidate });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 9. Get Recent Candidates
exports.getRecentCandidatesDetail = async (req, res) => {
    try {
        const candidates = await Candidate.find()
            .sort({ appliedDate: -1 })
            .limit(10)
            .select("applicantName profileImage status jobTitle yearsOfExperience location appliedDate");

        res.status(200).json({ success: true, data: candidates });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 10. Review Applications — New applications needing attention
exports.getReviewApplications = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Fetch only those in 'Applied' status and populate Job details
        const applications = await Candidate.find({ status: "Applied" })
            .populate("jobId", "department type") // team and work mode
            .sort({ appliedDate: -1 })
            .skip(skip).limit(parseInt(limit));
        
        const total = await Candidate.countDocuments({ status: "Applied" });

        res.status(200).json({
            success: true,
            data: applications,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 11. Schedule Interview Action
exports.scheduleTechnicalInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, interviewer } = req.body;

        const candidate = await Candidate.findByIdAndUpdate(id, { 
            status: "Technical Interview",
            "technicalInterview.date": date,
            "technicalInterview.interviewer": interviewer,
            $push: { recruitmentProgress: { stage: "Interview Scheduled", remarks: `Technical interview scheduled with ${interviewer} on ${date}` } }
        }, { new: true });

        res.status(200).json({ success: true, message: "Interview scheduled", data: candidate });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 12. Job Management (Internal for HR)
exports.addJob = async (req, res) => {
    try {
        const job = new Job(req.body);
        await job.save();
        res.status(201).json({ success: true, message: "Job posted", data: job });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getJobs = async (req, res) => {
    try {
        const jobs = await Job.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---> HR Operations: Performance <---

// 1. Performance Dashboard Stats (Monthly)
exports.getPerformanceDashboard = async (req, res) => {
    try {
        const { month, year } = req.query; // e.g. "2023-10", 2023
        const filter = {};
        if (month) filter.month = month;
        if (year) filter.year = parseInt(year);

        const performances = await Performance.find(filter).populate("userId", "name department");

        if (performances.length === 0) {
            return res.status(200).json({
                success: true,
                data: { averageScore: 0, topPerformer: null, onTarget: 0, belowTarget: 0 }
            });
        }

        let totalScore = 0;
        let topPerformer = performances[0];
        let onTargetCount = 0;
        let belowTargetCount = 0;

        performances.forEach(p => {
            totalScore += p.overallScore;
            // Top performer check
            if (p.overallScore > topPerformer.overallScore) {
                topPerformer = p;
            }
            // Status check
            if (p.status === "On Target" || p.status === "Exceeding") {
                onTargetCount++;
            } else {
                belowTargetCount++;
            }
        });

        res.status(200).json({
            success: true,
            data: {
                averageScore: (totalScore / performances.length).toFixed(1),
                topPerformer: {
                    name: topPerformer.userId?.name,
                    department: topPerformer.userId?.department,
                    score: topPerformer.overallScore.toFixed(1)
                },
                onTarget: onTargetCount,
                belowTarget: belowTargetCount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Performance Employee List
exports.getPerformanceList = async (req, res) => {
    try {
        const { month, department } = req.query;
        let query = {};
        if (month) query.month = month;

        let perfs = await Performance.find(query)
            .populate("userId", "name department profileImage")
            .sort({ overallScore: -1 });

        // Filter by department if provided (since department is in the populated User model)
        if (department) {
            perfs = perfs.filter(p => p.userId && p.userId.department === department);
        }

        const data = perfs.map(p => ({
            id: p._id,
            profileImage: p.userId?.profileImage,
            name: p.userId?.name,
            department: p.userId?.department,
            score: p.overallScore.toFixed(1),
            progress: p.targetPercentage, // target completion %
            status: p.status
        }));

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Performance Feedback Section Summary
exports.getPerformanceFeedbackStats = async (req, res) => {
    try {
        const stats = await Performance.aggregate([
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: "$rating" },
                    completedCount: { $count: {} }
                }
            }
        ]);

        const result = stats.length > 0 ? {
            avgRating: stats[0].avgRating.toFixed(1),
            completedReviews: stats[0].completedCount
        } : { avgRating: 0, completedReviews: 0 };

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Performance Recent Reviews List
exports.getRecentFeedbackList = async (req, res) => {
    try {
        const reviews = await Performance.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("userId", "name department profileImage")
            .populate("reviewer", "name designation");

        const data = reviews.map(r => ({
            id: r._id,
            profileImage: r.userId?.profileImage,
            name: r.userId?.name,
            department: r.userId?.department,
            status: "Completed",
            reviewName: r.reviewTitle || "Monthly Performance Review",
            jobRole: r.userId?.designation || "Employee",
            description: r.feedback,
            rating: r.rating,
            reviewer: {
                name: r.reviewerName || r.reviewer?.name,
                role: r.reviewerRole || r.reviewer?.designation
            },
            date: r.createdAt
        }));

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Performance Report Summary
exports.getPerformanceReportSummary = async (req, res) => {
    try {
        const stats = await Performance.aggregate([
            {
                $group: {
                    _id: null,
                    avgScore: { $avg: "$overallScore" },
                    totalReports: { $count: {} }
                }
            }
        ]);

        const data = stats.length > 0 ? {
            avgScore: stats[0].avgScore.toFixed(1),
            totalReports: stats[0].totalReports
        } : { avgScore: 0, totalReports: 0 };

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. Performance Monthly Trends (Dataset for charts)
exports.getPerformanceTrends = async (req, res) => {
    try {
        const trends = await Performance.aggregate([
            {
                $group: {
                    _id: { month: "$month", year: "$year" },
                    avgScore: { $avg: "$overallScore" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
            { $limit: 12 } // Last 12 months
        ]);

        const data = trends.map(t => ({
            month: t._id.month,
            avgScore: t.avgScore.toFixed(1)
        }));

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 7. Generate Performance Report (PDF/Excel)
exports.generatePerformanceReport = async (req, res) => {
    try {
        const { type, month, year, department } = req.body; // type: 'PDF' | 'EXCEL'
        
        // Fetch data based on filters
        let query = {};
        if (month) query.month = month;
        if (year) query.year = year;

        const data = await Performance.find(query).populate("userId", "name department employeeId");

        // Logic placeholder for generation
        // ... (use libraries like exceljs or pdfkit)

        res.status(200).json({ 
            success: true, 
            message: `${type} Report for ${month || 'all time'} ready for download`,
            downloadUrl: `http://api.hrms.com/reports/performance_${Date.now()}.${type.toLowerCase()}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addFeedback = async (req, res) => {
    try {
        const performance = new Performance(req.body);
        await performance.save();
        res.status(201).json({ success: true, message: "Feedback added", data: performance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---> HR Operations: Finance <---

// 1. Get Salary Processing List (Show all employees for the month)
exports.getSalaryProcessingList = async (req, res) => {
    try {
        const { month, year } = req.query; // e.g. "October", 2023
        
        // Find existing payrolls for the criteria
        let payrolls = await Payroll.find({ month, year })
            .populate("userId", "name department designation profileImage");

        if (payrolls.length === 0) {
            // If No records for this month yet, suggest creating them from User's base salaries
            const users = await User.find({ isTerminated: { $ne: true } }).select("name department designation profileImage financialDetails");
            
            payrolls = users.map(user => ({
                userId: user,
                month,
                year,
                basicSalary: user.financialDetails?.currentBaseSalary || 0,
                bonus: 0,
                deductions: 0,
                netPay: user.financialDetails?.currentBaseSalary || 0,
                status: "Pending"
            }));
        }

        res.status(200).json({ success: true, data: payrolls });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Create/Update a salary record (Manual adjustment)
exports.processSalary = async (req, res) => {
    try {
        const { userId, month, year, basicSalary, bonus, deductions, status = "Processed" } = req.body;
        
        const netPay = (Number(basicSalary) + Number(bonus || 0)) - Number(deductions || 0);

        const payroll = await Payroll.findOneAndUpdate(
            { userId, month, year },
            { basicSalary, bonus, deductions, netPay, status },
            { upsert: true, new: true }
        );

        res.status(201).json({ success: true, message: "Salary record saved", data: payroll });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Get Payslip
exports.getPayslip = async (req, res) => {
    try {
        const { id } = req.params; // payroll ID
        const payslip = await Payroll.findById(id).populate("userId");
        res.status(200).json({ success: true, data: payslip });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---> HR Operations: Resignation <---
exports.submitResignation = async (req, res) => {
    try {
        const { userId, reason, noticePeriodDays } = req.body;
        const reqData = new Resignation({ userId, reason, noticePeriodDays });
        await reqData.save();
        res.status(201).json({ success: true, message: "Resignation submitted", data: reqData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getResignations = async (req, res) => {
    try {
        const list = await Resignation.find().populate("userId", "name department");
        res.status(200).json({ success: true, data: list });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.processExit = async (req, res) => {
    try {
        const { resignationId, status, managerRemarks } = req.body;
        const exitData = await Resignation.findByIdAndUpdate(resignationId, { status, managerRemarks }, { new: true });
        res.status(200).json({ success: true, message: "Exit Processed", data: exitData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---> HR Operations: Analytics <---
exports.getAnalyticsReport = async (req, res) => {
    try {
        // Dept-wise employee counts
        const deptAttendance = await User.aggregate([
            { $match: { department: { $ne: null } } },
            { $group: { _id: "$department", totalEmployees: { $sum: 1 } } }
        ]);
        
        const deptPerformance = await User.aggregate([
            {
                $lookup: {
                    from: "performances",
                    localField: "_id",
                    foreignField: "userId",
                    as: "perf"
                }
            },
            { $unwind: { path: "$perf", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$department",
                    avgEfficiency: { $avg: "$perf.efficiencyScore" },
                    avgQuality: { $avg: "$perf.qualityScore" },
                    avgReliability: { $avg: "$perf.reliabilityScore" }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                attendanceByDepartment: deptAttendance,
                performanceAvgByDepartment: deptPerformance
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Attendance Analytics
exports.getAttendanceAnalytics = async (req, res) => {
    try {
        const { department, startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        const matchStage = { PunchTime: { $gte: start, $lte: end } };

        const pipeline = [
            { $match: matchStage },
            { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
        ];
        if (department) pipeline.push({ $match: { "user.department": department } });
        pipeline.push(
            {
                $group: {
                    _id: { department: "$user.department", date: { $dateToString: { format: "%Y-%m-%d", date: "$PunchTime" } } },
                    uniqueEmployees: { $addToSet: "$userId" }
                }
            },
            {
                $group: {
                    _id: "$_id.department",
                    dailyRecords: { $push: { date: "$_id.date", presentCount: { $size: "$uniqueEmployees" } } }
                }
            }
        );

        const result = await Punch.aggregate(pipeline);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Performance Analytics
exports.getPerformanceAnalytics = async (req, res) => {
    try {
        const { department, month, year } = req.query;
        const filter = {};
        if (month) filter.month = month;
        if (year) filter.year = parseInt(year);

        const pipeline = [
            { $match: filter },
            { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
        ];
        if (department) pipeline.push({ $match: { "user.department": department } });
        pipeline.push({
            $group: {
                _id: "$user.department",
                avgEfficiency: { $avg: "$efficiencyScore" },
                avgQuality: { $avg: "$qualityScore" },
                avgReliability: { $avg: "$reliabilityScore" },
                totalReviews: { $sum: 1 }
            }
        });

        const result = await Performance.aggregate(pipeline);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
