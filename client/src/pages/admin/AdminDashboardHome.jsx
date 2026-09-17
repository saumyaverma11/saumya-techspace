import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import portfolioService from '../../services/portfolioService';
import { useAuth } from '../../context/AuthContext';

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function AdminDashboardHome() {
  const { admin } = useAuth();

  // Metrics State
  const [metrics, setMetrics] = useState({
    projects: { count: 0, loading: true, error: null },
    skills: { count: 0, loading: true, error: null },
    experience: { count: 0, loading: true, error: null },
    education: { count: 0, loading: true, error: null },
    certifications: { count: 0, loading: true, error: null },
    messages: { count: 0, unreadCount: 0, loading: true, error: null },
    analytics: { count: 0, todayVisits: 0, activeDays: 0, loading: true, error: null },
  });

  // Recent Messages State (3–5 latest)
  const [recentMessages, setRecentMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState(null);

  // Profile Snapshot State
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  // Global Refresh State & Timestamp
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setIsRefreshing(true);

    // 1. Projects
    portfolioService
      .getProjects()
      .then((data) => {
        setMetrics((prev) => ({
          ...prev,
          projects: { count: Array.isArray(data) ? data.length : 0, loading: false, error: null },
        }));
      })
      .catch((err) => {
        setMetrics((prev) => ({
          ...prev,
          projects: { count: 0, loading: false, error: err.message || 'Failed to load' },
        }));
      });

    // 2. Skills
    portfolioService
      .getSkills()
      .then((data) => {
        setMetrics((prev) => ({
          ...prev,
          skills: { count: Array.isArray(data) ? data.length : 0, loading: false, error: null },
        }));
      })
      .catch((err) => {
        setMetrics((prev) => ({
          ...prev,
          skills: { count: 0, loading: false, error: err.message || 'Failed to load' },
        }));
      });

    // 3. Experience
    portfolioService
      .getExperiences()
      .then((data) => {
        setMetrics((prev) => ({
          ...prev,
          experience: { count: Array.isArray(data) ? data.length : 0, loading: false, error: null },
        }));
      })
      .catch((err) => {
        setMetrics((prev) => ({
          ...prev,
          experience: { count: 0, loading: false, error: err.message || 'Failed to load' },
        }));
      });

    // 4. Education
    portfolioService
      .getEducation()
      .then((data) => {
        setMetrics((prev) => ({
          ...prev,
          education: { count: Array.isArray(data) ? data.length : 0, loading: false, error: null },
        }));
      })
      .catch((err) => {
        setMetrics((prev) => ({
          ...prev,
          education: { count: 0, loading: false, error: err.message || 'Failed to load' },
        }));
      });

    // 5. Certifications
    portfolioService
      .getCertifications()
      .then((data) => {
        setMetrics((prev) => ({
          ...prev,
          certifications: { count: Array.isArray(data) ? data.length : 0, loading: false, error: null },
        }));
      })
      .catch((err) => {
        setMetrics((prev) => ({
          ...prev,
          certifications: { count: 0, loading: false, error: err.message || 'Failed to load' },
        }));
      });

    // 6. Messages & Recent Messages
    setMessagesLoading(true);
    portfolioService
      .getMessages()
      .then((data) => {
        const msgs = Array.isArray(data) ? data : [];
        const unread = msgs.filter((m) => !m.isRead && !m.read).length;
        setMetrics((prev) => ({
          ...prev,
          messages: {
            count: msgs.length,
            unreadCount: unread,
            loading: false,
            error: null,
          },
        }));
        // Sort newest first and take top 4
        const sorted = [...msgs].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        setRecentMessages(sorted.slice(0, 4));
        setMessagesLoading(false);
        setMessagesError(null);
      })
      .catch((err) => {
        setMetrics((prev) => ({
          ...prev,
          messages: {
            count: 0,
            unreadCount: 0,
            loading: false,
            error: err.message || 'Protected endpoint error',
          },
        }));
        setMessagesLoading(false);
        setMessagesError(err.message || 'Unable to load recent messages.');
      });

    // 7. Analytics Summary
    portfolioService
      .getAnalytics()
      .then((data) => {
        const totalVisits = typeof data?.totalVisits === 'number' ? data.totalVisits : 0;
        const daily = Array.isArray(data?.dailyVisits) ? data.dailyVisits : [];
        const todayISO = new Date().toISOString().split('T')[0];
        const todayDoc = daily.find((r) => r.date === todayISO);
        const todayVisits = todayDoc ? todayDoc.visits : 0;

        setMetrics((prev) => ({
          ...prev,
          analytics: {
            count: totalVisits,
            todayVisits: todayVisits,
            activeDays: daily.length,
            loading: false,
            error: null,
          },
        }));
      })
      .catch((err) => {
        setMetrics((prev) => ({
          ...prev,
          analytics: {
            count: 0,
            todayVisits: 0,
            activeDays: 0,
            loading: false,
            error: err.message || 'Protected endpoint error',
          },
        }));
      });

    // 8. Profile Snapshot
    setProfileLoading(true);
    portfolioService
      .getProfile()
      .then((data) => {
        setProfile(data);
        setProfileLoading(false);
        setProfileError(null);
      })
      .catch((err) => {
        setProfileLoading(false);
        setProfileError(err.message || 'Unable to load profile.');
      });

    setLastRefreshed(new Date());
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Summary Cards Configuration
  const summaryCards = [
    {
      title: 'Projects',
      metric: metrics.projects,
      link: '/admin/projects',
      color: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-cyan-400',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    },
    {
      title: 'Skills',
      metric: metrics.skills,
      link: '/admin/skills',
      color: 'from-emerald-500/20 to-teal-500/20',
      iconColor: 'text-emerald-400',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
    },
    {
      title: 'Experience',
      metric: metrics.experience,
      link: '/admin/experience',
      color: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-400',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      title: 'Education',
      metric: metrics.education,
      link: '/admin/education',
      color: 'from-purple-500/20 to-indigo-500/20',
      iconColor: 'text-purple-400',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5"
          />
        </svg>
      ),
    },
    {
      title: 'Certifications',
      metric: metrics.certifications,
      link: '/admin/certifications',
      color: 'from-pink-500/20 to-rose-500/20',
      iconColor: 'text-pink-400',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      ),
    },
    {
      title: 'Messages',
      metric: metrics.messages,
      link: '/admin/messages',
      color: 'from-cyan-500/20 to-sky-500/20',
      iconColor: 'text-cyan-400',
      badge:
        metrics.messages.unreadCount > 0
          ? `${metrics.messages.unreadCount} unread`
          : 'All caught up',
      badgeColor:
        metrics.messages.unreadCount > 0
          ? 'border-amber-400/40 bg-amber-400/10 text-amber-400'
          : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      title: 'Analytics',
      metric: metrics.analytics,
      link: '/admin/analytics',
      color: 'from-cyan-500/20 to-teal-500/20',
      iconColor: 'text-teal-400',
      badge:
        metrics.analytics.todayVisits > 0
          ? `${metrics.analytics.todayVisits} today`
          : 'Live Tracking',
      badgeColor: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-400',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];

  // Quick Action Shortcuts
  const quickActions = [
    {
      label: 'Add Project',
      path: '/admin/projects',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      label: 'Add Skill',
      path: '/admin/skills',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      label: 'Add Experience',
      path: '/admin/experience',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      label: 'Add Education',
      path: '/admin/education',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      label: 'Add Certification',
      path: '/admin/certifications',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      label: 'View Messages',
      path: '/admin/messages',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Edit Profile',
      path: '/admin/profile',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      label: 'View Analytics',
      path: '/admin/analytics',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Welcome Banner Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                System Active
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Welcome back, {admin?.username || 'Admin'}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Control center for managing your portfolio content, inquiries, and visitor intelligence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="hidden text-xs text-slate-400 lg:inline-block">
                Last updated:{' '}
                <span className="text-slate-200">
                  {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </span>
            )}

            <button
              type="button"
              onClick={fetchDashboardData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur-md transition hover:border-cyan-400/40 hover:bg-slate-800 hover:text-cyan-300 disabled:opacity-50"
            >
              <svg
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[90px]" />
      </div>

      {/* 2. Portfolio Overview Summary Cards Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Portfolio Overview
          </h2>
          <span className="text-xs text-slate-500">Live Database Metrics</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.title}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-cyan-400/40 hover:shadow-xl hover:shadow-cyan-400/5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br ${card.color} ${card.iconColor}`}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300">{card.title}</h3>
                    <p className="text-xs text-slate-500">Total Entries</p>
                  </div>
                </div>

                {card.badge && (
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                      card.badgeColor || 'border-cyan-400/30 bg-cyan-400/10 text-cyan-400'
                    }`}
                  >
                    {card.badge}
                  </span>
                )}
              </div>

              <div className="mt-6 flex items-baseline justify-between">
                {card.metric.loading ? (
                  <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-800" />
                ) : card.metric.error ? (
                  <div className="text-xs font-medium text-amber-400">{card.metric.error}</div>
                ) : (
                  <span className="text-3xl font-extrabold tracking-tight text-white">
                    {card.metric.count}
                  </span>
                )}

                <Link
                  to={card.link}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition group-hover:text-cyan-400"
                >
                  <span>Manage</span>
                  <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Quick Actions Hub */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.path}
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/60 p-3.5 text-center backdrop-blur-sm transition duration-200 hover:border-cyan-400/40 hover:bg-slate-800/80 hover:text-cyan-300"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-950 text-slate-400 transition group-hover:border-cyan-400/30 group-hover:bg-cyan-400/10 group-hover:text-cyan-300">
                {action.icon}
              </div>
              <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Two-Column Activity & Intelligence Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols): Recent Inquiries */}
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Recent Inquiries</h2>
              <p className="text-xs text-slate-400">
                Direct messages submitted via the public contact section
              </p>
            </div>
            <Link
              to="/admin/messages"
              className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 transition hover:text-cyan-300"
            >
              <span>View All</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="mt-4">
            {messagesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 w-full animate-pulse rounded-2xl bg-slate-950/60" />
                ))}
              </div>
            ) : messagesError ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300">
                {messagesError}
              </div>
            ) : recentMessages.length === 0 ? (
              <div className="py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950 text-slate-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-300">No inquiries yet</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Messages submitted by visitors will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMessages.map((msg) => {
                  const isUnread = !msg.read && !msg.isRead;
                  return (
                    <Link
                      key={msg._id}
                      to="/admin/messages"
                      className={`group block rounded-2xl border p-4 transition duration-200 hover:border-cyan-400/40 hover:bg-slate-800/60 ${
                        isUnread
                          ? 'border-cyan-400/30 bg-cyan-400/5'
                          : 'border-white/5 bg-slate-950/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-xs font-bold text-white">
                              {msg.name || 'Anonymous Visitor'}
                            </span>
                            <span className="text-[11px] text-slate-500">&bull;</span>
                            <span className="truncate text-[11px] text-slate-400">
                              {msg.email}
                            </span>
                            {isUnread && (
                              <span className="rounded-md border border-cyan-400/40 bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                                Unread
                              </span>
                            )}
                          </div>
                          <p className="mt-1 truncate text-xs font-semibold text-slate-200">
                            {msg.subject || '(No Subject)'}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                            {msg.message}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] text-slate-500">
                          {formatShortDate(msg.createdAt)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Analytics Snapshot & Profile Quick Card */}
        <div className="space-y-6">
          {/* Analytics Snapshot Card */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Traffic Snapshot</h2>
                <p className="text-xs text-slate-400">Portfolio visit intelligence</p>
              </div>
              <Link
                to="/admin/analytics"
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
              >
                Details &rarr;
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/60 p-3.5">
                <div>
                  <p className="text-xs text-slate-400">Total All-Time Visits</p>
                  <p className="text-2xl font-extrabold text-white">
                    {metrics.analytics.loading ? '...' : metrics.analytics.count}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3">
                  <p className="text-[11px] text-slate-400">Today's Traffic</p>
                  <p className="mt-0.5 text-lg font-bold text-emerald-400">
                    {metrics.analytics.loading ? '...' : metrics.analytics.todayVisits}
                  </p>
                  <p className="text-[10px] text-slate-500">recorded views</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3">
                  <p className="text-[11px] text-slate-400">Active Days</p>
                  <p className="mt-0.5 text-lg font-bold text-cyan-300">
                    {metrics.analytics.loading ? '...' : metrics.analytics.activeDays}
                  </p>
                  <p className="text-[10px] text-slate-500">recorded days</p>
                </div>
              </div>

              <Link
                to="/admin/analytics"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 py-2.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span>View Full Analytics Chart</span>
              </Link>
            </div>
          </div>

          {/* Profile & Branding Quick Access */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Profile & Identity</h2>
                <p className="text-xs text-slate-400">Public biography and branding</p>
              </div>
              <Link
                to="/admin/profile"
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
              >
                Edit &rarr;
              </Link>
            </div>

            <div className="mt-4">
              {profileLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-10 w-full rounded-xl bg-slate-950/60" />
                  <div className="h-14 w-full rounded-xl bg-slate-950/60" />
                </div>
              ) : profileError ? (
                <div className="text-xs text-amber-400">{profileError}</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {profile?.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile?.name || 'Admin'}
                        className="h-12 w-12 rounded-2xl object-cover border border-cyan-400/30 shadow-md shadow-cyan-500/10"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-base font-bold text-cyan-400">
                        {(profile?.name || 'S')[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">
                        {profile?.name || 'Saumya Verma'}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {profile?.title || 'Software Engineer'}
                      </p>
                      {profile?.location && (
                        <p className="truncate text-[11px] text-cyan-400/80">
                          {profile.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {profile?.bio && (
                    <p className="line-clamp-2 text-xs text-slate-400">
                      {profile.bio}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      to="/admin/profile"
                      className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 py-2 text-center text-xs font-semibold text-slate-200 transition hover:border-cyan-400/30 hover:text-cyan-300"
                    >
                      Edit Profile
                    </Link>
                    <Link
                      to="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-white/10 bg-slate-950/80 p-2 text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300"
                      title="View Live Portfolio"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardHome;
