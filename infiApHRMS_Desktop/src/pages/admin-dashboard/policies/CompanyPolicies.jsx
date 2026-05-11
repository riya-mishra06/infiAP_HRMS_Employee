import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, FileText, Clock, Loader2, X, ExternalLink } from 'lucide-react';
import api from '../../../utils/axios';

const PRIVACY_POLICY = {
  title: 'Privacy Policy',
  category: 'Legal',
  status: 'Active',
  content: `YourCompany Technologies Pvt. Ltd.
Effective Date: January 1, 2025 | Last Updated: April 2025

1. What Data We Collect
When you use YourCompany, we may collect the following types of information:
• Information you give us directly: Full name and email address (when you sign up), Company name and job title (optional), Billing information (processed securely via our payment partner — we never store your card details).
• Information collected automatically: IP address and approximate location (city-level), Browser type, device type, and operating system, Pages visited, features used, and time spent on the platform, Cookies and similar tracking technologies.

2. Why We Collect It
We use your data only for legitimate business purposes:
• To create and manage your account
• To deliver the product and features you signed up for
• To send you important account notices and product updates
• To analyze usage patterns and improve the platform
• To process billing and prevent fraud
• To respond to your support requests

3. Who We Share Data With
We do not sell your personal data. We share limited data with trusted third-party service providers:
• Cloud infrastructure (AWS, Google Cloud) — for hosting and storage
• Analytics tools (Google Analytics, Mixpanel) — for understanding usage
• Payment processors (Razorpay, Stripe) — for billing
• Email delivery providers (SendGrid) — for transactional emails

4. How Long We Keep Your Data
• Account data is retained for the duration of your account and deleted within 30 days of account closure
• Usage and analytics data is retained for up to 24 months in aggregated form
• Billing records are retained for 7 years as required by Indian tax law

5. Your Rights
You have full control over your personal data:
• Access — Request a copy of all personal data we hold about you
• Correct — Ask us to update any inaccurate or outdated information
• Delete — Request permanent deletion of your account and all associated data
• Portability — Request your data in a structured, machine-readable format
• Opt out — Unsubscribe from marketing emails at any time

6. Cookies & Tracking
• Essential cookies — Required for login, security, and core features. Cannot be disabled
• Analytics cookies — Help us understand which features people use. You can opt out
• Preference cookies — Remember your settings like language and display preferences

7. Data Security
• All data is encrypted in transit (TLS 1.2+) and at rest (AES-256)
• Access to production systems is restricted to authorized personnel only
• We perform regular security audits and vulnerability assessments
• In the event of a data breach, we will notify affected users within 72 hours

8. Contact & Privacy Requests
If you have any questions, concerns, or requests related to your privacy, please reach out to privacy@yourcompany.io`
};

const TERMS_OF_SERVICE = {
  title: 'Terms of Service',
  category: 'Legal',
  status: 'Active',
  content: `YourCompany Technologies Pvt. Ltd.
Effective Date: January 1, 2025 | Last Updated: April 2025

1. Who Can Use Our Services
Our services are available to individuals and businesses that meet the following criteria:
• You are at least 18 years of age (or the age of majority in your jurisdiction)
• You have the legal authority to enter into this agreement
• Your use of YourCompany services is not prohibited by any applicable law or regulation

2. Your Account
When you create an account with us, you are responsible for keeping it secure:
• Use a strong, unique password and don't share it with anyone
• Notify us immediately at security@yourcompany.io if you suspect unauthorized access
• You are responsible for all activity that happens under your account
• Each account is for one person or one company — no account sharing

3. Acceptable Use
The following are strictly prohibited:
• Using our platform for any illegal activity or to violate anyone's rights
• Attempting to scrape, copy, or bulk-extract data from our platform without written permission
• Impersonating any person, company, or entity
• Uploading malware, viruses, or any harmful code
• Attempting to gain unauthorized access to any part of our systems
• Sending spam, phishing messages, or unsolicited bulk communications

4. Your Content & Intellectual Property
• You keep full ownership of all content you create or upload
• By using our services, you grant YourCompany a limited, non-exclusive license to host, store, and display your content
• We will never sell your content to third parties
• Our platform, branding, code, and documentation belong to YourCompany

5. Payments & Billing
• All fees are listed in INR unless stated otherwise, and exclude applicable taxes
• Subscriptions auto-renew unless cancelled at least 24 hours before the renewal date
• Refunds are handled on a case-by-case basis
• We reserve the right to update pricing with 30 days' notice via email

6. Limitation of Liability
• YourCompany is provided "as is" without warranties of any kind
• We are not liable for any indirect, incidental, or consequential damages
• Our total liability to you in any 12-month period shall not exceed the amount you paid us

7. Account Termination
• You may delete your account at any time from your account settings
• We may suspend or terminate your account if you violate these Terms
• Upon termination, your right to access the service ends immediately

8. Governing Law & Disputes
• These Terms are governed by the laws of India
• We encourage you to first contact us at legal@yourcompany.io to resolve matters amicably
• Disputes shall be subject to the exclusive jurisdiction of courts in India

Questions about these terms? legal@yourcompany.io`
};

const CompanyPolicies = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  // Built-in documents
  const builtInDocs = [PRIVACY_POLICY, TERMS_OF_SERVICE];

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/policies');
      const data = res?.data?.data || res?.data || [];
      setPolicies(data);
    } catch (err) {
      console.log('No policies found');
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const allPolicies = [...builtInDocs, ...policies];

  const stats = useMemo(() => ({
    total: allPolicies.length,
    active: allPolicies.filter(p => String(p.status).toLowerCase() === 'active').length,
    draft: allPolicies.filter(p => String(p.status).toLowerCase() === 'draft').length,
  }), [policies]);

  const filteredPolicies = allPolicies.filter((policy) => {
    const query = searchQuery.toLowerCase();
    return [policy.title, policy.status, policy.description, policy.category]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const getStatusStyle = (status) => {
    const s = String(status).toLowerCase();
    if (s === 'active') return 'bg-green-100 text-green-700';
    if (s === 'draft') return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-600';
  };

  const isBuiltIn = (policy) => builtInDocs.some(b => b.title === policy.title);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Company Policies</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and view company policies and legal documents</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 w-56"
            />
          </div>
          <button className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Active</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Draft</p>
          <p className="text-2xl font-semibold text-amber-600 mt-1">{stats.draft}</p>
        </div>
      </div>

      {/* Policy List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-500">Loading policies...</span>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPolicies.map((policy, idx) => (
            <div
              key={policy._id || idx}
              onClick={() => setSelectedPolicy(policy)}
              className="bg-white p-5 rounded-xl border border-gray-100 hover:border-gray-200 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500 shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{policy.title}</h3>
                      {isBuiltIn(policy) && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded">Built-in</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{policy.category || 'General'}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(policy.status)}`}>
                  {policy.status || 'Active'}
                </span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock size={14} />
                  <span>Updated {policy.updatedAt ? new Date(policy.updatedAt).toLocaleDateString('en-IN') : 'Recently'}</span>
                </div>
                <ExternalLink size={14} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Policy Detail Modal */}
      {selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedPolicy(null)} />
          <div className="relative bg-white w-full max-w-2xl max-h-[80vh] rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedPolicy.title}</h2>
                <p className="text-sm text-gray-500">{selectedPolicy.category}</p>
              </div>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
                {selectedPolicy.content || selectedPolicy.description || 'No content available.'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyPolicies;