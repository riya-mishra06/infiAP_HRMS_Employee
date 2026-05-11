import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Lock, Search, Plus, FileText, Clock } from 'lucide-react';
import { usePolicyContext } from '../../../context/PolicyContext';

const SecurityDocuments = () => {
  const { policies, loading, error, fetchPolicies } = usePolicyContext();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPolicies();
  }, []);

  const stats = useMemo(() => ([
    {
      label: 'Total Documents',
      value: String(policies.length),
      icon: FileText
    },
    {
      label: 'Confidential',
      value: String(policies.filter((policy) => policy.status === 'Confidential').length),
      icon: Lock
    },
    {
      label: 'Compliance',
      value: String(policies.filter((policy) => policy.status === 'Compliance').length),
      icon: ShieldCheck
    }
  ]), [policies]);

  const filteredDocuments = policies.filter((document) => {
    const query = searchQuery.toLowerCase();
    return [document.title, document.description, document.status, document.category]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const getStatusStyle = (status) => {
    switch (String(status || '').toLowerCase()) {
      case 'confidential':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'compliance':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'public':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2 uppercase">Security Documents</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] leading-none">Live document registry</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-indigo-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search documents..."
              className="bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all w-[300px] shadow-sm"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Security Node</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
              <stat.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      <div className="px-2">
        <div className="flex items-center justify-between mb-6 px-4">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Documents</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{filteredDocuments.length} live</span>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-8 text-sm font-bold text-slate-500">Loading documents...</div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-100 bg-rose-50 p-8 text-sm font-bold text-rose-700">{error}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredDocuments.map((document) => (
              <div key={document._id} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate">{document.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{document.category || 'General'}</p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusStyle(document.status)}`}>
                    {document.status || 'Internal'}
                  </div>
                </div>

                <p className="text-sm text-slate-500 leading-relaxed mb-4">{document.description || 'No description available.'}</p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-2"><Clock size={12} /> Updated {document.updatedAt ? new Date(document.updatedAt).toLocaleDateString() : 'recently'}</span>
                  <span>{document.department || 'All departments'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityDocuments;
