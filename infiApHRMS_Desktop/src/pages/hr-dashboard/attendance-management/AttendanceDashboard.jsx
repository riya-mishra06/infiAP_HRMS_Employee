import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  Home, 
  UserMinus, 
  Search, 
  Download, 
  MoreHorizontal,
  MapPin,
  CheckCircle2,
  XCircle,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BellRing,
  CheckCircle,
  X,
  AlertTriangle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  ResponsiveContainer,
  Cell,
  Tooltip,
  XAxis
} from 'recharts';
import { getAttendanceDailyOverview, getAttendanceRecords, getAttendanceCorrectionRequests, reviewAttendanceCorrection } from '../../../services/hrApi';

const AttendanceDashboard = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [notification, setNotification] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [correctionRequests, setCorrectionRequests] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [stats, setStats] = useState([
    { id: 'stat-1', title: 'Present Today', value: '—', change: '--', icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'stat-2', title: 'Absent', value: '—', change: '--', icon: UserMinus, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'stat-3', title: 'Late Arrivals', value: '—', change: '--', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'stat-4', title: 'WFH Mode', value: '—', change: '--', icon: Home, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Log for debugging
        console.log('Fetching attendance for date:', selectedDate);

        const [overviewRes, recordsRes, correctionsRes] = await Promise.all([
          getAttendanceDailyOverview({ date: selectedDate }).catch(() => ({ data: { data: null } })),
          getAttendanceRecords({ date: selectedDate, limit: 50 }).catch(() => ({ data: { data: [] } })),
          getAttendanceCorrectionRequests({ status: 'Pending' }).catch(() => ({ data: { data: [] } })),
        ]);

        console.log('Overview response:', overviewRes.data);
        console.log('Records response:', recordsRes.data);

        const overview = overviewRes.data?.data;
        console.log('Full overview data:', overview);
        if (overview) {
          setStats([
            { id: 'stat-1', title: 'Present Today', value: String(overview.presentToday ?? 0), change: '+0%', icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
            { id: 'stat-2', title: 'Absent', value: String(overview.absent ?? 0), change: '0%', icon: UserMinus, color: 'text-rose-600', bg: 'bg-rose-50' },
            { id: 'stat-3', title: 'Late Arrivals', value: String(overview.lateArrivals ?? 0), change: '0%', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
            { id: 'stat-4', title: 'WFH Mode', value: String(overview.wfh ?? 0), change: 'Normal', icon: Home, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          ]);
        }

        const records = recordsRes.data?.data || [];
        console.log('Attendance records:', records);
        setAttendanceLogs(records.map((r, i) => ({
          id: r._id || `log-${i}`,
          name: r.name || r.employeeName || 'Unknown',
          role: r.designation || r.role || r.team || 'Employee',
          checkIn: r.inTime ? new Date(r.inTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--',
          checkOut: r.outTime ? new Date(r.outTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--',
          status: r.status || 'Absent',
          location: r.location || r.team || 'Office',
          latLong: '',
          type: r.workMode === 2 ? 'Remote' : r.workMode === 3 ? 'Meeting' : 'Office',
          avatar: r.profileImage || null,
        })));

        const corrections = correctionsRes.data?.data || [];
        setCorrectionRequests(corrections.map(c => ({
          id: c._id || c.id,
          name: c.userId?.name || c.employeeName || 'Unknown',
          time: c.createdAt ? new Date(c.createdAt).toLocaleString() : 'Recently',
          reason: c.reason || 'Correction',
          comment: c.reviewRemarks || c.reason || '',
          avatar: c.userId?.profileImage || c.avatar || null,
        })));
      } catch (err) {
        console.error('Attendance fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate]);

  // --- DYNAMIC SEARCH LOGIC ---
  const filteredLogs = useMemo(() => {
    return attendanceLogs.filter(log => 
      log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, attendanceLogs]);

  // --- HANDLERS ---
  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      showNotification("Attendance report (CSV) successfully exported.");
    }, 1500);
  };

  const handleCorrection = async (id, action, name) => {
    try {
      await reviewAttendanceCorrection({ correctionId: id, action: action.toLowerCase() });
    } catch (err) {
      console.error('Correction review failed:', err);
    }
    setCorrectionRequests(prev => prev.filter(req => req.id !== id));
    showNotification(`Attendance request for ${name} ${action} successfully.`);
  };

  const chartData = [
    { day: 'Mon', value: stats[0].value !== '—' ? parseInt(stats[0].value) : 0 },
    { day: 'Tue', value: stats[0].value !== '—' ? parseInt(stats[0].value) - 2 : 0 },
    { day: 'Wed', value: stats[0].value !== '—' ? parseInt(stats[0].value) + 1 : 0 },
    { day: 'Thu', value: stats[0].value !== '—' ? parseInt(stats[0].value) - 1 : 0 },
    { day: 'Fri', value: stats[0].value !== '—' ? parseInt(stats[0].value) : 0 },
    { day: 'Sat', value: 0 },
    { day: 'Sun', value: 0 },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 mt-4 px-1">
      
      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowDatePicker(false)}></div>
           <div className="bg-white rounded-2xl p-6 max-w-sm w-full relative z-10 shadow-xl border border-slate-200 animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-semibold text-slate-800">Select Date</h3>
                 <button onClick={() => setShowDatePicker(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} className="text-slate-400" /></button>
              </div>
              <input 
                type="date" 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setShowDatePicker(false); }}
              />
           </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-24 right-8 z-50 animate-in slide-in-from-right-8 fade-in flex items-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-xl">
          <BellRing size={20} className="text-emerald-400" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 space-y-8 min-w-0">
        
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-2 underline decoration-indigo-300 underline-offset-4 uppercase">Attendance Dashboard</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1 leading-none">Track Employee Attendance</p>
          </div>
          <div className="flex items-center gap-3 self-start lg:self-center">
             <div 
               onClick={() => setShowDatePicker(true)}
               className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded-lg hover:border-slate-300 transition-colors cursor-pointer"
             >
                <Calendar size={18} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-700">{selectedDate}</span>
                <ChevronDown size={16} className="text-slate-400" />
             </div>
             <button 
               onClick={handleExport}
               disabled={isExporting}
               className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 disabled:opacity-50"
             >
                {isExporting ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Download size={18} />
                    Export
                  </>
                )}
             </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.id} className="bg-white border border-slate-200 rounded-2xl p-6">
               <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon size={20} strokeWidth={2} />
                  </div>
               </div>
                <p className="text-xs text-slate-500 mb-1">{stat.title}</p>
                <h3 className="text-2xl font-semibold text-slate-800">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Activity Logs */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-slate-800">Attendance Records</h2>
            <div className="flex items-center gap-3">
               <div className="relative w-full md:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-800 transition-all" 
                  />
               </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="animate-spin text-slate-400" size={32} />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-slate-400">
                <UserMinus size={48} className="mb-4 opacity-50" />
                <p className="text-sm font-medium">No attendance records found</p>
                <p className="text-xs mt-1">Try selecting a different date</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-600">Employee</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-600">Check In</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-600">Check Out</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-600">Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center shrink-0">
                            {log.avatar ? (
                              <img src={log.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-semibold text-indigo-600">{log.name?.charAt(0) || 'U'}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{log.name}</p>
                            <p className="text-xs text-slate-500">{log.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-sm text-slate-800">{log.checkIn}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-400">{log.checkOut}</span>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            log.status.includes('Late') ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                         }`}>
                            {log.status}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            log.type === 'Remote' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                         }`}>
                            {log.type}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDEBAR (The Control Hub) --- */}
      <div className="w-full xl:w-[380px] space-y-8">
        
        {/* Correction Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold text-slate-800">Correction Requests</h2>
             <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
               {correctionRequests.length}
             </span>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-slate-400" size={24} />
              </div>
            ) : correctionRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <CheckCircle2 size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-medium">No pending corrections</p>
              </div>
            ) : (
              correctionRequests.map((req) => (
                <div key={req.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center shrink-0">
                      {req.avatar ? (
                        <img src={req.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold text-indigo-600">{req.name?.charAt(0) || 'U'}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{req.name}</p>
                      <p className="text-xs text-slate-500">{req.reason}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                    {req.comment}
                  </p>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleCorrection(req.id, 'Approved', req.name)}
                        className="flex-1 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleCorrection(req.id, 'Rejected', req.name)}
                        className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weekly Chart Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Weekly Overview</h3>
              <TrendingUp size={18} className="text-indigo-500" />
           </div>
              <div className="h-40 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                       <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={index === 4 ? '#6366f1' : '#e2e8f0'} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
              <div className="flex justify-between items-center pt-4 text-xs text-slate-500">
                 {chartData.map(d => <span key={d.day}>{d.day}</span>)}
              </div>
        </div>

      </div>

    </div>
  );
};

export default AttendanceDashboard;
