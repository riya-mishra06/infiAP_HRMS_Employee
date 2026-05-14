import React, { useState } from 'react';
import { X, User, Mail, Phone, Briefcase, Globe, Star, Upload, Rocket } from 'lucide-react';
import { createCandidate } from '../../../services/hrApi';

const AddCandidateModal = ({ isOpen, onClose, onRefresh }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        applicantName: '',
        email: '',
        phone: '',
        jobTitle: '',
        yearsOfExperience: 0,
        location: '',
        source: 'LinkedIn',
        rating: 4.0
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createCandidate(formData);
            onRefresh();
            onClose();
        } catch (err) {
            alert("Failed to add candidate");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 text-left">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-12 py-10 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Ingest Candidate</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manual Applicant Entry Protocol</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-300 hover:text-slate-900">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-12 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input 
                                    required
                                    type="text" 
                                    placeholder="e.g. Alex Rivers"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner"
                                    value={formData.applicantName}
                                    onChange={(e) => setFormData({...formData, applicantName: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input 
                                    required
                                    type="email" 
                                    placeholder="alex@work.com"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Target Role</label>
                            <div className="relative group">
                                <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input 
                                    required
                                    type="text" 
                                    placeholder="e.g. Senior Frontend Engineer"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner"
                                    value={formData.jobTitle}
                                    onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Experience (Years)</label>
                            <div className="relative group">
                                <Star className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input 
                                    required
                                    type="number" 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner"
                                    value={formData.yearsOfExperience}
                                    onChange={(e) => setFormData({...formData, yearsOfExperience: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Location</label>
                            <div className="relative group">
                                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="e.g. New York, Remote"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner"
                                    value={formData.location}
                                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Acquisition Source</label>
                            <select 
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner appearance-none"
                                value={formData.source}
                                onChange={(e) => setFormData({...formData, source: e.target.value})}
                            >
                                <option>LinkedIn</option>
                                <option>Referral</option>
                                <option>Indeed</option>
                                <option>Career Page</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>
                </form>

                <div className="p-12 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
                    <button onClick={onClose} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Cancel</button>
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-10 py-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3 disabled:opacity-50 active:scale-95"
                    >
                        {loading ? 'Processing...' : (
                            <>
                                <Rocket size={16} />
                                Launch Entry
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddCandidateModal;
