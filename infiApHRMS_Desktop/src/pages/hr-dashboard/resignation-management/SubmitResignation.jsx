import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Loader2,
  Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { createResignation, getHrProfile } from '../../../services/hrApi';

const reasons = [
  'Better Opportunity',
  'Relocation',
  'Personal Reasons',
  'Career Change',
  'Higher Education',
  'Other'
];

const getProfileData = (apiData, user) => ({
  employeeName: apiData?.header?.name || apiData?.personalInfo?.fullName || apiData?.name || user?.name || '',
  employeeId: apiData?.professionalInfo?.employeeId || apiData?.header?.hrId || apiData?.employeeId || user?.employeeId || user?._id || '',
  department: apiData?.professionalInfo?.department || apiData?.department || user?.department || '',
  designation: apiData?.professionalInfo?.designation || apiData?.header?.post || apiData?.designation || user?.designation || user?.role || ''
});

const SubmitResignation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    employeeName: '',
    employeeId: '',
    department: '',
    designation: ''
  });
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeId: '',
    department: '',
    designation: '',
    noticeDate: '',
    lastDay: '',
    reason: '',
    comments: ''
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        setProfileError('');
        const response = await getHrProfile();
        const apiData = response.data?.data || response.data || {};
        const loadedProfile = getProfileData(apiData, user);
        if (isMounted) {
          setProfile(loadedProfile);
          setFormData((prev) => ({
            ...prev,
            employeeName: prev.employeeName || loadedProfile.employeeName,
            employeeId: prev.employeeId || loadedProfile.employeeId,
            department: prev.department || loadedProfile.department,
            designation: prev.designation || loadedProfile.designation
          }));
        }
      } catch (err) {
        // debug error removed
        if (isMounted) {
          const fallbackProfile = getProfileData({}, user);
          setProfile(fallbackProfile);
          setFormData((prev) => ({
            ...prev,
            employeeName: prev.employeeName || fallbackProfile.employeeName,
            employeeId: prev.employeeId || fallbackProfile.employeeId,
            department: prev.department || fallbackProfile.department,
            designation: prev.designation || fallbackProfile.designation
          }));
          setProfileError('Profile API unavailable. Showing your authenticated account details.');
        }
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await createResignation({
        employeeName: formData.employeeName,
        employeeId: formData.employeeId,
        department: formData.department,
        designation: formData.designation,
        noticeDate: formData.noticeDate,
        resignationDate: formData.noticeDate,
        lastWorkingDay: formData.lastDay,
        lastWorkingDate: formData.lastDay,
        reason: formData.reason,
        comments: formData.comments
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to submit resignation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] w-full items-center justify-center pt-4">
        <div className="w-full max-w-lg bg-white border border-slate-100 rounded-3xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={34} />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Resignation Submitted</h1>
          <p className="text-sm text-slate-500 mt-3">
            Your resignation request has been sent to HR for review.
          </p>
          <button
            onClick={() => navigate('/resignation')}
            className="mt-8 w-full py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all"
          >
            Back to Resignation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full gap-6 pt-4 overflow-hidden text-left">
      <div className="flex items-center gap-4 shrink-0">
        <button
          onClick={() => navigate('/resignation')}
          className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Submit Resignation</h1>
          <p className="text-sm text-slate-500 mt-1">Submit a resignation request using your live HR profile details.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 flex-1 min-h-0">
        <div className="xl:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm h-fit">
          <h2 className="text-lg font-black text-slate-900">Employee Details</h2>
          <p className="text-sm text-slate-500 mt-1">Loaded from your HR profile. You can edit these fields for another employee.</p>

          {loadingProfile ? (
            <div className="py-10 flex items-center gap-3 text-sm font-bold text-slate-500">
              <Loader2 size={18} className="animate-spin" />
              Loading profile...
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {profileError && (
                <div className="p-3 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl flex items-start gap-2 text-sm font-semibold">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {profileError}
                </div>
              )}

              {[
                ['Default Name', profile.employeeName || 'N/A'],
                ['Default Employee ID', profile.employeeId || 'N/A'],
                ['Default Department', profile.department || 'N/A'],
                ['Default Designation', profile.designation || 'N/A']
              ].map(([label, value]) => (
                <div key={label} className="border-b border-slate-100 pb-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="xl:col-span-3 bg-white border border-slate-100 rounded-3xl shadow-sm overflow-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {submitError && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3 text-sm font-semibold">
                <AlertCircle size={18} />
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="space-y-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Employee Name</span>
                <input
                  type="text"
                  required
                  value={formData.employeeName}
                  onChange={(event) => setFormData((prev) => ({ ...prev, employeeName: event.target.value }))}
                  placeholder="Enter employee name"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Employee ID</span>
                <input
                  type="text"
                  required
                  value={formData.employeeId}
                  onChange={(event) => setFormData((prev) => ({ ...prev, employeeId: event.target.value }))}
                  placeholder="Enter employee ID"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="space-y-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Department</span>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(event) => setFormData((prev) => ({ ...prev, department: event.target.value }))}
                  placeholder="Enter department"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Designation</span>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(event) => setFormData((prev) => ({ ...prev, designation: event.target.value }))}
                  placeholder="Enter designation"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="space-y-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Notice Date</span>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={formData.noticeDate}
                    onChange={(event) => setFormData((prev) => ({ ...prev, noticeDate: event.target.value }))}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Last Working Day</span>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={formData.lastDay}
                    onChange={(event) => setFormData((prev) => ({ ...prev, lastDay: event.target.value }))}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                  />
                </div>
              </label>
            </div>

            <label className="space-y-2 block">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Reason</span>
              <select
                required
                value={formData.reason}
                onChange={(event) => setFormData((prev) => ({ ...prev, reason: event.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="">Select reason</option>
                {reasons.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 block">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Comments</span>
              <textarea
                value={formData.comments}
                onChange={(event) => setFormData((prev) => ({ ...prev, comments: event.target.value }))}
                placeholder="Add optional context for HR"
                className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 resize-none"
              />
            </label>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || loadingProfile || !formData.employeeName || !formData.employeeId || !formData.department}
                className="flex-1 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Submit Resignation
              </button>
              <button
                type="button"
                onClick={() => navigate('/resignation')}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmitResignation;
