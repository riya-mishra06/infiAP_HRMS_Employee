import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
   Activity,
   BellRing,
   ChevronRight,
   Clock3,
   CircleDot,
   Loader2,
   PlusCircle,
   Send,
   Sparkles,
   TrendingUp,
   User,
   UserCheck,
   UserPlus,
   Users,
   Briefcase,
} from 'lucide-react';
import { hrService } from '../../services/hr.service';

const toNumber = (...values) => {
   for (const value of values) {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value);
   }
   return 0;
};

const Dashboard = () => {
   const navigate = useNavigate();
   const [loading, setLoading] = useState(true);
   const [summaryData, setSummaryData] = useState({
      employees: 0,
      activeJobs: 0,
      attendanceToday: 0,
      leavePending: 0,
      pendingCorrections: 0,
      onLeaveToday: 0,
   });
   const [pendingLeaves, setPendingLeaves] = useState([]);
   const [error, setError] = useState(null);

   useEffect(() => {
      const fetchData = async () => {
         setLoading(true);
         setError(null);

         try {
            const [summaryRes, recruitmentRes, attendanceRes, leaveStatsRes, attendanceNotificationsRes, todayLeavesRes, pendingLeavesRes] =
               await Promise.all([
                  hrService.getDashboardSummary().catch(() => ({ success: false })),
                  hrService.getRecruitmentDashboard().catch(() => ({ success: false })),
                  hrService.getAttendanceDailyOverview().catch(() => ({ success: false })),
                  hrService.getLeaveStats().catch(() => ({ success: false })),
                  hrService.getAttendanceNotifications().catch(() => ({ success: false })),
                  hrService.getTodayLeaves().catch(() => ({ success: false })),
                  hrService.getPendingLeaves().catch(() => ({ success: false })),
               ]);

            const summary = summaryRes?.success ? summaryRes.data : {};
            const recruitment = recruitmentRes?.success ? recruitmentRes.data : {};
            const attendance = attendanceRes?.success ? attendanceRes.data : {};
            const leaveStats = leaveStatsRes?.success ? leaveStatsRes.data : {};
            const attendanceNotifications = attendanceNotificationsRes?.success ? attendanceNotificationsRes.data : {};
            const todayLeaves = todayLeavesRes?.success ? (todayLeavesRes.data || []) : [];
            const pendingLeaveList = pendingLeavesRes?.success ? (pendingLeavesRes.data || []) : [];

            const employees = toNumber(summary.totalEmployees, summary.employeeCount, summary.employees);
            const activeJobs = toNumber(recruitment.openJobs, recruitment.totalOpenJobs, recruitment.jobs, recruitment.count);
            const attendanceToday = toNumber(attendance.presentToday, attendance.presentCount, summary.presentCount, attendance.count, attendance.present);
            const leavePending = toNumber(leaveStats.pending, leaveStats.leavePending);
            const pendingCorrections = toNumber(
               attendanceNotifications.correctionRequests?.length,
               attendanceNotifications.pendingCorrections,
               attendanceNotifications.totalCorrections
            );
            const onLeaveToday = toNumber(leaveStats.onLeaveToday, todayLeaves?.length, todayLeaves?.count);

            setSummaryData({
               employees,
               activeJobs,
               attendanceToday,
               leavePending,
               pendingCorrections,
               onLeaveToday,
            });
            setPendingLeaves(Array.isArray(pendingLeaveList) ? pendingLeaveList : []);
         } catch (fetchError) {
            setError(fetchError?.message || 'Failed to load dashboard data');
         } finally {
            setLoading(false);
         }
      };

      fetchData();
   }, []);

   const stats = useMemo(() => ([
      {
         title: 'Employees',
         value: summaryData.employees,
         icon: Users,
         trend: '+0',
         color: 'text-emerald-600',
         bg: 'bg-emerald-50',
      },
      {
         title: 'Active Jobs',
         value: summaryData.activeJobs,
         icon: Briefcase,
         trend: '+0',
         color: 'text-amber-500',
         bg: 'bg-amber-50',
      },
      {
         title: 'Attendance Today',
         value: summaryData.attendanceToday,
         icon: UserCheck,
         trend: 'Today',
         color: 'text-indigo-600',
         bg: 'bg-indigo-50',
      },
      {
         title: 'Leave Pending',
         value: summaryData.leavePending,
         icon: Clock3,
         trend: 'Pending',
         color: 'text-rose-500',
         bg: 'bg-rose-50',
      },
      {
         title: 'Pending Corrections',
         value: summaryData.pendingCorrections,
         icon: BellRing,
         trend: 'Review',
         color: 'text-fuchsia-500',
         bg: 'bg-fuchsia-50',
      },
      {
         title: 'On Leave Today',
         value: summaryData.onLeaveToday,
         icon: UserPlus,
         trend: 'Today',
         color: 'text-cyan-600',
         bg: 'bg-cyan-50',
      },
   ]), [summaryData]);

   const recentActivity = [
      { title: `${summaryData.employees} employees currently in the system`, time: 'Live', type: 'SYSTEM' },
      { title: `${summaryData.activeJobs} active jobs waiting for candidates`, time: 'Live', type: 'HIRING' },
      { title: `${summaryData.pendingCorrections} attendance corrections waiting for review`, time: 'Live', type: 'ATTENDANCE' },
      { title: `${summaryData.onLeaveToday} employees on leave today`, time: 'Live', type: 'LEAVE' },
   ];

   const pendingLeave = pendingLeaves[0];

   const StatCard = ({ title, value, trend, icon: Icon, color, bg }) => (
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-50 transition-all">
         <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
               {Icon ? <Icon size={18} /> : <div className="w-5 h-5 bg-slate-200 rounded-full" />}
            </div>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-widest">{trend}</span>
         </div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">{title}</p>
         <h3 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">
            {loading ? <Loader2 size={24} className="animate-spin text-slate-300" /> : value}
         </h3>
      </div>
   );

   return (
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-40">
         <div className="flex items-center justify-between border-b border-slate-50 pb-8">
            <div>
               <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-2">HR Management Console</h1>
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Operational Insights & Workforce Orchestration</p>
            </div>
            <button
               onClick={() => navigate('/employees/add')}
               className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-indigo-600 transition-all active:scale-95"
            >
               <PlusCircle size={14} /> New Employee
            </button>
         </div>

         {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
               {error}
            </div>
         ) : null}

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {stats.map((stat, i) => (
               <StatCard key={i} {...stat} />
            ))}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
               <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                  <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                     <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Precision Actions</h3>
                     <button onClick={() => navigate('/employees')} className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.1em] hover:underline">
                        Full Directory
                     </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     {[
                        { label: 'My Profile', icon: User, path: '/profile' },
                        { label: 'View Attendance', icon: UserCheck, path: '/attendance' },
                        { label: 'Job Posting', icon: Send, path: '/recruitment/post-job' },
                     ].map((action, i) => (
                        <button
                           key={i}
                           onClick={() => navigate(action.path)}
                           className="flex items-center gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-50/50 transition-all group"
                        >
                           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm transition-transform group-hover:scale-110">
                              <action.icon size={18} />
                           </div>
                           <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{action.label}</span>
                        </button>
                     ))}
                  </div>
               </div>

               <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                  <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                     <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Operational Stream</h3>
                     <Activity size={16} className="text-slate-300" />
                  </div>
                  <div className="space-y-4">
                     {recentActivity.map((activity, i) => (
                        <div key={i} className="flex items-start gap-5 p-4 rounded-2xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-100">
                           <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                              <CircleDot size={14} className="animate-pulse" />
                           </div>
                           <div className="flex-1">
                              <p className="text-[11px] font-black text-slate-800 leading-relaxed uppercase tracking-tight">{activity.title}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{activity.time}</span>
                                 <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">#{activity.type}</span>
                              </div>
                           </div>
                           <ChevronRight size={14} className="text-slate-200 mt-2" />
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
               <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                  <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                     <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Pending Approvals</h3>
                     <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg uppercase tracking-widest">
                        {summaryData.leavePending} Pending
                     </span>
                  </div>
                  {pendingLeave ? (
                     <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">
                              {(pendingLeave.employeeName || pendingLeave.name || 'U')[0]}
                           </div>
                           <div>
                              <p className="text-xs font-black text-slate-800 uppercase tracking-tight mb-0.5">{pendingLeave.employeeName || pendingLeave.name || 'Unknown'}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                 {pendingLeave.type || pendingLeave.leaveType || 'Leave'}
                              </p>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           <button
                              onClick={() => navigate('/leave/approval')}
                              className="py-3 bg-white border border-slate-200 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all"
                           >
                              Review
                           </button>
                           <button
                              onClick={() => navigate('/leave/approval')}
                              className="py-3 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-slate-900 transition-all"
                           >
                              Manage
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <p className="text-xs font-bold text-slate-400">No pending leave requests</p>
                     </div>
                  )}
               </div>

               <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl shadow-slate-100 relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Insights</h3>
                     <Sparkles size={16} className="text-indigo-400" />
                  </div>
                  <p className="text-lg font-black tracking-tight leading-tight uppercase">
                     {summaryData.employees} employees across the organization with{' '}
                     <span className="text-emerald-400">{summaryData.activeJobs} open</span> positions.
                  </p>
                  <div className="mt-8 flex items-center gap-3">
                     <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                        <TrendingUp size={16} className="text-white" />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {summaryData.pendingCorrections} corrections waiting for review
                     </span>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-[80px]"></div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Dashboard;
