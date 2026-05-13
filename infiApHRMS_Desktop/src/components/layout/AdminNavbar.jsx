import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Check, X, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';


const AdminNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, markAsRead, clearNotifications } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
      case 'leave_approved':
        return <Check className="w-4 h-4 text-emerald-600" />;
      case 'error':
      case 'leave_rejected':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-600" />;
    }
  };

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
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-slate-400 hover:text-indigo-600 p-2.5 hover:bg-slate-50 rounded-xl relative transition-all group"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-slate-600" />
                  <span className="font-bold text-sm text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => notifications.forEach(n => !n.read && markAsRead(n.id))}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id || notification._id}
                      onClick={() => markAsRead(notification.id || notification._id)}
                      className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 p-1.5 rounded-lg ${notification.read ? 'bg-slate-100' : 'bg-indigo-100'}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {notification.title || notification.message?.slice(0, 30) || 'Notification'}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock size={10} className="text-slate-400" />
                            <span className="text-[10px] text-slate-400">
                              {formatTime(notification.timestamp || notification.createdAt)}
                            </span>
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 10 && (
                <div className="px-4 py-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/admin/notifications');
                    }}
                    className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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
