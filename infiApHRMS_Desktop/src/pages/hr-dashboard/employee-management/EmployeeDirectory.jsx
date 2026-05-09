import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Download,
  Search,
  ChevronDown,
  MoreHorizontal,
  Mail,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  BellRing,
  Edit3,
  MoreVertical,
  User,
  Activity,
  TrendingUp,
  Filter,
  ArrowRight,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  ResponsiveContainer, 
  XAxis, 
  Cell,
  Tooltip as RechartsTooltip
} from 'recharts';
import { useEmployeeContext } from '../../../context/EmployeeContext';

const EmployeeDirectory = () => {
  const navigate = useNavigate();
  const { employees } = useEmployeeContext();

  // --- STATE MANAGEMENT ---
  const [notification, setNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeActionId, setActiveActionId] = useState(null);
  const [filters, setFilters] = useState({
    department: 'All Departments',
    roleType: 'All Roles',
    status: 'All Status',
    joiningDate: ''
  });

  const deptData = [
    { name: 'Eng', value: 42, color: '#6366f1' },
    { name: 'Design', value: 12, color: '#ec4899' },
    { name: 'Ops', value: 28, color: '#f59e0b' },
    { name: 'HR', value: 8, color: '#10b981' },
    { name: 'Mark', value: 15, color: '#3b82f6' }
  ];

  // --- FILTER LOGIC ---
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = filters.department === 'All Departments' || emp.department === filters.department;
      const matchesStatus = filters.status === 'All Status' || emp.status === filters.status;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [searchQuery, filters, employees]);

  // --- HANDLERS ---
  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    showNotification("Employee data exported to CSV successfully.");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative pt-4 overflow-hidden">

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-24 right-8 z-50 animate-in slide-in-from-right-8 fade-in flex items-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-xl">
          <BellRing size={20} className="text-emerald-400" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-2 underline decoration-indigo-300 underline-offset-4 uppercase">Employee Directory</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1 leading-none">Manage Your Team Members</p>
        </div>
        <div className="flex items-center gap-3 self-start lg:self-center">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Export
          </button>
          <button
            onClick={() => navigate('/employees/add')}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
          >
            Add Employee
          </button>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-8 overflow-hidden min-h-0" onClick={() => setActiveActionId(null)}>
        
        {/* Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto no-scrollbar pb-6">
           <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-sm font-semibold text-slate-800">Department Stats</h3>
                 <TrendingUp size={18} className="text-indigo-500" />
              </div>
              <div className="h-32 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={deptData}>
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                         {deptData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                      </Bar>
                   </BarChart>
                 </ResponsiveContainer>
              </div>
               <div className="mt-6 flex items-end justify-between">
                  <div>
                     <p className="text-xs text-slate-500 mb-1">Total Employees</p>
                     <p className="text-2xl font-semibold text-slate-800">{employees.length}</p>
                  </div>
               </div>
           </div>
        </div>

        {/* Main Table */}
        <div className="lg:col-span-3 flex flex-col min-h-0 bg-white border border-slate-200 rounded-2xl overflow-hidden">
           
           {/* Toolbar */}
           <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                 <div className="relative w-full lg:w-64">
                   <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     type="text" 
                     placeholder="Search employees..." 
                     className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-800 transition-all"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                   />
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
                       <Filter size={14} className="text-slate-400" />
                       <select 
                         className="text-sm text-slate-600 outline-none bg-transparent cursor-pointer"
                         value={filters.department}
                         onChange={(e) => handleFilterChange('department', e.target.value)}
                       >
                          <option>All Departments</option>
                          <option>Engineering</option>
                          <option>Design</option>
                          <option>Operations</option>
                       </select>
                    </div>
                 </div>
              </div>
           </div>

           {/* Table */}
           <div className="flex-1 overflow-y-auto no-scrollbar relative">
              <table className="w-full text-left border-collapse">
                 <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                    <tr>
                       <th className="px-6 py-4 text-xs font-semibold text-slate-600">Employee</th>
                       <th className="px-6 py-4 text-xs font-semibold text-slate-600">Role</th>
                       <th className="px-6 py-4 text-xs font-semibold text-slate-600 text-center">Status</th>
                       <th className="px-6 py-4 text-xs font-semibold text-slate-600 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {filteredEmployees.map((emp) => (
                       <tr key={emp.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                                   {emp.avatar ? (
                                      <img src={emp.avatar} alt="" className="w-full h-full object-cover" />
                                   ) : (
                                      <span className="text-sm font-semibold text-slate-500">{emp.name?.charAt(0)}</span>
                                   )}
                                </div>
                                 <div>
                                    <p className="text-sm font-medium text-slate-800">{emp.name}</p>
                                    <p className="text-xs text-slate-500">{emp.email}</p>
                                 </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <p className="text-sm font-medium text-slate-800">{emp.role}</p>
                             <p className="text-xs text-slate-500">{emp.department}</p>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center justify-center">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                   emp.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                   {emp.status}
                                </span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right relative">
                             <button 
                               onClick={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === emp.id ? null : emp.id); }}
                               className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                             >
                                <MoreVertical size={18} />
                             </button>

                             {activeActionId === emp.id && (
                                <div className="absolute right-6 top-12 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 animate-in zoom-in-95 fade-in duration-200">
                                   <button 
                                     onClick={() => navigate(`/employees/profile/${emp.id}`)}
                                     className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                   >
                                      <ExternalLink size={16} className="text-slate-400" />
                                      View Profile
                                   </button>
                                   <button 
                                     onClick={() => navigate(`/employees/edit/${emp.id}`)}
                                     className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                   >
                                      <Edit3 size={16} className="text-slate-400" />
                                      Edit
                                   </button>
                                </div>
                             )}
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           {/* Footer */}
           <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <p className="text-sm text-slate-600">Showing {filteredEmployees.length} employees</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDirectory;
