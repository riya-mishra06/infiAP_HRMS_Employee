import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertCircle,
  MoreHorizontal,
  MapPin,
  TrendingUp,
  FileText,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLeaveRequests, approveLeave } from '../../../services/hrApi';
import { API_CONFIG } from '../../../config.js';

const LeaveApproval = () => {
    const navigate = useNavigate();
    const [managerNote, setManagerNote] = useState('');
    const [status, setStatus] = useState('Pending Review');
    const [leaveRequest, setLeaveRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
      const fetchLeaveRequest = async () => {
        try {
          const res = await getLeaveRequests({ status: 'Pending', limit: 1 });
          const leaves = res.data?.data || [];
          // debug log removed
          // debug log removed
          if (leaves.length > 0) {
            const leave = leaves[0];
            // debug log removed
            // debug log removed
            // debug log removed
            const start = new Date(leave.StartDate);
            const end = new Date(leave.EndDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            setLeaveRequest({
              id: leave._id,
              employeeName: leave.EmployeeID?.name || 'Unknown Employee',
              employeeId: leave.EmployeeID?.employeeId || 'N/A',
              department: leave.EmployeeID?.department || 'N/A',
              profileImage: leave.EmployeeID?.profileImage || null,
              type: leave.LeaveType,
              days: leave.IsHalfDay ? 0.5 : diffDays,
              range: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
              reason: leave.Reason,
              submittedAt: new Date(leave.createdAt).toLocaleString(),
            });
          }
        } catch (err) {
          // debug error removed
        } finally {
          setLoading(false);
        }
      };
      fetchLeaveRequest();
    }, []);

    const handleApprove = async () => {
      if (!leaveRequest) return;
      setSubmitting(true);
      try {
        await approveLeave({ leaveId: leaveRequest.id, status: 'Approved' });
        setStatus('Approved');
        setTimeout(() => navigate('/leave/requests'), 1000);
      } catch (err) {
        // debug error removed
      } finally {
        setSubmitting(false);
      }
    };

    const handleReject = async () => {
      if (!leaveRequest) return;
      setSubmitting(true);
      try {
        await approveLeave({ leaveId: leaveRequest.id, status: 'Rejected' });
        setStatus('Rejected');
        setTimeout(() => navigate('/leave/requests'), 1000);
      } catch (err) {
        // debug error removed
      } finally {
        setSubmitting(false);
      }
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
        </div>
      );
    }

    if (!leaveRequest) {
      return (
        <div className="flex flex-col h-[calc(100vh-120px)] items-center justify-center">
          <p className="text-slate-600 mb-4">No pending leave requests</p>
          <button 
            onClick={() => navigate('/leave/requests')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Back to Requests
          </button>
        </div>
      );
    }

    const employee = {
        name: leaveRequest.employeeName,
        id: leaveRequest.employeeId,
        dept: leaveRequest.department,
        role: 'Employee',
        profileImage: leaveRequest.profileImage,
        stats: {
            taken: 12,
            remaining: 18,
            trend: '-2% from last year'
        }
    };

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    };

    const getProfileImage = (image) => {
        if (!image) return null;
        // If it's a base64 string, return it as is
        if (image.startsWith('data:image')) return image;
        // If it's a relative path starting with /uploads, prefix with backend URL
        if (image.startsWith('/uploads')) return `${API_CONFIG.baseURL}${image}`;
        // If it's a relative path without /, prefix with backend URL
        if (!image.startsWith('http')) return `${API_CONFIG.baseURL}/uploads/${image}`;
        return image;
    };

    const request = {
        type: leaveRequest.type,
        range: leaveRequest.range,
        totalDays: leaveRequest.days,
        reason: leaveRequest.reason,
        submittedAt: leaveRequest.submittedAt
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] w-full gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative pt-4 overflow-hidden">
            
            {/* Context Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/leave/requests')}
                        className="p-4 bg-white border border-slate-100 text-slate-400 hover:text-slate-800 rounded-2xl shadow-sm transition-all hover:-translate-x-1"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-2">Request Diagnostic</h1>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 leading-none">Final Review Queue • {status}</p>
                    </div>
                </div>
                
                <div className="bg-white border border-slate-100 flex items-center divide-x divide-slate-100 rounded-2xl shadow-soft overflow-hidden">
                    <div className="px-8 py-3 flex flex-col items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Taken</span>
                        <span className="text-sm font-black text-slate-800 tracking-tighter">{employee.stats.taken} Days</span>
                    </div>
                    <div className="px-8 py-3 flex flex-col items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Remaining</span>
                        <span className="text-sm font-black text-emerald-600 tracking-tighter">{employee.stats.remaining} Days</span>
                    </div>
                </div>
            </div>

            {/* Diagnostic Workspace Split */}
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-8 overflow-hidden min-h-0">
                
                {/* 1. LEFT: Employee Intelligence & Metrics */}
                <div className="xl:col-span-1 flex flex-col gap-6 overflow-y-auto no-scrollbar pb-10">
                    <div className="bg-white p-8 border border-slate-100 shadow-sm rounded-3xl relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col items-center">
                            {/* Profile Image */}
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 p-1 mb-6 group-hover:scale-105 transition-all shadow-xl">
                                {employee.profileImage ? (
                                    <img
                                        src={getProfileImage(employee.profileImage)}
                                        className="w-full h-full rounded-full border-4 border-white object-cover"
                                        alt={employee.name}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = `<div class="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center border-4 border-white"><span class="text-3xl font-black text-white">${getInitials(employee.name)}</span></div>`;
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center border-4 border-white">
                                        <span className="text-3xl font-black text-white">{getInitials(employee.name)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Employee Name & Role */}
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">{employee.name}</h2>
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-6">{employee.role}</p>

                            {/* Employee Info Cards */}
                            <div className="w-full space-y-3">
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 hover:border-indigo-200 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                            <ShieldCheck size={16} className="text-indigo-600" />
                                        </div>
                                        <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Employee ID</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-800">{employee.id}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 hover:border-indigo-200 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                            <MapPin size={16} className="text-indigo-600" />
                                        </div>
                                        <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Department</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-800">{employee.dept}</span>
                                </div>
                            </div>
                        </div>
                        {/* Decorative background */}
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                            <ShieldCheck size={80} className="text-indigo-600" />
                        </div>
                    </div>

                    <div className="card-soft bg-slate-900 p-8 text-white relative overflow-hidden mt-auto">
                        <TrendingUp size={24} className="text-emerald-400 mb-4" />
                        <h4 className="text-sm font-black uppercase tracking-widest mb-2">Diagnostic Insight</h4>
                        <p className="text-[10px] opacity-60 font-medium leading-relaxed uppercase tracking-widest mb-6">
                            {employee.name} carries an 18% lower absence rate compared to the {employee.dept} average this cycle.
                        </p>
                        <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">View Statistics</button>
                    </div>
                </div>

                {/* 2. RIGHT: Request Breakdown & Action */}
                <div className="xl:col-span-2 flex flex-col bg-white border border-slate-100 rounded-[44px] shadow-soft overflow-hidden min-h-0">
                    <div className="px-12 py-10 border-b border-slate-50 flex items-center justify-between bg-slate-100/30">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Diagnostic Target</p>
                            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Leave Request Details</h3>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <Calendar size={14} className="text-primary-500" />
                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Submission: {request.submittedAt}</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar">
                        <section className="grid grid-cols-2 gap-8">
                            <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 hover:border-primary-100 transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-white rounded-2xl text-primary-600 shadow-sm"><FileText size={20} /></div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Absence Category</h4>
                                </div>
                                <p className="text-xl font-black text-slate-800 tracking-tight uppercase underline decoration-primary-300 decoration-4">{request.type}</p>
                            </div>
                            <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 hover:border-emerald-100 transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm"><Clock size={20} /></div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration Diagnostic</h4>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-black text-slate-800 tracking-tight uppercase">{request.totalDays}</span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Working Days</span>
                                    </div>
                                    <div className="w-px h-10 bg-slate-200"></div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-800 tracking-tight uppercase">{request.range}</span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Range</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare size={14} className="text-primary-500" />
                                Reason for Absence
                            </h4>
                            <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm italic text-slate-600 text-sm font-medium leading-relaxed border-l-8 border-l-primary-500">
                                "{request.reason}"
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle2 size={14} className="text-emerald-500" />
                                Manager Recommendation
                            </h4>
                            <textarea 
                                className="w-full bg-slate-50 border border-slate-100 focus:border-primary-100 outline-none rounded-[32px] p-8 text-sm font-medium text-slate-600 transition-all focus:ring-0 placeholder:text-slate-300 placeholder:italic"
                                placeholder="Add your notes or recommendation here for official records..."
                                rows="4"
                                value={managerNote}
                                onChange={(e) => setManagerNote(e.target.value)}
                            />
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-4 flex items-center gap-2">
                                <AlertCircle size={10} />
                                Optional: feedback is visible to the employee and higher management.
                            </p>
                        </section>
                    </div>

                    <div className="p-12 border-t border-slate-50 bg-slate-900 flex items-center gap-6">
                        <button 
                            onClick={handleApprove}
                            disabled={submitting}
                            className="flex-1 py-5 bg-white text-slate-900 font-black rounded-3xl hover:bg-slate-50 transition-all shadow-2xl uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} className="text-emerald-500" />}
                            {submitting ? 'Processing...' : 'Approve Leave'}
                        </button>
                        <button 
                            onClick={handleReject}
                            disabled={submitting}
                            className="flex-1 py-5 bg-white/10 text-white font-black rounded-3xl hover:bg-white/20 transition-all uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} className="text-rose-400" />}
                            {submitting ? 'Processing...' : 'Reject Request'}
                        </button>
                        <button className="p-5 bg-white/10 text-white hover:bg-white/20 rounded-3xl transition-all shadow-2xl active:scale-95">
                            <MoreHorizontal size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaveApproval;
