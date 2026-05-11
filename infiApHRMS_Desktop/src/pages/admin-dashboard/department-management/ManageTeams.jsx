import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminDashboard } from '../../../context/AdminDashboardContext';
import { useEmployeeContext } from '../../../context/EmployeeContext';
import { 
  Users, 
  Search, 
  Plus, 
  ChevronRight, 
  ArrowLeft,
  Filter,
  MoreVertical,
  ShieldCheck,
  Zap,
  LayoutGrid,
  Bell
} from 'lucide-react';

import { useAuth } from '../../../context/AuthContext';

const ManageTeams = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { teams, fetchTeams, updateTeam } = useAdminDashboard();
  const { employees, fetchEmployees } = useEmployeeContext();
  const [activeTab, setActiveTab] = useState('All Teams');
  const [activeTeamDetails, setActiveTeamDetails] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [savingMember, setSavingMember] = useState(false);
  const [memberError, setMemberError] = useState('');

  useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!employees || employees.length === 0) {
      fetchEmployees?.({ limit: 100 });
    }
  }, [employees, fetchEmployees]);

  const employeeOptions = useMemo(() => {
    return (employees || [])
      .filter((employee) => employee.id)
      .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')));
  }, [employees]);

  const tabs = ['All Teams', 'Development', 'QA & Testing', 'Design'];

  const filteredTeams = activeTab === 'All Teams' ? teams : teams.filter(t => t.type === activeTab);

  const openTeamDetails = (team) => {
    setActiveTeamDetails(team);
    setSelectedMemberId('');
    setMemberError('');
  };

  const handleAddMember = async () => {
    if (!activeTeamDetails?.id || !selectedMemberId) return;

    const existingMemberIds = new Set(activeTeamDetails.memberIds || []);
    if (existingMemberIds.has(selectedMemberId)) {
      setMemberError('This employee is already in the team.');
      return;
    }

    setSavingMember(true);
    setMemberError('');

    const nextMemberIds = [...existingMemberIds, selectedMemberId];
    const result = await updateTeam(activeTeamDetails.id, { members: nextMemberIds });

    setSavingMember(false);

    if (!result?.success) {
      setMemberError(result?.error || 'Failed to add employee to team.');
      return;
    }

    const refreshed = result.data;
    setActiveTeamDetails((prev) => prev ? { ...prev, ...refreshed } : prev);
    setSelectedMemberId('');
    fetchTeams();
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 relative">
      
      {/* Dynamic Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
         <div className="flex items-center gap-6">
            <button
               onClick={() => navigate(role === 'HR' ? '/departments' : '/admin/departments')}
               className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all group"
            >
               <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-2 underline decoration-indigo-300 underline-offset-4 uppercase">
            Employees Profile Hub
               </h1>
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1 leading-none">
            Global Talent Inventory &amp; Identity Portfolio Nodes
               </p>
            </div>
         </div>
         <div className="flex items-center gap-4 relative group max-w-sm w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
            <input
               type="text"
               placeholder="Search teams or leads..."
               className="w-full bg-white border border-slate-100 hover:border-slate-200 focus:border-indigo-500 outline-none rounded-2xl pl-12 pr-4 py-3.5 text-xs font-black text-slate-600 transition-all shadow-soft uppercase tracking-tight"
            />
         </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
              ${activeTab === tab 
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 -translate-y-1' 
                : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50 hover:text-slate-600'}`}
          >
            {tab}
          </button>
        ))}
        <button className="ml-auto flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
          <Filter size={14} />
          Advanced Filters
        </button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {filteredTeams.map((team, idx) => (
          <div key={idx} className="bg-white rounded-[48px] border border-slate-50 shadow-soft overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col">
            <div className="p-10 flex-1">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors mb-1">{team.name}</h3>
                  <p className="text-sm font-bold text-slate-400 italic">Lead: {team.lead}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-3 bg-slate-50 text-slate-300 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                    <ShieldCheck size={18} />
                  </button>
                  <button className="p-3 bg-slate-50 text-slate-300 rounded-xl hover:text-red-500 hover:bg-red-50 transition-all">
                    <Zap size={18} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6 mb-10">
                <div className="px-6 py-4 bg-indigo-50 rounded-[20px] flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-sm">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800 leading-none mb-1">{team.members}</h4>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Members</p>
                  </div>
                </div>
                <button 
                  onClick={() => openTeamDetails(team)}
                  className="flex-1 py-5 bg-slate-50 text-slate-500 hover:bg-indigo-600 hover:text-white transition-all rounded-[20px] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-transparent hover:shadow-indigo-100 flex items-center justify-center gap-3"
                >
                  View Team Details
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Key Members Sub-Section */}
              <div className="space-y-6 pt-8 border-t border-slate-50">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block px-2">Key Members Nodes</label>
                <div className="space-y-4">
                  {team.keyMembers?.length > 0 ? team.keyMembers.map((member, midx) => (
                    <div key={midx} className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 rounded-2xl transition-all cursor-pointer group/member">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm transition-transform group-hover/member:scale-110">
                          <img 
                            src={member.img} 
                            alt={member.name} 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'U')}&background=random&color=fff`;
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 group-hover/member:text-indigo-600 transition-colors">{member.name}</p>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full">
                        <div className="w-1 h-1 rounded-full bg-current animate-pulse"></div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{member.status}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="p-6 bg-slate-50 border border-slate-100 border-dashed rounded-2xl flex flex-col items-center justify-center text-center">
                       <Users size={24} className="text-slate-300 mb-2" />
                       <p className="text-xs font-bold text-slate-400">No members assigned to this team yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating CTA */}
      <button 
        onClick={() => navigate(role === 'HR' ? '/departments/teams/create' : '/admin/department-management/teams/create')}
        className="fixed bottom-12 right-12 flex items-center gap-4 px-10 py-5 bg-slate-900 text-white rounded-full shadow-2xl hover:shadow-indigo-200 hover:-translate-y-2 transition-all active:scale-95 group z-40"
      >
        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
          <Plus size={20} strokeWidth={3} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest">Create Team</span>
      </button>

      {/* Team Details Modal */}
      {activeTeamDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                   <h2 className="text-2xl font-black text-slate-800">{activeTeamDetails.name}</h2>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{activeTeamDetails.departmentName || 'General'} Department</p>
                </div>
                <button 
                  onClick={() => setActiveTeamDetails(null)}
                  className="w-10 h-10 bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 rounded-xl flex items-center justify-center transition-all"
                >
                   <ArrowLeft size={18} className="rotate-45" />
                </button>
             </div>
             <div className="p-8 overflow-y-auto flex-1 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-6 bg-indigo-50 rounded-[24px]">
                      <label className="text-[9px] font-black uppercase tracking-widest text-indigo-400 block mb-2">Team Lead</label>
                      <p className="text-lg font-black text-indigo-900">{activeTeamDetails.lead}</p>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-[24px]">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Total Members</label>
                      <p className="text-lg font-black text-slate-800">{activeTeamDetails.members}</p>
                   </div>
                </div>

                <div className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-6 space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2">Add employee to team</label>
                    <div className="flex flex-col md:flex-row gap-3">
                      <select
                        value={selectedMemberId}
                        onChange={(event) => setSelectedMemberId(event.target.value)}
                        className="flex-1 bg-white border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
                      >
                        <option value="">Select employee</option>
                        {employeeOptions
                          .filter((employee) => !(activeTeamDetails.memberIds || []).includes(employee.id))
                          .map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.name} - {employee.department || 'General'}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddMember}
                        disabled={!selectedMemberId || savingMember}
                        className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingMember ? 'Adding...' : 'Add Employee'}
                      </button>
                    </div>
                    {memberError && (
                      <p className="mt-3 text-sm font-medium text-red-600">{memberError}</p>
                    )}
                  </div>
                </div>
                
                <div>
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-4 px-2">Team Directory</label>
                   <div className="space-y-3">
                     {activeTeamDetails.keyMembers?.length > 0 ? activeTeamDetails.keyMembers.map((member, midx) => (
                        <div key={midx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
                           <div className="flex items-center gap-4">
                              <img 
                                src={member.img} 
                                alt={member.name} 
                                className="w-10 h-10 rounded-full border border-slate-100"
                                onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'U')}&background=random&color=fff`; }}
                              />
                              <div>
                                 <p className="text-sm font-bold text-slate-800">{member.name}</p>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{member.role}</p>
                              </div>
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-green-50 text-green-600 rounded-full">{member.status}</span>
                        </div>
                     )) : (
                        <div className="flex flex-col items-center justify-center p-10 bg-slate-50 border border-slate-100 border-dashed rounded-3xl text-center">
                           <Users size={32} className="text-slate-300 mb-3" />
                           <p className="text-lg text-slate-700 font-black mb-1">0 Team Members</p>
                           <p className="text-xs text-slate-400 font-bold mb-6 max-w-[250px]">HR can add and assign employees to this team from the Employee directory.</p>
                           {role === 'HR' && (
                             <button 
                                 onClick={() => navigate('/admin/employees/add')}
                               className="px-8 py-4 bg-indigo-600 text-white rounded-[16px] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 hover:-translate-y-1 transition-all shadow-xl shadow-indigo-100"
                             >
                               Add Employee
                             </button>
                           )}
                        </div>
                     )}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageTeams;
