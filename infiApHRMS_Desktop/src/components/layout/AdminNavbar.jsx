import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';


const AdminNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/department-management')) return 'Department ';
    if (path.includes('/payroll-management')) return 'Payroll';
    if (path.includes('/recruitment-control')) return 'Recruitment';
    if (path.includes('/policies')) return 'Company Policies';
    if (path.includes('/settings')) return 'System Settings';
    if (path.includes('/departments')) return 'Departments';
    if (path.includes('/employees')) return 'Employees';
    return 'Institutional Hub';
  };

  const displayName = user?.name || 'Admin User';
  const displayRole = user?.role
    ? String(user.role)
        .split(' ')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ')
    : 'Admin';
  const profileImage = user?.profileImage || user?.profilePicture || user?.avatar || '';
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4E63F0&color=fff`;

  return (
    <div className="h-20 bg-white border-b border-slate-100 sticky top-0 z-10 flex items-center justify-between px-8 w-full">
      <div className="flex items-center gap-6 min-w-0">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Admin Workspace</p>
          <h1 className="text-xl font-black text-slate-900 tracking-tight truncate">{getPageTitle()}</h1>
        </div>

        <div className="relative group w-[380px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search live records..."
            className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all placeholder:text-slate-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-slate-400 hover:text-indigo-600 p-2.5 hover:bg-slate-50 rounded-xl relative transition-all group">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white group-hover:animate-ping"></span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/employees/view')}
          className="flex items-center gap-3 pl-4 border-l border-slate-100 group cursor-pointer"
        >
          <div className="text-right hidden md:block">
            <p className="text-sm font-black text-slate-800 leading-none mb-1 group-hover:text-indigo-600 transition-colors">{displayName}</p>
            <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">{displayRole}</p>
          </div>
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-100 p-0.5 bg-white group-hover:border-indigo-200 transition-all shadow-sm">
            <img
              src={profileImage || fallbackAvatar}
              alt={displayName}
              onError={(event) => {
                event.currentTarget.src = fallbackAvatar;
              }}
              className="w-full h-full object-cover rounded-[8px]"
            />
          </div>
        </button>
      </div>
    </div>
  );
};

export default AdminNavbar;
