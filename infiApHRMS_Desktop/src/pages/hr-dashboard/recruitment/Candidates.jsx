import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  Download, 
  MoreHorizontal, 
  User, 
  Mail, 
  TrendingUp, 
  Briefcase, 
  Calendar, 
  Star,
  ChevronRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCandidateTracking } from '../../../services/hrApi';

const Candidates = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    const defaultCandidates = [
        { id: 'CAN-9021', name: 'Alex Rivers', role: 'Sr. Engineer', experience: '8 YRS', stage: 'Applied', rating: 4.2, source: 'LinkedIn', avatar: 'https://i.pravatar.cc/150?u=alex' },
        { id: 'CAN-9022', name: 'Sarah Chen', role: 'Prod. Designer', experience: '5 YRS', stage: 'Interview', rating: 4.8, source: 'Referral', avatar: 'https://i.pravatar.cc/150?u=sarah' },
        { id: 'CAN-9023', name: 'Marcus Thompson', role: 'Sales Lead', experience: '12 YRS', stage: 'Screening', rating: 3.9, source: 'Indeed', avatar: 'https://i.pravatar.cc/150?u=marcus' },
        { id: 'CAN-9024', name: 'Elena Rodriguez', role: 'HR Manager', experience: '7 YRS', stage: 'Offered', rating: 4.5, source: 'Career Page', avatar: 'https://i.pravatar.cc/150?u=elena' },
        { id: 'CAN-9025', name: 'David Kim', role: 'Data Scientist', experience: '4 YRS', stage: 'Interview', rating: 4.1, source: 'LinkedIn', avatar: 'https://i.pravatar.cc/150?u=david' },
        { id: 'CAN-9026', name: 'Lisa Varma', role: 'QA Lead', experience: '9 YRS', stage: 'Applied', rating: 4.6, source: 'Hired.com', avatar: 'https://i.pravatar.cc/150?u=lisa' },
    ];

    const [candidates, setCandidates] = useState(defaultCandidates);

    useEffect(() => {
        let isMounted = true;

        const loadCandidates = async () => {
            try {
                const res = await getCandidateTracking();
                const payload = Array.isArray(res.data?.data) ? res.data.data : [];
                const mapped = payload.map((item, index) => ({
                    id: item.id || item.candidateId || item._id || item.code || `CAN-${index + 1}`,
                    name: item.name || item.fullName || item.candidateName || `Candidate ${index + 1}`,
                    role: item.role || item.jobTitle || item.position || 'Role Pending',
                    experience: item.experience || item.yearsExperience ? `${item.experience || item.yearsExperience} YRS` : '—',
                    stage: item.stage || item.status || item.pipelineStage || 'Applied',
                    rating: Number(item.rating ?? item.score ?? 0) || 0,
                    source: item.source || item.sourceChannel || item.channel || 'Direct',
                    avatar: item.avatar || item.profilePicture || `https://i.pravatar.cc/150?u=${encodeURIComponent(item.email || item.name || index)}`
                }));

                if (isMounted && mapped.length) {
                    setCandidates(mapped);
                }
            } catch (err) {
                // debug error removed
            }
        };

        loadCandidates();

        return () => {
            isMounted = false;
        };
    }, []);

    const filteredCandidates = candidates.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             c.role.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'All' || c.stage === activeFilter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] w-full gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative pt-4 overflow-hidden text-left">
            
            {/* Header / Stats */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
                <div>
                   <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-2 underline decoration-indigo-300 underline-offset-12">Candidate Pipeline Directory</h1>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-4">Forensic Talent Index & Acquisition Records</p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex -space-x-3 pr-4 border-r border-slate-100 mr-4">
                      {candidates.slice(0, 4).map((c, i) => (
                         <img key={i} src={c.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                      ))}
                      <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[10px] font-black text-white">+342</div>
                   </div>
                   <button className="px-8 py-3 bg-white border border-slate-100 text-slate-400 font-black text-[10px] uppercase rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                      Export CSV
                   </button>
                   <button className="px-10 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest text-[10px] active:scale-95">
                      Integrate ATS
                   </button>
                </div>
            </div>

            {/* Content Card */}
            <div className="flex-1 flex flex-col bg-white border border-slate-100 rounded-[44px] shadow-soft overflow-hidden min-h-0">
                
                {/* Search & Filter Bar */}
                <div className="px-10 py-8 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/20">
                    <div className="flex items-center gap-8">
                        {['All', 'Applied', 'Screening', 'Interview', 'Offered'].map(tab => (
                            <button 
                                key={tab} 
                                onClick={() => setActiveFilter(tab)}
                                className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all relative py-2 ${activeFilter === tab ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-800'}`}
                            >
                                {tab}
                                {activeFilter === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full animate-in zoom-in-y"></div>}
                            </button>
                        ))}
                    </div>
                    <div className="relative group max-w-sm w-full lg:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                            type="text" 
                            placeholder="Find talent node..." 
                            className="w-full bg-white border border-slate-100 focus:border-indigo-100 outline-none rounded-2xl pl-12 pr-4 py-3 text-xs font-black text-slate-600 transition-all shadow-sm uppercase tracking-tight"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100">
                            <tr>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Profile</th>
                                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Applied Role</th>
                                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pipeline Stage</th>
                                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acq. Source</th>
                                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Node Logic</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredCandidates.map((c) => (
                                <tr key={c.id} className="group hover:bg-slate-50/50 transition-all cursor-pointer">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img src={c.avatar} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{c.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.id} • {c.experience}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-2">
                                            <Briefcase size={14} className="text-indigo-400" />
                                            <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{c.role}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <span className={`px-4 py-1.5 text-[9px] font-black rounded-xl uppercase tracking-widest border ${
                                            c.stage === 'Offered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                            c.stage === 'Interview' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                        }`}>
                                            {c.stage}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1">
                                                <Star size={12} className="text-orange-400 fill-orange-400" />
                                                <span className="text-[11px] font-black text-slate-800">{c.rating}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{c.source}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                            <button 
                                                onClick={() => navigate(`/recruitment/candidate/${c.id}`)}
                                                className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm active:scale-95"
                                            >
                                                <ArrowUpRight size={18} />
                                            </button>
                                            <button className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-slate-800 rounded-xl shadow-sm active:scale-95">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Logic */}
                <div className="px-10 py-5 bg-slate-900 border-t border-white/5 flex items-center justify-between text-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-glow shadow-emerald-500/50"></div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Recruit Pipeline Synchronized: 100% Secure</p>
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Database Version: tal.v4.0.2</p>
                </div>

            </div>

        </div>
    );
};

export default Candidates;
