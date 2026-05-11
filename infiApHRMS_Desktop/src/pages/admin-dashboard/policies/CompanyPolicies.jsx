import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, FileText, Clock, Filter } from 'lucide-react';
import { usePolicyContext } from '../../../context/PolicyContext';

const CompanyPolicies = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { policies, loading, error, fetchPolicies, removePolicy } = usePolicyContext();

  useEffect(() => {
    fetchPolicies();
  }, []);

  const stats = useMemo(() => ([
    { label: 'Total', value: String(policies.length) },
    { label: 'Active', value: String(policies.filter((policy) => policy.status === 'Active').length) },
    { label: 'Draft', value: String(policies.filter((policy) => policy.status === 'Draft').length) },
  ]), [policies]);

  const filteredPolicies = policies.filter((policy) => {
    const query = searchQuery.toLowerCase();
    return [policy.title, policy.status, policy.description, policy.category]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Draft': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Archived': return 'bg-slate-50 text-slate-400 border-slate-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-2">
        <div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2 uppercase">Company Policies</h1>
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] leading-none">Live policy registry</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search policies..."
                className="bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all w-[300px] shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           <button className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm hover:bg-slate-700 active:scale-95 transition-all">
              <Plus size={24} strokeWidth={2.5} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Policy Node</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
             </div>
             <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                <FileText size={22} />
             </div>
          </div>
        ))}
      </div>

      <div className="px-2">
        <div className="flex items-center justify-between mb-6 px-4">
           <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">All policies</h2>
           <button className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
              <Filter size={14} />
              Filter by status
           </button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-8 text-sm font-bold text-slate-500">Loading policies...</div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-100 bg-rose-50 p-8 text-sm font-bold text-rose-700">{error}</div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {filteredPolicies.map((policy) => (
             <div key={policy._id} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm transition-all relative overflow-hidden flex flex-col justify-between min-h-[260px]">
                <div className="relative z-10">
                   <div className="flex items-center justify-between mb-6">
                      <div className={`px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusStyle(policy.status)}`}>
                         {policy.status || 'Draft'}
                      </div>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-4 py-2 bg-slate-50 rounded-lg">{policy.category || 'POLICY'}</span>
                   </div>

                   <h3 className="text-xl font-black text-slate-900 tracking-tight mb-3 uppercase leading-tight">{policy.title}</h3>
                   <p className="text-sm text-slate-500 leading-relaxed mb-4">{policy.description || 'No description provided.'}</p>
                   
                   <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Clock size={14} strokeWidth={2.5} />
                      Updated {policy.updatedAt ? new Date(policy.updatedAt).toLocaleDateString() : 'recently'}
                   </div>
                </div>

                <div className="mt-8 flex items-center gap-3 relative z-10">
                   <button className="flex-1 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-700 transition-all">
                      View
                   </button>
                   <button onClick={() => removePolicy(policy._id)} className="py-4 px-5 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all">
                      Delete
                   </button>
                </div>
             </div>
           ))}
        </div>
        )}
      </div>

      <div className="fixed bottom-12 right-12 z-20">
         <button className="w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-all">
            <Plus size={24} strokeWidth={3} />
         </button>
      </div>
    </div>
  );
};

export default CompanyPolicies;
