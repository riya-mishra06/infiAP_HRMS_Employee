import React, { useEffect, useState, useRef } from 'react';
import { Search, Bell, User, Check, X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getHrProfile } from '../../services/hrApi';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, markAsRead } = useNotifications();
  const [profile, setProfile] = useState(null);
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

  useEffect(() => {
    let isMounted = true;

    // Always fetch fresh profile data to show updated info
    getHrProfile()
      .then((response) => {
        if (!isMounted) return;
        const apiData = response.data?.data;
        // Normalize HR profile data
        const normalizedProfile = {
          name: apiData?.header?.name || apiData?.name || user?.name || 'HR User',
          role: apiData?.administrativeAccess?.accessLevel || apiData?.role || user?.role || 'hr',
          profileImage: apiData?.header?.profileImage || apiData?.profileImage || user?.profileImage || user?.profilePicture,
        };
        setProfile(normalizedProfile);
      })
      .catch(() => {
        if (!isMounted) return;
        setProfile(null);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const displayName = profile?.name || user?.name || 'HR User';
  const displayRole = 'HR Panel';

  return (
    <div className="h-20 bg-white border-b border-[#E7EBF7] sticky top-0 z-10 flex items-center justify-between px-8 w-full">
      
      <div className="flex items-center gap-6 flex-1 max-w-2xl">
        
        {/* Search */}
        <div className="relative group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8896C0] group-hover:text-[#4E63F0] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search employees, departments, payroll..."
            className="w-full bg-[#F4F7FD] border border-[#E6ECF9] rounded-xl pl-12 pr-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#4E63F0]/15 transition-all placeholder:text-[#93A0C7]"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 pl-6">

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-[#7E8AB2] hover:text-[#4E63F0] p-2.5 hover:bg-[#F4F7FD] rounded-xl relative transition-all group"
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
                      navigate('/notifications');
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

        <div 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 pl-2 pr-2 group cursor-pointer hover:bg-[#F4F7FD] rounded-xl py-1.5 px-2 transition-all"
        >
          
          <div className="text-right hidden md:block">
            <p className="text-sm font-black text-[#1E2A54] leading-none mb-1 group-hover:text-[#4E63F0] transition-colors">
              {displayName}
            </p>
            <p className="text-[10px] text-[#90A0C8] font-bold tracking-[0.2em] uppercase">
              {displayRole}
            </p>
          </div>

          <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#E7EBF7] p-0.5 bg-white group-hover:border-[#C7D2FA] transition-all">
            <img
              src={profile?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=5a54e8&color=fff`}
              alt="User"
              className="w-full h-full object-cover rounded-[10px]"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=5a54e8&color=fff`;
              }}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Navbar;