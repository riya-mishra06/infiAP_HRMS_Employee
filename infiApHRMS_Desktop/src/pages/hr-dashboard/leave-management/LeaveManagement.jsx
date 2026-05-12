import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  Search,
  UserCheck,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getLeaveRequests,
  getLeaveStats,
  getPendingDetailedLeaves,
  getTodayLeaves
} from '../../../services/hrApi';

const getPayloadArray = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.requests)) return payload.requests;
  if (Array.isArray(payload.leaves)) return payload.leaves;
  return [];
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const normalizeLeave = (leave, index) => {
  const employee = leave.employee || leave.user || {};
  const startDate = leave.startDate || leave.fromDate || leave.dateFrom || leave.leaveStartDate;
  const endDate = leave.endDate || leave.toDate || leave.dateTo || leave.leaveEndDate || startDate;
  const employeeName = leave.employeeName || leave.name || employee.name || employee.fullName || 'Unknown Employee';

  return {
    id: leave._id || leave.id || leave.leaveId || `LEAVE-${index + 1}`,
    employeeName,
    employeeId: leave.employeeId || employee.employeeId || employee.empId || 'N/A',
    department: leave.department || employee.department || leave.dept || 'N/A',
    leaveType: leave.leaveType || leave.type || leave.category || 'Leave',
    startDate,
    endDate,
    dateRange: startDate === endDate ? formatDate(startDate) : `${formatDate(startDate)} - ${formatDate(endDate)}`,
    days: leave.days || leave.totalDays || leave.duration || 1,
    status: leave.status || 'Pending',
    reason: leave.reason || leave.Reason || leave.description || 'No reason provided',
    requestedAt: leave.requestedAt || leave.createdAt || leave.appliedAt
  };
};

const statusStyles = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200'
};

const LeaveManagement = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, onLeaveToday: 0 });
  const [pendingCount, setPendingCount] = useState(0);
  const [activeStatus, setActiveStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsRes, requestsRes, pendingRes, todayRes] = await Promise.all([
        getLeaveStats(),
        getLeaveRequests(),
        getPendingDetailedLeaves(),
        getTodayLeaves()
      ]);

      const statsPayload = statsRes.data?.data || statsRes.data || {};
      const requestRows = getPayloadArray(requestsRes).map(normalizeLeave);
      const pendingRows = getPayloadArray(pendingRes);
      const todayRows = getPayloadArray(todayRes);

      setRequests(requestRows);
      setPendingCount(pendingRows.length || Number(statsPayload.pending || 0));
      setStats({
        pending: Number(statsPayload.pending ?? requestRows.filter((item) => item.status === 'Pending').length),
        approved: Number(statsPayload.approved ?? requestRows.filter((item) => item.status === 'Approved').length),
        rejected: Number(statsPayload.rejected ?? requestRows.filter((item) => item.status === 'Rejected').length),
        onLeaveToday: Number(statsPayload.onLeaveToday ?? todayRows.length)
      });
    } catch (err) {
      // debug error removed
      setError('Unable to load leave data. Please refresh once the HR API is available.');
      setRequests([]);
      setStats({ pending: 0, approved: 0, rejected: 0, onLeaveToday: 0 });
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus = activeStatus === 'All' || request.status === activeStatus;
      const matchesSearch = !query || [
        request.employeeName,
        request.employeeId,
        request.department,
        request.leaveType,
        request.reason,
        request.status
      ].some((value) => String(value).toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [activeStatus, requests, searchQuery]);

  const statCards = [
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', status: 'Pending' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-600', status: 'Approved' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-rose-600', status: 'Rejected' },
    { label: 'On Leave Today', value: stats.onLeaveToday, icon: UserCheck, color: 'text-blue-600', status: 'All' }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full gap-6 pt-4 overflow-hidden text-left">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Leave Management</h1>
          <p className="text-sm text-slate-500 mt-1">Live leave requests, approval status, and today&apos;s absence count.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/leave/history')}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all"
          >
            History
          </button>
          <button
            onClick={fetchLeaveData}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-60 flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
        {statCards.map((card) => (
          <button
            key={card.label}
            onClick={() => setActiveStatus(card.status)}
            className={`bg-white border rounded-2xl p-5 text-left transition-all hover:border-slate-300 ${
              activeStatus === card.status ? 'border-slate-900 shadow-sm' : 'border-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
              <card.icon size={20} className={card.color} />
            </div>
            <p className="text-3xl font-black text-slate-900 mt-4">{card.value}</p>
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                  activeStatus === status
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-80">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search employee, department, leave type"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
            />
          </div>
        </div>

        {error && (
          <div className="m-5 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3 text-sm font-semibold">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Leave</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Dates</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-14 text-center text-sm font-bold text-slate-500">
                    Loading real leave data...
                  </td>
                </tr>
              ) : filteredRequests.length ? (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-900">{request.employeeName}</p>
                      <p className="text-xs text-slate-500 mt-1">{request.department} • {request.employeeId}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-800">{request.leaveType}</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-md truncate">{request.reason}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Calendar size={16} className="text-slate-400" />
                        {request.dateRange}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{request.days} day(s)</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-black ${statusStyles[request.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => navigate('/leave/approval')}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-900 hover:text-white transition-all"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-14 text-center">
                    <p className="text-sm font-black text-slate-700">No leave requests found</p>
                    <p className="text-xs text-slate-400 mt-1">The table only shows data returned by the HR API.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-slate-500">
          <span>{filteredRequests.length} visible of {requests.length} leave request(s)</span>
          <div className="flex items-center gap-4">
            <span>{pendingCount} pending detailed approval(s)</span>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
            >
              <Download size={14} />
              Export View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;
