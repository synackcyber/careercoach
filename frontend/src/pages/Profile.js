import React, { useEffect, useState } from 'react';
import { userProfileApi, jobRoleApi } from '../services/api';
import { getAccessToken, onAuthStateChange } from '../supabase/authClient';
import { motion } from 'framer-motion';
import { useJobRoles } from '../hooks/useJobRoles';
import PageTitle from '../components/PageTitle';
import SectionTitle from '../components/SectionTitle';

const experienceOptions = [
  { value: 'entry', label: 'Entry Level', description: '0-2 years experience' },
  { value: 'junior', label: 'Junior', description: '2-4 years experience' },
  { value: 'mid', label: 'Mid-Level', description: '4-7 years experience' },
  { value: 'senior', label: 'Senior', description: '7-10 years experience' },
  { value: 'lead', label: 'Lead', description: '10+ years, team leadership' },
  { value: 'expert', label: 'Expert', description: '15+ years, domain authority' }
];

const industryToRoles = {
  Technology: [
    'Software Engineer', 'Product Manager', 'Data Scientist', 'DevOps Engineer', 'UX Designer', 'QA Engineer', 'Solutions Architect', 'IT Support Specialist'
  ],
  Healthcare: [
    'Registered Nurse', 'Physician Assistant', 'Healthcare Administrator', 'Clinical Research Coordinator', 'Medical Technologist'
  ],
  Finance: [
    'Financial Analyst', 'Accountant', 'Investment Analyst', 'Risk Manager', 'Compliance Analyst'
  ],
  Education: [
    'Teacher', 'Instructional Designer', 'Academic Advisor', 'School Administrator'
  ],
  Manufacturing: [
    'Operations Manager', 'Process Engineer', 'Quality Assurance Manager', 'Supply Chain Analyst'
  ],
  Consulting: [
    'Management Consultant', 'Business Analyst', 'Strategy Consultant', 'Implementation Consultant'
  ],
  'Media': [
    'Content Strategist', 'Digital Marketing Specialist', 'Producer', 'Social Media Manager'
  ],
  'Non-profit': [
    'Program Manager', 'Development Coordinator', 'Grant Writer'
  ],
  Government: [
    'Policy Analyst', 'Program Analyst', 'Contract Specialist'
  ],
  Retail: [
    'Store Manager', 'Merchandiser', 'E-commerce Specialist'
  ],
  Energy: [
    'Energy Analyst', 'Project Engineer', 'Environmental Specialist'
  ],
};

export default function Profile({ sidebarOpen = false }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ 
    id: null, 
    current_role: '', 
    experience_level: 'mid', 
    industry: 'Technology',
    policies_accepted: false,
    it_profile: {
      role: { current: '', level: 'Mid', track: 'IC', target: '' },
      subdomains: [],
      frameworks: [], // [{ name, level }]
      certifications: [], // [{ name, status, expires, planned_by }]
      platforms: [], // [{ name, depth, last_used }]
      evidence: [], // [{ title, link }]
    }
  });
  const [originalProfile, setOriginalProfile] = useState(null);
  const [industryJobRoles, setIndustryJobRoles] = useState([]);
  const [industryJobRolesLoading, setIndustryJobRolesLoading] = useState(false);

  const { jobRoles, loading: allJobRolesLoading } = useJobRoles();

  // Fetch industry-specific job roles when industry changes
  const fetchIndustryJobRoles = async (industry) => {
    if (!industry) {
      setIndustryJobRoles([]);
      return;
    }
    
    try {
      setIndustryJobRolesLoading(true);
      // Start with roles from API filtered by industry signals
      const apiFiltered = jobRoles.filter(role => 
        (role.industry && role.industry === industry) || 
        role.title?.toLowerCase().includes(industry.toLowerCase()) ||
        role.description?.toLowerCase().includes(industry.toLowerCase())
      );

      // Curated roles fallback for top industries
      const curatedTitles = industryToRoles[industry] || [];
      const curatedAsObjects = curatedTitles.map((title) => ({ id: `curated-${title.toLowerCase().replace(/\s+/g, '-')}`, title, description: '' }));

      // Merge and de-duplicate by title (case-insensitive)
      const merged = [...apiFiltered, ...curatedAsObjects];
      const seen = new Set();
      const deduped = merged.filter((r) => {
        const key = (r.title || '').trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setIndustryJobRoles(deduped);
    } catch (err) {
      console.error('Error fetching industry job roles:', err);
      setIndustryJobRoles([]);
    } finally {
      setIndustryJobRolesLoading(false);
    }
  };

  // Fetch industry job roles on initial load if industry is already selected
  useEffect(() => {
    if (profile.industry && jobRoles.length > 0) {
      fetchIndustryJobRoles(profile.industry);
    }
  }, [jobRoles, profile.industry]);

  // Helper function to conditionally apply accent colors
  const getAccentColor = (baseColor, reducedColor = 'gray') => {
    if (sidebarOpen) {
      return reducedColor;
    }
    return baseColor;
  };

  // Check if there are unsaved changes for core required fields
  const hasChanges = () => {
    if (!originalProfile) return false;
    return (
      profile.current_role !== originalProfile.current_role ||
      profile.experience_level !== originalProfile.experience_level
    );
  };

  // Profile completion across core and IT sections (for progress only)
  const progressSegments = [
    { key: 'role', label: 'Role', done: !!profile.current_role },
    { key: 'experience', label: 'Experience', done: !!profile.experience_level },
    { key: 'platforms', label: 'Platforms', done: (profile.it_profile?.platforms || []).length > 0 },
    { key: 'frameworks', label: 'Frameworks', done: (profile.it_profile?.frameworks || []).length > 0 },
    { key: 'subdomains', label: 'Subdomains', done: (profile.it_profile?.subdomains || []).length > 0 },
  ];

  // Only core required fields gate the Save button
  const isProfileComplete = () => {
    return profile.current_role && profile.experience_level;
  };



  // Check if everything is complete (profile + policies)
  const isEverythingComplete = () => {
    return isProfileComplete();
  };

  // Get button text based on current state
  const getButtonText = () => {
    if (saving) return 'Saving...';
    if (!isProfileComplete()) return 'Complete Profile to Continue';
    if (!profile.policies_accepted) return 'Accept Terms & Privacy Policy';
    if (!hasChanges()) return 'Profile Complete ✓';
    if (originalProfile?.id) return 'Update Profile';
    return 'Save Profile';
  };

  // Get button state
  const getButtonState = () => {
    if (saving) return 'saving';
    if (!isProfileComplete()) return 'incomplete';
    if (!hasChanges()) return 'complete';
    return 'hasChanges';
  };

  const fetchWithTimeout = async () => {
    try { console.debug('[profile] fetchWithTimeout start'); } catch (_) {}
    setLoading(true);
    setError('');
    const timeoutMs = 15000;
    try {
      // Force fresh data by adding timestamp to prevent caching
      const timestamp = Date.now();
      const result = await Promise.race([
        userProfileApi.getOrCreate(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
      ]);
      
      // Debug the entire response structure
      try { console.debug('[profile] full API response:', result); } catch (_) {}
      try { console.debug('[profile] response.data:', result?.data); } catch (_) {}
      try { console.debug('[profile] response.data.data:', result?.data?.data); } catch (_) {}
      
      const p = result?.data?.data || {};
      try { console.debug('[profile] profile object:', p); } catch (_) {}
      try { console.debug('[profile] profile ID:', p.id); } catch (_) {}
      try { console.debug('[profile] profile user_id:', p.user_id); } catch (_) {}
      try { console.debug('[profile] terms_accepted_at:', p.terms_accepted_at, 'type:', typeof p.terms_accepted_at); } catch (_) {}
      try { console.debug('[profile] privacy_accepted_at:', p.privacy_accepted_at, 'type:', typeof p.privacy_accepted_at); } catch (_) {}
      
      // Debug the boolean logic step by step
      const hasTerms = !!p.terms_accepted_at;
      const hasPrivacy = !!p.privacy_accepted_at;
      const policiesAccepted = hasTerms && hasPrivacy;
      
      try { console.debug('[profile] boolean logic:', { 
        hasTerms, 
        hasPrivacy, 
        policiesAccepted,
        termsValue: p.terms_accepted_at,
        privacyValue: p.privacy_accepted_at,
        termsType: typeof p.terms_accepted_at,
        privacyType: typeof p.privacy_accepted_at
      }); } catch (_) {}
      
      // Parse IT profile JSON if present
      let itProfile = {
        role: { current: '', level: 'Mid', track: 'IC', target: '' },
        subdomains: [],
        frameworks: [],
        certifications: [],
        platforms: [],
        evidence: [],
      };
      try {
        console.debug('[profile] RAW it_profile from server:', p.it_profile, 'type:', typeof p.it_profile);
        if (p.it_profile) {
          const parsed = typeof p.it_profile === 'string' ? JSON.parse(p.it_profile || '{}') : (p.it_profile || {});
          console.debug('[profile] PARSED it_profile:', parsed);
          itProfile = { ...itProfile, ...parsed };
          console.debug('[profile] MERGED itProfile:', itProfile);
        }
      } catch (e) {
        try { console.warn('[profile] failed to parse it_profile', e); } catch (_) {}
      }

      const profileData = {
        id: p.id,
        current_role: p.current_role || '',
        experience_level: p.experience_level || 'mid',
        industry: p.industry || 'Technology',
        policies_accepted: policiesAccepted,
        it_profile: itProfile,
      };
      try { console.debug('[profile] final profileData.policies_accepted:', profileData.policies_accepted); } catch (_) {}
      try { console.debug('[profile] LOADED it_profile from server:', JSON.stringify(itProfile, null, 2)); } catch (_) {}
      setProfile(profileData);
      setOriginalProfile(profileData); // Store original for change detection
    } catch (e) {
      try { console.error('[profile] fetch error', e); } catch (_) {}
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
      try { console.debug('[profile] loading = false'); } catch (_) {}
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Initial fetch only
    fetchWithTimeout();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSaving(true);
      

      
      if (!profile.current_role || !profile.experience_level) {
        setError('Please complete all required fields');
        return;
      }
      
      await userProfileApi.update(profile.id, {
        current_role: profile.current_role,
        experience_level: profile.experience_level,
        industry: profile.industry,
        it_profile: profile.it_profile,
      });
      
      // Update original profile to reflect saved state
      setOriginalProfile({ ...profile });
      localStorage.removeItem('onboarding_gate');
      
      // Only redirect if this was a new profile completion
      if (!originalProfile?.current_role || !originalProfile?.experience_level) {
        window.location.hash = '#/';
      }
    } catch (e) {
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };
  // --- IT Profile helpers ---
  const itSubdomainOptions = ['Cloud', 'DevOps/SRE', 'Security', 'ITSM', 'Networking', 'Systems', 'Data', 'QA/Automation', 'Platform Eng', 'Endpoint/Collab'];
  const itFrameworkOptions = [
    'SRE', 'DORA', 'AWS Well-Architected', 'Azure Well-Architected', 'GCP Well-Architected',
    'ISO 27001', 'SOC 2', 'NIST CSF', 'CIS Controls', 'CIS Benchmarks', 'Zero Trust', 'ITIL 4', 'ISO/IEC 20000'
  ];
  // Proficiency levels removed per request
  // Curated platform categories with chip-only selection
  const platformCategories = {
    // Cloud and compute
    'Cloud Platforms': ['AWS', 'Azure', 'GCP'],
    'Serverless & Edge Compute': [
      'AWS Lambda', 'Azure Functions', 'Cloud Run', 'Cloud Functions', 'Cloudflare Workers', 'Vercel'
    ],
    // Containers and orchestration
    'Container & Orchestration': [
      'Docker', 'Kubernetes', 'OpenShift', 'Helm', 'Argo CD', 'Kustomize'
    ],
    // Provisioning and configuration
    'IaC & Config Management': [
      'Terraform', 'Pulumi', 'CloudFormation', 'Ansible', 'Chef', 'Puppet', 'Packer'
    ],
    // Release and pipeline automation
    'CI/CD & Release': [
      'GitHub Actions', 'GitLab CI', 'Jenkins', 'CircleCI', 'Tekton', 'Spinnaker', 'Argo Rollouts'
    ],
    // Artifacts and registries
    'Artifact & Registry': [
      'GHCR', 'Docker Hub', 'ECR', 'Artifact Registry', 'GCR', 'Nexus', 'Artifactory'
    ],
    // Observability
    'Observability (Metrics/Tracing)': [
      'Prometheus', 'Grafana', 'OpenTelemetry', 'Jaeger', 'Datadog', 'New Relic'
    ],
    'Logging & SIEM': [
      'Elastic/ELK', 'Splunk', 'Sumo Logic', 'Graylog', 'Microsoft Sentinel'
    ],
    // Incident mgmt
    'Incident & On-call': ['PagerDuty', 'Opsgenie', 'Splunk On-Call'],
    // Identity and secrets
    'Identity & Access (IAM/SSO)': [
      'Okta', 'Entra ID', 'Auth0', 'Keycloak', 'Ping Identity'
    ],
    'Secrets & KMS': [
      'HashiCorp Vault', 'AWS Secrets Manager', 'AWS KMS', 'Azure Key Vault', 'GCP Secret Manager'
    ],
    // Endpoint & device
    'Endpoint & Device Management': [
      'Microsoft Intune', 'Jamf', 'Kandji', 'Workspace ONE'
    ],
    // Security categories
    'Security – EDR/XDR': ['CrowdStrike', 'Microsoft Defender', 'SentinelOne'],
    'Security – CSPM/CNAPP': ['Wiz', 'Prisma Cloud', 'Orca', 'Lacework'],
    'Security – Vuln & Supply Chain': [
      'Nessus', 'Qualys', 'Rapid7', 'Snyk', 'Trivy', 'Grype', 'Dependabot'
    ],
    'Security – SOAR': ['Cortex XSOAR', 'Splunk SOAR', 'Microsoft Sentinel SOAR'],
    // Networking and delivery
    'Networking & Edge/CDN': ['Cloudflare', 'CloudFront', 'Fastly', 'Akamai'],
    'API Gateways & Service Mesh': [
      'Kong', 'Tyk', 'Apigee', 'AWS API Gateway', 'Istio', 'Linkerd', 'App Mesh'
    ],
    // Data systems
    'Databases – Relational': ['PostgreSQL', 'MySQL', 'SQL Server'],
    'Databases – NoSQL/Cache/TS': [
      'MongoDB', 'DynamoDB', 'Redis', 'Cassandra', 'Elasticsearch', 'InfluxDB', 'ClickHouse'
    ],
    'Data Platforms/Warehouse': ['Snowflake', 'BigQuery', 'Redshift', 'Databricks'],
    // Messaging and streaming
    'Messaging & Streaming': [
      'Kafka', 'RabbitMQ', 'NATS', 'SQS', 'SNS', 'Pub/Sub', 'Kinesis'
    ],
    // Protocols and standards
    'Protocols & Standards': [
      'HTTP/HTTPS', 'TLS', 'SSH', 'DNS', 'OAuth 2.0', 'OIDC', 'SAML', 'LDAP', 'Kerberos',
      'gRPC', 'MQTT', 'AMQP', 'WebSockets', 'OpenAPI', 'OPA/Rego'
    ],
  };
  // Jurisdictions removed

  const toggleArrayValue = (arr, value) => {
    const set = new Set(arr || []);
    if (set.has(value)) set.delete(value); else set.add(value);
    return Array.from(set);
  };

  // Removed: per request we no longer capture or present framework proficiency levels

  const toggleFramework = async (name) => {
    const items = profile.it_profile.frameworks || [];
    const idx = items.findIndex((f) => f.name === name);
    if (idx >= 0) items.splice(idx, 1);
    else items.push({ name, level: '' }); // keep level blank
    const next = { ...profile, it_profile: { ...profile.it_profile, frameworks: [...items] } };
    setProfile(next);
    try {
      if (profile?.id) {
        const resp = await userProfileApi.update(profile.id, { it_profile: next.it_profile });
        const server = resp?.data?.data || {};
        let parsed = next.it_profile;
        try {
          const raw = server.it_profile;
          parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || parsed);
        } catch (_) {}
        setProfile((prev) => ({ ...prev, it_profile: parsed }));
        setOriginalProfile((prev) => (prev ? { ...prev, it_profile: parsed } : prev));
      }
    } catch (_) {}
  };

  const toggleSubdomain = async (name) => {
    const subdomains = toggleArrayValue(profile.it_profile.subdomains, name);
    const next = { ...profile, it_profile: { ...profile.it_profile, subdomains } };
    setProfile(next);
    try {
      if (profile?.id) {
        console.debug('[profile] SAVING subdomains:', subdomains, 'for user profile ID:', profile.id);
        const resp = await userProfileApi.update(profile.id, { it_profile: next.it_profile });
        console.debug('[profile] Server response:', resp?.data);
        const server = resp?.data?.data || {};
        let parsed = next.it_profile;
        try {
          const raw = server.it_profile;
          parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || parsed);
          console.debug('[profile] PARSED back from server:', parsed);
        } catch (_) {}
        setProfile((prev) => ({ ...prev, it_profile: parsed }));
        setOriginalProfile((prev) => (prev ? { ...prev, it_profile: parsed } : prev));
      }
    } catch (e) {
      console.error('[profile] Failed to save subdomain:', e);
    }
  };

  // Jurisdictions removed

  const togglePlatform = async (name) => {
    const items = profile.it_profile.platforms || [];
    const idx = items.findIndex((p) => p.name === name);
    if (idx >= 0) items.splice(idx, 1);
    else items.push({ name });
    const next = { ...profile, it_profile: { ...profile.it_profile, platforms: [...items] } };
    setProfile(next);
    try {
      if (profile?.id) {
        const resp = await userProfileApi.update(profile.id, { it_profile: next.it_profile });
        const server = resp?.data?.data || {};
        let parsed = next.it_profile;
        try {
          const raw = server.it_profile;
          parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || parsed);
        } catch (_) {}
        setProfile((prev) => ({ ...prev, it_profile: parsed }));
        setOriginalProfile((prev) => (prev ? { ...prev, it_profile: parsed } : prev));
      }
    } catch (_) {}
  };



  // Industry is fixed to Technology (no selector)





  // --- Debounced save for manual text input only ---
  React.useEffect(() => {
    if (!profile?.id || !profile.current_role) return;
    const timer = setTimeout(async () => {
      try {
        console.debug('[profile] DEBOUNCED SAVE manual role:', profile.current_role, 'with it_profile to preserve selections');
        await userProfileApi.update(profile.id, { 
          current_role: profile.current_role,
          it_profile: profile.it_profile // CRITICAL: preserve IT profile during role saves
        });
      } catch (e) {
        console.error('[profile] Failed to save manual role:', e);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [profile.id, profile.current_role]);

  if (loading) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-accent-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-zinc-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const buttonState = getButtonState();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Clean background with subtle pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/20 via-transparent to-orange-100/20"></div>
      </div>
      {/* Page title aligned with left gutter like Dashboard */}
      <div className="w-full px-6 pt-8 relative z-10 hidden md:block">
        <PageTitle className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">
          Profile
        </PageTitle>
      </div>

      {/* Content container that works with LayoutShell padding */}
      <div className="w-full max-w-4xl mx-auto px-6 py-8 relative z-10">

        {/* Enhanced Progress Indicator */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="mb-12"
        >
          <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl ring-1 ring-amber-200/50 dark:ring-amber-700/30 relative overflow-hidden">
            {/* Subtle animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 via-transparent to-orange-50/50 dark:from-amber-900/20 dark:via-transparent dark:to-orange-900/20"></div>
            <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <SectionTitle className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Profile Completion</SectionTitle>
                <button
                  onClick={() => fetchWithTimeout()}
                  className="p-2 text-accent-600 hover:text-accent-700 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-colors"
                  title="Refresh profile data"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <span className="text-lg font-bold text-accent-600 dark:text-accent-400">
                {progressSegments.filter((s) => s.done).length}/{progressSegments.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-3 overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-accent-500 to-accent-600 h-3 rounded-full shadow-lg"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${(progressSegments.filter((s) => s.done).length / progressSegments.length) * 100}%` 
                }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="mt-3 text-sm text-gray-600 dark:text-zinc-400">
              {isProfileComplete() ? "🎉 Profile complete! You're all set." : "Add a role, experience, and some tools/frameworks to personalize suggestions."}
            </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Error Display */}
        {error && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-red-800 dark:text-red-200 font-medium">{error}</span>
            </div>
            <button 
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Enhanced Profile Form */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-3xl shadow-2xl ring-1 ring-amber-200/50 dark:ring-amber-700/30 overflow-hidden relative"
        >
          {/* Animated border effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-amber-400/20 via-transparent to-orange-400/20 dark:from-amber-500/20 dark:via-transparent dark:to-orange-500/20 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>
          
          {/* Floating accent elements */}
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-400/20 to-orange-500/20 dark:from-amber-500/20 dark:to-orange-600/20 rounded-full blur-xl pointer-events-none z-0"></div>
          <div className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-br from-amber-300/20 to-orange-400/20 dark:from-amber-600/20 dark:to-orange-500/20 rounded-full blur-lg pointer-events-none z-0"></div>
          
          <form className="p-8 space-y-10 relative z-10">
            {/* Industry fixed to Technology - no selector */}
            <div className="bg-white/95 dark:bg-zinc-900/95 rounded-2xl border-2 border-gray-200 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-accent-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                  </svg>
                  <span className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Industry</span>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent-100 dark:bg-accent-900/30 text-accent-800 dark:text-accent-200 border border-accent-200 dark:border-accent-700">Technology</span>
              </div>
            </div>

            {/* Current Role - Enhanced */}
            <div className="space-y-4">
              <label className="block">
                <span className="text-xl font-semibold text-gray-900 dark:text-zinc-100 flex items-center">
                  <svg className="w-6 h-6 text-accent-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
                  </svg>
                  What's your current or desired role?
                  <span className="text-red-500 ml-1">*</span>
                </span>
              </label>

              {/* Role selection - tech industry */}
              {industryJobRolesLoading ? (
                <div className="p-6 border-2 border-gray-200 dark:border-zinc-700 rounded-2xl bg-white dark:bg-zinc-900 text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-gray-600 dark:text-zinc-400">Loading roles for Technology...</p>
                </div>
              ) : industryJobRoles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {industryJobRoles.map((role, index) => (
                    <motion.button
                      key={role.id}
                      type="button"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                      onClick={async () => {
                        const next = { ...profile, current_role: role.title };
                        setProfile(next);
                        try {
                          if (profile?.id) {
                            console.debug('[profile] SAVING role:', role.title, 'with it_profile to preserve selections');
                            await userProfileApi.update(profile.id, { 
                              current_role: role.title,
                              it_profile: profile.it_profile // CRITICAL: preserve IT profile during role saves
                            });
                          }
                        } catch (e) {
                          console.error('[profile] Failed to save role:', e);
                        }
                      }}
                      className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105 hover:shadow-lg ${
                        profile.current_role === role.title
                          ? 'border-accent-500 bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/30 dark:to-accent-800/20 ring-2 ring-accent-200 dark:ring-accent-700/50 shadow-lg'
                          : 'border-gray-200 dark:border-zinc-700 hover:border-accent-300 dark:hover:border-accent-600 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-zinc-800/60 dark:hover:to-zinc-700/60'
                      }`}
                    >
                      <div className="font-semibold text-base text-gray-900 dark:text-zinc-100 mb-1">{role.title}</div>
                      {role.description && (
                        <div className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed line-clamp-2">{role.description}</div>
                      )}
                      {profile.current_role === role.title && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-accent-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="p-6 border-2 border-gray-200 dark:border-zinc-700 rounded-2xl bg-white dark:bg-zinc-900">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                        No specific roles found for {profile.industry}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        You can still enter your role manually below
                      </p>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your role manually"
                    value={profile.current_role}
                    onChange={(e) => setProfile({ ...profile, current_role: e.target.value })}
                    className="w-full mt-3 px-4 py-3 border-2 border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all duration-300 placeholder-gray-400 dark:placeholder-zinc-500"
                  />
                </div>
              )}

              <p className="text-sm text-gray-600 dark:text-zinc-400 ml-9">Showing roles relevant to Technology</p>
            </div>

            {/* Experience Level - Enhanced */}
            <div className="space-y-4">
              <label className="block">
                <span className="text-xl font-semibold text-gray-900 dark:text-zinc-100 flex items-center">
                  <svg className="w-6 h-6 text-accent-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  What's your experience level?
                  <span className="text-red-500 ml-1">*</span>
                </span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {experienceOptions.map((option, index) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                    onClick={async () => {
                      const next = { ...profile, experience_level: option.value };
                      setProfile(next);
                                              try {
                          if (profile?.id) {
                            console.debug('[profile] SAVING experience_level:', option.value, 'with it_profile to preserve selections');
                            await userProfileApi.update(profile.id, { 
                              experience_level: option.value,
                              it_profile: profile.it_profile // CRITICAL: preserve IT profile during experience saves
                            });
                          }
                        } catch (e) {
                          console.error('[profile] Failed to save experience_level:', e);
                        }
                    }}
                    className={`group p-6 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-105 hover:shadow-lg ${
                      profile.experience_level === option.value
                        ? 'border-accent-500 bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/30 dark:to-accent-800/20 ring-4 ring-accent-200 dark:ring-accent-700/50 shadow-lg'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-accent-300 dark:hover:border-accent-600 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-zinc-800/60 dark:hover:to-zinc-700/60'
                    }`}
                  >
                    <div className="font-semibold text-lg text-gray-900 dark:text-zinc-100 mb-2">{option.label}</div>
                    <div className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">{option.description}</div>
                    {profile.experience_level === option.value && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Terms & Privacy Status */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-6 h-6 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-zinc-100 leading-tight">
                      Terms & Privacy Policy
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1 leading-relaxed">
                      Legal agreements must be accepted before completing your profile
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 sm:ml-auto">
                  {profile.policies_accepted ? (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">Accepted</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Required</span>
                    </div>
                  )}
                </div>
              </div>
              
              {!profile.policies_accepted && (
                <div className="ml-0 sm:ml-10 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
                        Please accept the Terms of Service and Privacy Policy in{' '}
                        <a href="#/account" className="text-amber-900 dark:text-amber-100 underline font-medium hover:text-amber-700 dark:hover:text-amber-300 transition-colors">
                          Account Settings
                        </a>{' '}
                        before completing your profile.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* IT Profile (optional) */}
            <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-zinc-800">
              <SectionTitle className="text-lg font-semibold text-gray-900 dark:text-zinc-100">IT Profile (optional)</SectionTitle>

              {/* Subdomains */}
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Subdomains</div>
                <div className="flex flex-wrap gap-2">
                  {itSubdomainOptions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSubdomain(s)}
                      className={`px-3 py-1.5 rounded-full text-sm border ${profile.it_profile.subdomains?.includes(s) ? 'bg-accent-100 dark:bg-accent-900/30 border-accent-300 dark:border-accent-700 text-accent-800 dark:text-accent-200' : 'bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300'}`}
                    >{s}</button>
                  ))}
                </div>
              </div>

              {/* Frameworks */}
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Frameworks & Standards</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {itFrameworkOptions.map((f) => {
                    const selected = (profile.it_profile.frameworks || []).find((x) => x.name === f);
                    return (
                      <div key={f} className={`flex items-center justify-between p-3 rounded-xl border ${selected ? 'border-accent-300 dark:border-accent-700 bg-accent-50/40 dark:bg-accent-900/20' : 'border-gray-200 dark:border-zinc-700'}`}>
                        <button type="button" role="button" aria-pressed={!!selected} onClick={() => toggleFramework(f)} className="text-left font-medium text-gray-800 dark:text-zinc-100">{f}</button>
                        {/* Level selection removed */}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Platforms - organized by categories, chip-only selection */}
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Platforms & Tools</div>
                <div className="space-y-4">
                  {Object.entries(platformCategories).map(([category, items]) => (
                    <div key={category}>
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400 mb-2">{category}</div>
                      <div className="flex flex-wrap gap-2">
                        {items.map((pName) => (
                          <button
                            key={pName}
                            type="button"
                            onClick={() => togglePlatform(pName)}
                            className={`px-3 py-1.5 rounded-full text-sm border ${profile.it_profile.platforms?.find((p)=>p.name===pName) ? 'bg-accent-100 dark:bg-accent-900/30 border-accent-300 dark:border-accent-700 text-accent-800 dark:text-accent-200' : 'bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300'}`}
                          >{pName}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Jurisdictions removed per request */}
            </div>

            {/* Done Button (navigation only) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="pt-6 relative"
            >
              {/* Button background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-500/20 dark:from-amber-500/20 dark:to-orange-600/20 rounded-2xl blur-xl transform scale-105"></div>
              
              <button
                type="button"
                onClick={() => { window.location.hash = '#/'; }}
                className={`relative w-full py-4 px-8 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 focus:ring-4 focus:ring-offset-0 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl focus:ring-amber-500/30`}
              >
                Done
              </button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
