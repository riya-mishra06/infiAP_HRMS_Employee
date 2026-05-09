import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  User,
  Briefcase,
   BadgeCheck
} from 'lucide-react';
import { useEmployeeContext } from '../../../context/EmployeeContext';
import { getEmployeeProfile } from '../../../services/hrApi';

const formatDate = (value) => {
   if (!value) return null;

   try {
      return new Date(value).toLocaleDateString('en-IN', {
         day: '2-digit',
         month: 'short',
         year: 'numeric'
      });
   } catch {
      return null;
   }
};

const formatSalary = (value) => {
   if (value === null || value === undefined || value === '') return null;

   const amount = Number(value);
   if (Number.isNaN(amount)) return null;

   return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
   }).format(amount);
};

const normalizeProfileData = (payload, fallbackId) => {
   const data = payload?.data || payload || {};
   const profile = data.profileInfo || data;
   const personal = data.personalInfo || {};
   const job = data.jobDetails || {};
   const attendance = data.attendanceSummary || {};
   const financial = data.financial || {};

   return {
      id: profile.employeeId || data.employeeId || data._id || data.id || fallbackId,
      name: profile.name || data.name || 'Unnamed employee',
      role: job.role || data.designation || data.role || 'Employee',
      email: personal.email || data.email || '',
      phone: personal.phone || data.phone || '',
      location: data.address || data.location || '',
      department: job.department || data.department || '',
      manager: job.manager?.name || job.manager || data.reportingManager?.name || data.manager || '',
      joiningDate: formatDate(job.joiningDate || data.joiningDate),
      status: job.status || data.status || 'Active',
      employeeType: job.employeeType || data.employmentType || '',
      avatar: profile.profileImage || data.profileImage || data.avatar || '',
      attendance,
      salary: formatSalary(financial.currentBaseSalary || financial.annualSalaryUSD || data.currentBaseSalary || data.annualSalary),
   };
};

const EmployeeProfiles = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { employees } = useEmployeeContext();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
         setError('');
      try {
        const res = await getEmployeeProfile(id);
            const profile = normalizeProfileData(res.data, id);
            setEmployee(profile);
      } catch (err) {
            console.error('Failed to load profile:', err);
        const ctxEmp = employees.find(emp => String(emp.id) === String(id) || String(emp.employeeId) === String(id));

        if (ctxEmp) {
               setEmployee({
                  id: ctxEmp.employeeId || ctxEmp.id,
                  name: ctxEmp.name || 'Unnamed employee',
                  role: ctxEmp.role || 'Employee',
                  email: ctxEmp.email || '',
                  phone: ctxEmp.phone || '',
                  location: ctxEmp.location || '',
                  department: ctxEmp.department || '',
                  manager: ctxEmp.manager || '',
                  joiningDate: formatDate(ctxEmp.joiningDate),
                  status: ctxEmp.status || 'Active',
                  employeeType: ctxEmp.employeeType || '',
                  avatar: ctxEmp.avatar || '',
                  attendance: {},
                  salary: null,
               });
        } else {
               setEmployee(null);
               setError('Employee profile could not be loaded.');
        }
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id, employees]);

  if (loading || !employee) {
      return (
         <div className="p-8 text-center text-slate-400 font-black uppercase tracking-widest">
            {loading ? 'Loading employee profile...' : error || 'Profile not available.'}
         </div>
      );
  }

   const contactItems = [
      { label: 'Email', value: employee.email, icon: Mail },
      { label: 'Phone', value: employee.phone, icon: Phone },
      { label: 'Department', value: employee.department, icon: Briefcase },
      { label: 'Manager', value: employee.manager, icon: User },
      { label: 'Location', value: employee.location, icon: MapPin },
      { label: 'Joined', value: employee.joiningDate, icon: Calendar },
   ].filter(item => item.value);

   const attendanceItems = [
      { label: 'Present', value: employee.attendance?.present },
      { label: 'Absent', value: employee.attendance?.absent },
      { label: 'Leave', value: employee.attendance?.leave },
   ].filter(item => item.value !== undefined && item.value !== null);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative pt-4 overflow-hidden">
      
         {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/employees')}
            className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-2xl shadow-sm transition-all active:scale-90"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
                  <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-2 underline decoration-indigo-300 underline-offset-12">Employee Profile</h1>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-4">Live employee record and contact summary</p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start lg:self-center">
          <button 
            onClick={() => navigate(`/employees/edit/${employee.id}`)}
            className="px-10 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest text-[10px]"
          >
                   Edit Profile
          </button>
        </div>
      </div>

         {/* Main Workspace */}
         <div className="flex-1 grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-8 overflow-hidden min-h-0">
        
            {/* Profile summary */}
        <div className="flex flex-col gap-6 overflow-y-auto no-scrollbar pb-10 xl:h-full xl:sticky xl:top-0">
               <div className="card-soft bg-white border-slate-100 shadow-soft overflow-hidden">
                  <div className="h-24 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700 relative">
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.28),transparent_35%)]" />
                     <div className="absolute left-8 bottom-4 flex items-center gap-3 text-white">
                        <BadgeCheck size={16} className="text-emerald-300" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Profile Summary</span>
                     </div>
                  </div>

                  <div className="p-10 pt-0 -mt-12">
                     <div className="flex items-center justify-between mb-6">
                     <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Profile Summary</h3>
                        <BadgeCheck size={18} className="text-emerald-500" />
                     </div>

                     <div className="flex items-end gap-5 mb-8">
                        <div className="w-28 h-28 rounded-[32px] overflow-hidden border-4 border-white shadow-2xl bg-slate-50 shrink-0 flex items-center justify-center">
                        {employee.avatar ? (
                           <img 
                              src={employee.avatar} 
                              alt={employee.name} 
                              className="w-full h-full object-cover"
                              onError={(event) => {
                                 event.currentTarget.style.display = 'none';
                              }}
                           />
                        ) : (
                           <span className="text-3xl font-black text-slate-300">{(employee.name || 'U').split(' ').map(part => part[0]).slice(0, 2).join('')}</span>
                        )}
                     </div>

                        <div className="min-w-0 pb-2">
                           <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase truncate">{employee.name}</h2>
                           <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500 mt-2">{employee.role}</p>
                           <div className="mt-4 flex flex-wrap gap-2">
                              <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black rounded-lg uppercase tracking-widest">{employee.status}</span>
                              {employee.employeeType && (
                                 <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-widest">{employee.employeeType}</span>
                              )}
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-4">
                           <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Employee ID</span>
                           <span className="text-sm font-black text-slate-700 uppercase">{employee.id || 'N/A'}</span>
                        </div>
                        {employee.salary && (
                           <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-4">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Base Salary</span>
                              <span className="text-sm font-black text-slate-700 uppercase">{employee.salary}</span>
                           </div>
                        )}
                     </div>
                     </div>
               </div>

               {attendanceItems.length > 0 && (
                  <div className="card-soft bg-white p-8 border-slate-100 shadow-soft">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Attendance Summary</h3>
                        <ShieldCheck size={18} className="text-indigo-500" />
                     </div>

                     <div className="grid grid-cols-3 gap-3">
                        {attendanceItems.map((item) => (
                           <div key={item.label} className="rounded-2xl bg-slate-50 px-4 py-4 text-center">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                              <p className="mt-2 text-2xl font-black text-slate-800">{item.value}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
        </div>

            {/* Main details */}
      <div className="flex flex-col min-h-0 bg-white border border-slate-100 rounded-[44px] shadow-soft overflow-hidden">
               <div className="flex-1 overflow-y-auto no-scrollbar">
                  <div className="p-10 border-b border-slate-50 bg-slate-50/20">
                     <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                           <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none uppercase">{employee.name}</h2>
                           <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-emerald-100">{employee.status}</span>
                        </div>
                        <p className="text-indigo-600 font-black text-sm uppercase tracking-widest">{employee.role}{employee.department ? ` • ${employee.department}` : ''}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {contactItems.map((item) => (
                              <div key={item.label} className="flex items-start gap-3 rounded-3xl bg-white border border-slate-100 p-5">
                                 <div className="p-2.5 rounded-2xl bg-slate-50 text-slate-400 shrink-0">
                                    <item.icon size={16} />
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                    <p className="text-sm font-bold text-slate-700 break-words">{item.value}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="p-10">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl"><ShieldCheck size={18} /></div>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Record Details</h3>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                           { label: 'Employee ID', value: employee.id },
                           { label: 'Department', value: employee.department },
                           { label: 'Manager', value: employee.manager },
                           { label: 'Location', value: employee.location },
                           { label: 'Joined', value: employee.joiningDate },
                           { label: 'Employment Type', value: employee.employeeType },
                        ].filter(item => item.value).map((item) => (
                           <div key={item.label} className="rounded-3xl border border-slate-100 bg-white p-5">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">{item.label}</p>
                              <p className="text-sm font-bold text-slate-700 break-words">{item.value}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfiles;
