import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  MoreVertical,
  Search,
  ArrowRight
} from 'lucide-react';
import { hrService } from '../../../services/hr.service';

const RecruitmentHub = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({ openJobs: 0, totalCandidates: 0, interviewCount: 0, filledRoles: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadRecruitmentData = async () => {
      setLoading(true);
      setError('');

      try {
        const [dashboardRes, jobsRes] = await Promise.all([
          hrService.getRecruitmentDashboard(),
          hrService.getRecruitmentJobs()
        ]);

        if (!isMounted) return;

        const dashboardData = dashboardRes?.data || {};
        const jobsData = Array.isArray(jobsRes?.data) ? jobsRes.data : [];

        setStats({
          openJobs: Number(dashboardData.openJobs) || 0,
          totalCandidates: Number(dashboardData.totalCandidates) || 0,
          interviewCount: Number(dashboardData.interviewCount) || 0,
          filledRoles: Number(dashboardData.filledRoles) || 0
        });

        setJobs(jobsData.map((job) => ({
          id: job._id || job.id,
          title: job.title || 'Untitled Role',
          department: job.department || 'General',
          location: job.location || 'Remote',
          type: job.type || 'Full-time',
          status: job.status || 'Open',
          applicants: Number(job.applicants) || 0,
          deadline: job.deadline || job.closingDate || null
        })));
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.response?.data?.message || 'Failed to load recruitment data');
        setJobs([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRecruitmentData();

    return () => {
      isMounted = false;
    };
  }, []);

  const overviewStats = useMemo(() => ([
    { label: 'Open Jobs', value: String(stats.openJobs), icon: Briefcase },
    { label: 'Applicants', value: String(stats.totalCandidates), icon: Users },
    { label: 'Interviews', value: String(stats.interviewCount), icon: CheckCircle2 },
    { label: 'Filled Roles', value: String(stats.filledRoles), icon: Calendar },
  ]), [stats.openJobs, stats.totalCandidates, stats.interviewCount, stats.filledRoles]);


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2 uppercase">Recruitment</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] leading-none">Live requisitions and applicant flow</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search jobs..." 
              className="bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all w-[300px] shadow-sm"
            />
          </div>
        </div>
      </div>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {overviewStats.map((stat, idx) => (
            <div key={idx} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                <stat.icon size={18} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-3">
             <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">Active job postings</h2>
             <span className="bg-slate-50 text-slate-600 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">{jobs.length} live</span>
          </div>
          {error ? <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">{error}</span> : null}
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-8 text-sm font-bold text-slate-500">Loading live jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
              <Briefcase size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No live roles yet</h3>
              <p className="text-sm text-slate-500 mt-2">Create a job posting to populate this view with active recruitment data.</p>
            </div>
            <button
              onClick={() => navigate('/admin/recruitment-control/create')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all active:scale-95"
            >
              Create Job
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group relative overflow-hidden">
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1 group-hover:text-indigo-600 transition-colors uppercase">{job.title}</h3>
                    <p className="text-sm text-slate-500">{job.department} • {job.location || 'Remote'}</p>
                  </div>
                  <button className="text-slate-200 hover:text-slate-400 transition-colors p-2 hover:bg-slate-50 rounded-xl">
                    <MoreVertical size={20} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between mb-6 relative z-10 text-sm font-medium text-slate-500">
                  <span>{job.applicants} applicants</span>
                  <span className="font-black uppercase tracking-widest text-emerald-600">{job.status}</span>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                  <button 
                    onClick={() => navigate('/admin/recruitment-control/tracking')}
                    className="flex-1 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-700 transition-all active:scale-95"
                  >
                    View Applicants
                  </button>
                  <button 
                    onClick={() => navigate('/admin/recruitment-control/create')}
                    className="px-6 py-4 border border-slate-200 text-slate-500 hover:border-slate-900 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button 
          onClick={() => navigate('/admin/recruitment-control/create')}
          className="fixed bottom-12 right-12 w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center group z-40"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </section>
    </div>
  );
};

export default RecruitmentHub;
