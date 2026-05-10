import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  DoorOpen,
  FileSignature,
  RefreshCw,
  Search,
  UserX
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getResignationRegister } from '../../../services/hrApi';

const getPayloadArray = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.requests)) return payload.requests;
  if (Array.isArray(payload.resignations)) return payload.resignations;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const normalizeResignation = (item, index) => {
  const employee = item.employee || item.user || {};
  const employeeName = item.employeeName || item.name || employee.name || employee.fullName || 'Unknown Employee';
  const status = item.status || item.exitStatus || item.approvalStatus || 'Pending';

  return {
    id: item._id || item.id || item.resignationId || `RES-${index + 1}`,
    employeeName,
    employeeId: item.employeeId || employee.employeeId || employee.empId || 'N/A',
    department: item.department || employee.department || item.dept || 'N/A',
    role: item.role || item.designation || employee.role || employee.designation || 'N/A',
    reason: item.reason || item.exitReason || item.primaryReason || 'No reason provided',
    resignationDate: item.resignationDate || item.submittedAt || item.createdAt,
    lastWorkingDate: item.lastWorkingDate || item.noticeEndDate || item.exitDate,
    status,
    clearanceStatus: item.clearanceStatus || item.exitProcessStatus || item.clearance || 'Pending'
  };
};

const statusStyles = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  InProgress: 'bg-blue-50 text-blue-700 border-blue-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200'
};

const ResignationHub = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [activeStatus, setActiveStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResignations = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getResignationRegister();
      setRequests(getPayloadArray(response).map(normalizeResignation));
    } catch (err) {
      console.error('Failed to fetch resignation register:', err);
      setRequests([]);
      setError('Unable to load resignation data. Please refresh once the HR API is available.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResignations();
  }, []);

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus = activeStatus === 'All' || request.status === activeStatus;
      const matchesSearch = !query || [
        request.employeeName,
        request.employeeId,
        request.department,
        request.role,
        request.reason,
        request.status,
        request.clearanceStatus
      ].some((value) => String(value).toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [activeStatus, requests, searchQuery]);

  const statuses = ['All', ...Array.from(new Set(requests.map((request) => request.status).filter(Boolean)))];
  const pendingCount = requests.filter((request) => request.status === 'Pending').length;
  const activeCount = requests.filter((request) => !['Completed', 'Rejected'].includes(request.status)).length;
  const completedCount = requests.filter((request) => request.status === 'Completed').length;
  const clearancePending = requests.filter((request) => String(request.clearanceStatus).toLowerCase() !== 'completed').length;

  const cards = [
    { label: 'Active Exits', value: activeCount, icon: UserX, color: 'text-rose-600' },
    { label: 'Pending Review', value: pendingCount, icon: Clock, color: 'text-amber-600' },
    { label: 'Clearance Pending', value: clearancePending, icon: DoorOpen, color: 'text-blue-600' },
    { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'text-emerald-600' }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full gap-6 pt-4 overflow-hidden text-left">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Resignation Management</h1>
          <p className="text-sm text-slate-500 mt-1">Live resignation register and offboarding status.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/resignation/submit')}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <FileSignature size={16} />
            Submit
          </button>
          <button
            onClick={fetchResignations}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-60 flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
        {cards.map((card) => (
          <div key={card.label} className="bg-white border border-slate-100 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
              <card.icon size={20} className={card.color} />
            </div>
            <p className="text-3xl font-black text-slate-900 mt-4">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                  activeStatus === status
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-80">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search employee, department, status"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
            />
          </div>
        </div>

        {error && (
          <div className="m-5 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3 text-sm font-semibold">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Reason</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Dates</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-14 text-center text-sm font-bold text-slate-500">
                    Loading real resignation data...
                  </td>
                </tr>
              ) : filteredRequests.length ? (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-900">{request.employeeName}</p>
                      <p className="text-xs text-slate-500 mt-1">{request.department} • {request.role}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-800 max-w-md truncate">{request.reason}</p>
                      <p className="text-xs text-slate-500 mt-1">Clearance: {request.clearanceStatus}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Calendar size={16} className="text-slate-400" />
                        {formatDate(request.resignationDate)}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Last day: {formatDate(request.lastWorkingDate)}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-black ${statusStyles[request.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => navigate('/resignation/requests')}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-900 hover:text-white transition-all"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-14 text-center">
                    <p className="text-sm font-black text-slate-700">No resignation records found</p>
                    <p className="text-xs text-slate-400 mt-1">This table only shows data returned by the HR API.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
          <span>{filteredRequests.length} visible of {requests.length} resignation record(s)</span>
          <button
            onClick={() => navigate('/resignation/exit')}
            className="text-slate-700 hover:text-slate-900"
          >
            Exit process
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResignationHub;
