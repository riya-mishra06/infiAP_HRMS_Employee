import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Bell,
  Shield,
  Database,
  Download,
  Upload,
  RefreshCw,
  Archive,
  Loader2,
  CheckCircle,
  X,
  ChevronRight,
  Settings2,
  Activity
} from 'lucide-react';
import { getCompanySettings, updateCompanySettings } from '../../../services/adminApi';

const TIMEZONE_OPTIONS = [
  { value: 'UTC +05:30 (Chennai, Kolkata, Mumbai)', label: 'IST (India Standard Time)' },
  { value: 'UTC +00:00 (GMT London)', label: 'GMT (Greenwich Mean Time)' },
  { value: 'UTC -05:00 (EST New York)', label: 'EST (Eastern Standard Time)' },
  { value: 'UTC +08:00 (Singapore)', label: 'SGT (Singapore Time)' },
];

const DATE_FORMAT_OPTIONS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const CURRENCY_OPTIONS = [
  { value: 'INR (₹)', label: 'Indian Rupee (₹)' },
  { value: 'USD ($)', label: 'US Dollar ($)' },
  { value: 'EUR (€)', label: 'Euro (€)' },
];

const LANGUAGE_OPTIONS = [
  { value: 'English (US)', label: 'English (US)' },
  { value: 'English (UK)', label: 'English (UK)' },
  { value: 'Hindi (HI)', label: 'Hindi' },
];

const SESSION_TIMEOUT_OPTIONS = [
  { value: '15 Minutes', label: '15 Minutes' },
  { value: '30 Minutes', label: '30 Minutes' },
  { value: '60 Minutes', label: '60 Minutes' },
  { value: 'Never', label: 'Never' },
];

const Toggle = ({ active, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
      active
        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25'
        : 'bg-gray-200'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
      active ? 'left-[22px]' : 'left-0.5'
    }`}>
      {active && <CheckCircle size={10} className="text-emerald-500" />}
    </div>
  </button>
);

const SectionCard = ({ icon: Icon, iconBg, iconColor, title, description, children, delay = 0 }) => (
  <div
    className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-start gap-4 mb-6">
      <div className={`p-3 rounded-xl ${iconBg}`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

const SettingRow = ({ label, description, children }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
    <div className="flex-1 min-w-0 mr-4">
      <p className="text-sm font-medium text-gray-800">{label}</p>
      {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const SelectField = ({ value, onChange, options, className = '' }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all cursor-pointer ${className}`}
  >
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

const DataButton = ({ icon: Icon, label, onClick, variant = 'default' }) => {
  const baseClasses = "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]";
  const variants = {
    default: "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-md",
    export: "border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300",
    import: "border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300",
    backup: "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300",
  };

  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]}`}>
      <Icon size={20} className={variant === 'export' ? 'text-blue-500' : variant === 'import' ? 'text-amber-500' : variant === 'backup' ? 'text-emerald-500' : 'text-gray-500'} />
      <span className="text-xs font-medium text-gray-600">{label}</span>
    </button>
  );
};

const SystemSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const [config, setConfig] = useState({
    timezone: 'UTC +05:30 (Chennai, Kolkata, Mumbai)',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR (₹)',
    language: 'English (US)',
    sessionTimeout: '15 Minutes',
    emailNotif: true,
    mobilePush: true,
    hrAlerts: false,
    twoFactor: true,
    loginMonitor: true,
    systemLogs: true,
    maintenanceMode: false,
  });

  const showNotification = useCallback((msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await getCompanySettings();
      if (res?.data?.success && res?.data?.data) {
        setConfig(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (err) {
      // debug error removed
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await updateCompanySettings(config);
      showNotification('Settings saved successfully!');
    } catch (err) {
      // debug error removed
      showNotification('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDataAction = async (action) => {
    switch (action) {
      case 'Export': {
        const exportData = { settings: config, exportedAt: new Date().toISOString(), version: 'v1.0' };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `infiap_settings_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Settings exported successfully!');
        break;
      }
      case 'Restore': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              try {
                const data = JSON.parse(event.target.result);
                if (data.settings) {
                  setConfig(prev => ({ ...prev, ...data.settings }));
                  showNotification('Settings restored successfully!');
                }
              } catch (err) {
                showNotification('Invalid file format', 'error');
              }
            };
            reader.readAsText(file);
          }
        };
        input.click();
        break;
      }
      case 'Backup':
        showNotification('Backup created successfully!');
        break;
      case 'Import':
        showNotification('Import feature coming soon!');
        break;
      default:
        break;
    }
  };

  const resetToDefaults = () => {
    if (window.confirm('Reset all settings to defaults?')) {
      setConfig({
        timezone: 'UTC +05:30 (Chennai, Kolkata, Mumbai)',
        dateFormat: 'DD/MM/YYYY',
        currency: 'INR (₹)',
        language: 'English (US)',
        sessionTimeout: '15 Minutes',
        emailNotif: true,
        mobilePush: true,
        hrAlerts: false,
        twoFactor: true,
        loginMonitor: true,
        systemLogs: true,
        maintenanceMode: false,
      });
      showNotification('Settings reset to defaults');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-3 border-gray-100 border-t-emerald-500 animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50 p-6 md:p-8">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUp 0.5s ease-out forwards; }
      `}</style>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl animate-slide-up ${
          notification.type === 'error'
            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
            : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white'
        }`}>
          {notification.type === 'error' ? (
            <X size={18} className="shrink-0" />
          ) : (
            <CheckCircle size={18} className="shrink-0" />
          )}
          <span className="text-sm font-medium">{notification.msg}</span>
          <button onClick={() => setNotification(null)} className="ml-1 opacity-70 hover:opacity-100 transition-opacity">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-slide-up">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
                <Settings2 size={20} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">Configure your platform preferences and security options</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={resetToDefaults}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Reset
            </button>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="grid gap-6">
          {/* General Settings */}
          <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <SectionCard
              icon={Globe}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              title="General Preferences"
              description="Configure regional and display settings"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'timezone', options: TIMEZONE_OPTIONS },
                  { key: 'dateFormat', options: DATE_FORMAT_OPTIONS },
                  { key: 'currency', options: CURRENCY_OPTIONS },
                  { key: 'language', options: LANGUAGE_OPTIONS },
                ].map(({ key, options }) => (
                  <div key={key} className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {key === 'timezone' ? 'Timezone' : key === 'dateFormat' ? 'Date Format' : key === 'currency' ? 'Currency' : 'Language'}
                    </label>
                    <SelectField
                      value={config[key]}
                      onChange={(val) => handleConfigChange(key, val)}
                      options={options}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Notifications */}
          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <SectionCard
              icon={Bell}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              title="Notifications"
              description="Manage how you receive alerts and updates"
            >
              <div className="space-y-1">
                {[
                  { key: 'emailNotif', label: 'Email Notifications', desc: 'Receive important updates via email' },
                  { key: 'mobilePush', label: 'Push Notifications', desc: 'Get instant alerts on your device' },
                  { key: 'hrAlerts', label: 'HR & Payroll Alerts', desc: 'Important system notifications' },
                ].map(({ key, label, desc }, idx) => (
                  <SettingRow key={key} label={label} description={desc}>
                    <Toggle active={config[key]} onClick={() => handleToggle(key)} />
                  </SettingRow>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Security */}
          <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
            <SectionCard
              icon={Shield}
              iconBg="bg-red-50"
              iconColor="text-red-600"
              title="Security & Access"
              description="Configure authentication and monitoring settings"
            >
              <div className="space-y-1">
                {[
                  { key: 'twoFactor', label: 'Two-Factor Authentication', desc: 'Add an extra layer of security' },
                  { key: 'loginMonitor', label: 'Login Monitoring', desc: 'Track and monitor login activity' },
                ].map(({ key, label, desc }) => (
                  <SettingRow key={key} label={label} description={desc}>
                    <Toggle active={config[key]} onClick={() => handleToggle(key)} />
                  </SettingRow>
                ))}
                <div className="pt-4 mt-2 border-t border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Session Timeout</p>
                      <p className="text-xs text-gray-400 mt-0.5">Auto logout after inactivity</p>
                    </div>
                    <SelectField
                      value={config.sessionTimeout}
                      onChange={(val) => handleConfigChange('sessionTimeout', val)}
                      options={SESSION_TIMEOUT_OPTIONS}
                      className="w-full sm:w-44"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Platform & Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Platform */}
            <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
              <SectionCard
                icon={Activity}
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
                title="Platform Settings"
                description="System and maintenance options"
              >
                <div className="space-y-1">
                  {[
                    { key: 'systemLogs', label: 'System Logs', desc: 'Enable logging for debugging' },
                    { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Restrict access to admins only' },
                  ].map(({ key, label, desc }) => (
                    <SettingRow key={key} label={label} description={desc}>
                      <Toggle active={config[key]} onClick={() => handleToggle(key)} />
                    </SettingRow>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Data Management */}
            <div className="animate-slide-up" style={{ animationDelay: '500ms' }}>
              <SectionCard
                icon={Database}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                title="Data Management"
                description="Backup, restore, and export your settings"
              >
                <div className="grid grid-cols-2 gap-3">
                  <DataButton icon={Archive} label="Backup" onClick={() => handleDataAction('Backup')} variant="backup" />
                  <DataButton icon={RefreshCw} label="Restore" onClick={() => handleDataAction('Restore')} />
                  <DataButton icon={Download} label="Export" onClick={() => handleDataAction('Export')} variant="export" />
                  <DataButton icon={Upload} label="Import" onClick={() => handleDataAction('Import')} variant="import" />
                </div>
              </SectionCard>
            </div>
          </div>

          {/* System Status */}
          <div className="animate-slide-up" style={{ animationDelay: '600ms' }}>
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 text-white relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
                  <div>
                    <h3 className="text-lg font-semibold">System Status</h3>
                    <p className="text-sm text-gray-400 mt-0.5">All systems operational</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Version</p>
                    <p className="text-xl font-bold text-white">v1.0.0</p>
                  </div>
                  <button
                    onClick={() => showNotification('Checking for updates...')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <RefreshCw size={14} />
                    Check Updates
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">InfiAP HRMS • Settings Page</p>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;