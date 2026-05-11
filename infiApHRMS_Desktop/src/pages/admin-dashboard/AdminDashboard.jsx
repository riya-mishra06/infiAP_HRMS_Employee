import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAdminDashboard } from '../../context/AdminDashboardContext';
import {
   Building2,
   Users,
   Briefcase,
   ChevronRight,
   Activity,
   ArrowRight,
   CalendarDays,
   ClipboardList,
   Clock3,
   Sparkles,
   BarChart3,
   Layers
} from 'lucide-react';

const AdminDashboard = () => {
   const navigate = useNavigate();
    const { user } = useAuth();
   const { summary, insights, departments, teams, jobs, staffDirectory, pendingLeaves, activities, loading } = useAdminDashboard();

   const toNumber = (value) => Number(value || 0);
   const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(toNumber(value));

   const stats = useMemo(() => [
      {
         label: 'Departments',
         value: String(summary.totalDepartments ?? departments.length),
         icon: Building2,
         helper: 'Live departments'
      },
      {
         label: 'Employees',
         value: String(summary.totalEmployees ?? staffDirectory.length),
         icon: Users,
         helper: 'Live employee directory'
      },
      {
         label: 'Open Jobs',
         value: String(summary.activeJobs ?? jobs.filter((job) => job.status === 'Active').length),
         icon: Briefcase,
         helper: 'Live hiring queue'
      },
      {
         label: 'Pending Leaves',
         value: String(insights?.pendingLeaves ?? pendingLeaves.length),
         icon: CalendarDays,
         helper: 'Awaiting review'
      },
      {
         label: 'New Hires',
         value: String(insights?.newHires ?? 0),
         icon: Sparkles,
         helper: 'This month'
      },
      {
         label: 'Monthly Payroll',
         value: formatCurrency(insights?.monthlyPayroll ?? 0),
         icon: BarChart3,
         helper: 'Current month spend'
      }
   ], [summary.totalDepartments, summary.totalEmployees, summary.activeJobs, departments.length, staffDirectory.length, jobs, insights?.pendingLeaves, pendingLeaves.length, insights?.newHires, insights?.monthlyPayroll]);

   const recentDepartments = departments.slice(0, 4);
   const recentJobs = jobs.slice(0, 4);
   const recentActivity = activities.slice(0, 5);
   const quickActions = [
      { label: 'Departments', path: '/admin/departments' },
      { label: 'Recruitment', path: '/admin/recruitment-control/hub' },
      { label: 'Payroll', path: '/admin/payroll-management' },
      { label: 'Settings', path: '/admin/settings' }
   ];

   return (
      <div className="space-y-8 animate-in fade-in duration-700 pb-20">
         <div className="flex flex-col gap-3 border-b border-slate-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2 uppercase">Admin Dashboard</h1>
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] leading-none">Live operational data from the admin service</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Connected</span>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
               <div className="flex items-center gap-3 mb-4 text-slate-400">
                  <Activity size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Overview</span>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat) => (
                     <div key={stat.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <stat.icon size={16} className="text-slate-400 mb-3" />
                        <p className="text-2xl font-black text-slate-900 leading-none mb-1">{stat.value}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
                        <p className="mt-2 text-[9px] font-black uppercase tracking-widest text-slate-300">{stat.helper}</p>
                     </div>
                  ))}
               </div>
            </div>
            <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Snapshot</p>
                     <h2 className="text-xl font-black text-slate-900 mt-1">Current Month</h2>
                  </div>
                  <Layers size={18} className="text-slate-300" />
               </div>

               <div className="space-y-4 text-sm text-slate-600 font-medium">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                     <span>Open positions</span>
                     <span className="font-black text-slate-900">{String(insights?.openPositions ?? summary.openJobs ?? 0).padStart(2, '0')}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                     <span>Monthly payroll</span>
                     <span className="font-black text-slate-900">{formatCurrency(insights?.monthlyPayroll ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                     <span>Teams</span>
                     <span className="font-black text-slate-900">{String(summary.teams ?? teams.length).padStart(2, '0')}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                     <span>Prepared by</span>
                     <span className="font-black text-slate-900">{user?.name || 'Admin'}</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1 rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
               <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Departments</h3>
                  <button onClick={() => navigate('/admin/departments')} className="text-[10px] font-black uppercase tracking-widest text-indigo-600">View all</button>
               </div>
               <div className="space-y-3">
                  {recentDepartments.length > 0 ? recentDepartments.map((department) => (
                     <div key={department.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="font-black text-slate-900">{department.name}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{department.head}</p>
                        <div className="mt-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                           <span>{department.teams} teams</span>
                           <span>{department.employees} employees</span>
                        </div>
                     </div>
                  )) : (
                     <p className="text-sm text-slate-400">No departments loaded.</p>
                  )}
               </div>
            </div>

            <div className="xl:col-span-1 rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
               <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Open Jobs</h3>
                  <button onClick={() => navigate('/admin/recruitment-control/hub')} className="text-[10px] font-black uppercase tracking-widest text-indigo-600">View all</button>
               </div>
               <div className="space-y-3">
                  {recentJobs.length > 0 ? recentJobs.map((job) => (
                     <div key={job.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                           <div>
                              <p className="font-black text-slate-900">{job.title}</p>
                              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{job.department}</p>
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{job.status}</span>
                        </div>
                        <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-500">{job.applicants} applicants</p>
                     </div>
                  )) : (
                     <p className="text-sm text-slate-400">No jobs loaded.</p>
                  )}
               </div>
            </div>

            <div className="xl:col-span-1 rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
               <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Recent Activity</h3>
                  <Activity size={16} className="text-slate-300" />
               </div>
               <div className="space-y-3">
                  {recentActivity.length > 0 ? recentActivity.map((entry) => (
                     <div key={entry.id || entry._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="font-black text-slate-900">{entry.title || entry.action || 'Activity'}</p>
                        <p className="mt-1 text-sm text-slate-500">{entry.message || entry.description || 'Live update received.'}</p>
                     </div>
                  )) : (
                     <p className="text-sm text-slate-400">No recent activity.</p>
                  )}
               </div>
            </div>
         </div>

         <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => (
               <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-all"
               >
                  {action.label}
               </button>
            ))}
         </div>
      </div>
   );
};

export default AdminDashboard;
