import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  LayoutGrid,
  Plus,
  Search,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { useAdminDashboard } from '../../context/AdminDashboardContext';
import { useAuth } from '../../context/AuthContext';

const Departments = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { departments, summary, fetchDepartments, loading } = useAdminDashboard();

  const teamRoute = role === 'HR' ? '/departments/teams' : '/admin/department-management/teams';
  const createDepartmentRoute = role === 'HR' ? '/departments/create' : '/admin/department-management/create';

  useEffect(() => {
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overviewStats = useMemo(() => ([
    { label: 'Departments', value: String(departments.length), icon: Building2 },
    {
      label: 'Teams',
      value: String(
        Number(summary?.teams) ||
        departments.reduce((count, department) => count + (Number(department.teams) || 0), 0)
      ),
      icon: LayoutGrid
    },
    {
      label: 'Employees',
      value: String(
        Number(summary?.totalEmployees || summary?.employees) ||
        departments.reduce((count, department) => count + (Number(department.employees) || 0), 0)
      ),
      icon: Users
    },
  ]), [departments, summary]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2 uppercase">Departments</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] leading-none">Live company structure</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search departments..."
              className="bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all w-[300px] shadow-soft"
            />
          </div>
          <button
            onClick={() => navigate(createDepartmentRoute)}
            className="flex items-center gap-3 px-8 py-4 bg-linear-to-r from-[#4E63F0] to-[#6855E8] text-white rounded-2xl shadow-xl shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-1 transition-all active:scale-95 text-xs font-black uppercase tracking-widest"
          >
            <Plus size={18} strokeWidth={3} />
            Create Department
          </button>
        </div>
      </div>

      <section className="px-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {overviewStats.map((stat, idx) => (
            <div key={idx} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                <stat.icon size={20} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-2 pb-4 relative">
        <div className="flex items-center justify-between mb-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active departments</label>
          <button className="text-[10px] font-black text-indigo-600 hover:underline transition-all uppercase tracking-widest">Manage</button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-8 text-sm font-bold text-slate-500">Loading live departments...</div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map((dept, idx) => (
            <div key={idx} className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="px-4 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase bg-slate-50 text-slate-500">
                  {dept.sub}
                </div>
                <button className="text-slate-200 hover:text-slate-400 transition-colors p-2 hover:bg-slate-50 rounded-xl">
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="relative z-10 space-y-2 mb-10">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{dept.name}</h3>
                <p className="text-sm text-slate-500">Head: {dept.head}</p>
              </div>

              <div className="relative z-10 flex items-center gap-8 mb-8 text-sm text-slate-600">
                <div>
                  <span className="block text-2xl font-black text-slate-900">{dept.teams}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teams</span>
                </div>
                <div>
                  <span className="block text-2xl font-black text-slate-900">{dept.employees}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employees</span>
                </div>
              </div>

              <button
                onClick={() => navigate(teamRoute)}
                className="relative z-10 w-full py-4 bg-slate-50 text-slate-600 font-black rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
              >
                View Teams
                <ChevronRight size={14} />
              </button>
            </div>
          ))}

          <div
            onClick={() => navigate(createDepartmentRoute)}
            className="rounded-[28px] border-2 border-dashed border-slate-200 bg-white p-6 flex flex-col items-center justify-center group hover:border-slate-900 hover:bg-slate-50 transition-all duration-300 cursor-pointer min-h-[240px]"
          >
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-slate-900 group-hover:text-white transition-all">
              <Plus size={28} className="text-slate-300 group-hover:text-white" />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-900 transition-colors">Add department</p>
          </div>
        </div>
        )}

        {/* Floating Minimal CTA */}
        <button
            onClick={() => navigate(createDepartmentRoute)}
          className="fixed bottom-12 right-12 w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center group z-40"
        >
          <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </section>
    </div>
  );
};

export default Departments;
