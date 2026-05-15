import React, { useEffect, useMemo, useState, useRef } from 'react';
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
  const { departments, summary, fetchDepartments, loading, deleteDepartment } = useAdminDashboard();
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  const filteredDepartments = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return departments.filter(dept => 
      (dept.name || '').toLowerCase().includes(query) ||
      (dept.head || '').toLowerCase().includes(query) ||
      (dept.sub || '').toLowerCase().includes(query)
    );
  }, [departments, searchQuery]);

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredDepartments.length > 0) {
                  navigate(teamRoute);
                }
              }}
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
            <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <stat.icon size={18} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDepartments.map((dept, idx) => {
              const isMenuOpen = openMenuId === dept.id;
              const menuRef = useRef(null);

              useEffect(() => {
                const handleClickOutside = (event) => {
                  if (menuRef.current && !menuRef.current.contains(event.target)) {
                    setOpenMenuId(null);
                  }
                };
                if (isMenuOpen) {
                  document.addEventListener('mousedown', handleClickOutside);
                }
                return () => document.removeEventListener('mousedown', handleClickOutside);
              }, [isMenuOpen]);

            const handleDelete = async () => {
              if (window.confirm(`Are you sure you want to delete the ${dept.name} department? This action cannot be undone.`)) {
                const result = await deleteDepartment(dept.id);
                if (result.success) {
                  // refresh data
                  fetchDepartments();
                } else {
                  alert(result.error || 'Failed to delete department');
                }
              }
            };

            const editRoute = role === 'HR' ? `/departments/edit/${dept.id}` : `/admin/department-management/edit/${dept.id}`;

            return (
              <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="px-3 py-1.5 rounded-full text-[9px] font-black tracking-[0.2em] uppercase bg-slate-50 text-slate-500">
                    {dept.sub}
                  </div>
                  <div className="relative" ref={menuRef}>
                    <button 
                      onClick={() => setOpenMenuId(isMenuOpen ? null : dept.id)}
                      className={`transition-colors p-1.5 rounded-lg ${isMenuOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-200 hover:text-slate-400 hover:bg-slate-50'}`}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-2">
                          <button
                            onClick={() => {
                              navigate(teamRoute);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all group/item text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover/item:bg-white group-hover/item:shadow-sm transition-all">
                              <LayoutGrid size={14} className="text-slate-400 group-hover/item:text-indigo-600" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover/item:text-slate-900 transition-colors">View Teams</span>
                          </button>

                          <button
                            onClick={() => {
                              navigate(editRoute);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all group/item text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover/item:bg-white group-hover/item:shadow-sm transition-all">
                              <Plus size={14} className="text-slate-400 group-hover/item:text-indigo-600 rotate-45" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover/item:text-slate-900 transition-colors">Edit Dept</span>
                          </button>
                        </div>

                        <div className="p-2 border-t border-slate-50 bg-slate-50/30">
                          <button
                            onClick={() => {
                              handleDelete();
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-all group/item text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-red-50/50 flex items-center justify-center group-hover/item:bg-white group-hover/item:shadow-sm transition-all text-red-500">
                              <Plus size={14} className="rotate-45" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-600 group-hover/item:text-red-700 transition-colors">Delete Dept</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative z-10 space-y-1 mb-6">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{dept.name}</h3>
                  <p className="text-xs text-slate-500">Head: {dept.head}</p>
                </div>

                <div className="relative z-10 flex items-center gap-6 mb-6 text-sm text-slate-600">
                  <div>
                    <span className="block text-xl font-black text-slate-900">{dept.teams}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Teams</span>
                  </div>
                  <div>
                    <span className="block text-xl font-black text-slate-900">{dept.employees}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Employees</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(teamRoute)}
                  className="relative z-10 w-full py-3 bg-slate-50 text-slate-600 font-black rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 text-[9px] uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  View Teams
                  <ChevronRight size={12} />
                </button>
              </div>
            );
          })}

          {!searchQuery && (
            <div
              onClick={() => navigate(createDepartmentRoute)}
              className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-5 flex flex-col items-center justify-center group hover:border-slate-900 hover:bg-slate-50 transition-all duration-300 cursor-pointer min-h-[180px]"
            >
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 group-hover:bg-slate-900 group-hover:text-white transition-all">
                <Plus size={24} className="text-slate-300 group-hover:text-white" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-900 transition-colors">Add department</p>
            </div>
          )}
          
          {searchQuery && filteredDepartments.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 border-dashed">
               <Search size={40} className="text-slate-200 mb-4" />
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No departments found matching "{searchQuery}"</p>
               <button 
                 onClick={() => setSearchQuery('')}
                 className="mt-4 text-xs font-black text-indigo-600 hover:underline uppercase tracking-widest"
               >
                 Clear Search
               </button>
            </div>
          )}
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
