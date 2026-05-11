import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  X, 
  MapPin, 
  Calendar, 
  Rocket, 
  Save, 
  ChevronDown,
} from 'lucide-react';
import { useAdminDashboard } from '../../../context/AdminDashboardContext';

const CreateJob = () => {
  const navigate = useNavigate();
  const { addJob } = useAdminDashboard();
  const [skills, setSkills] = useState(['Figma', 'React']);
  const [skillInput, setSkillInput] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    department: 'Engineering',
    type: 'Full-time',
    description: '',
    experience: 'Entry (0-2 years)',
    location: '',
    deadline: ''
  });

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    await addJob({
      ...formData,
      skills
    });
    navigate('/admin/recruitment-control/hub');
  };

  const removeSkill = (skill) => {
    setSkills(skills.filter(s => s !== skill));
  };

  return (
    <div className="max-w-[1000px] mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Navigation Header */}
      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={() => navigate('/admin/recruitment-control/hub')}
          className="p-4 bg-white rounded-2xl text-slate-400 hover:text-slate-800 transition-all shadow-soft active:scale-95 group"
        >
          <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
           <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-2 underline decoration-indigo-300 underline-offset-4 uppercase">Post New Job</h1>
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1 leading-none">Assemble a new organizational role node</p>
        </div>
        <div className="w-14"></div> {/* Balance spacer */}
      </div>

      {/* Progress System */}
      <div className="bg-white p-10 rounded-[32px] border border-slate-50 shadow-soft mb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-sm font-black text-indigo-600 uppercase tracking-widest block mb-1">Step 2 of 4</span>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Job Details</h2>
          </div>
          <span className="text-lg font-black text-indigo-400 tracking-tighter">50%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-linear-to-r from-indigo-500 to-indigo-600 transition-all duration-1000 ease-out" style={{ width: '50%' }}></div>
        </div>
      </div>

      {/* Main Form Architecture */}
      <div className="bg-white p-12 rounded-[48px] border border-slate-50 shadow-soft space-y-12">
        {/* Job Title */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Job Title</label>
          <input 
            type="text" 
            placeholder="e.g. Senior Product Designer"
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all shadow-inner"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        {/* Dept & Type Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4 relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
            <div className="relative">
              <select 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner appearance-none"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              >
                <option>Engineering</option>
                <option>Design</option>
                <option>Marketing</option>
                <option>Operations</option>
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
            </div>
          </div>
          <div className="space-y-4 relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
            <div className="relative">
              <select 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner appearance-none"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option>Full-time</option>
                <option>Contract</option>
                <option>Freelance</option>
                <option>Part-time</option>
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Job Description</label>
          <textarea 
            placeholder="Describe the role, responsibilities, and team..."
            rows={6}
            className="w-full bg-slate-50 border border-slate-100 rounded-[32px] px-8 py-6 text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner resize-none leading-relaxed"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          ></textarea>
        </div>

        {/* Required Skills - Chip System */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Required Skills</label>
          <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 flex flex-wrap gap-3 shadow-inner">
            {skills.map(skill => (
              <span key={skill} className="bg-indigo-50 text-indigo-600 text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2 group hover:bg-indigo-100 transition-colors">
                {skill}
                <X 
                  size={14} 
                  className="cursor-pointer hover:text-rose-500 transition-colors" 
                  onClick={() => removeSkill(skill)}
                />
              </span>
            ))}
            <input 
              type="text"
              placeholder="Add skill..."
              className="bg-transparent border-none outline-none text-xs font-black text-slate-600 placeholder:text-slate-300 py-2 min-w-[120px]"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleAddSkill}
            />
          </div>
        </div>

        {/* Exp Level */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Experience Level</label>
          <div className="relative">
            <select 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner appearance-none"
              value={formData.experience}
              onChange={(e) => setFormData({...formData, experience: e.target.value})}
            >
              <option>Entry (0-2 years)</option>
              <option>Mid (3-5 years)</option>
              <option>Senior (6+ years)</option>
              <option>Lead / Principal</option>
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
          </div>
        </div>

        {/* Location & Deadline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4 relative group">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
            <div className="relative">
              <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="San Francisco, CA or Remote"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-4 relative group">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Application Deadline</label>
            <div className="relative">
              <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input 
                type="date" 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner appearance-none"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Form Action Intelligence */}
        <div className="pt-10 flex flex-col sm:flex-row items-center gap-6">
          <button 
            onClick={handlePublish}
            className="w-full sm:flex-1 py-6 border-2 border-indigo-600 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-[28px] hover:bg-indigo-50 transition-all flex items-center justify-center gap-4 active:scale-95"
          >
            <Save size={20} />
            Save Draft
          </button>
          <button 
            onClick={handlePublish}
            className="w-full sm:flex-1 py-6 bg-linear-to-r from-[#4E63F0] to-[#6855E8] text-white text-[10px] font-black uppercase tracking-widest rounded-[28px] shadow-2xl shadow-indigo-100 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-4 hover:-translate-y-1 active:scale-95"
          >
            <Rocket size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            Publish Role Protocols
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateJob;
