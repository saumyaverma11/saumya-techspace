import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import portfolioService from '../../services/portfolioService';
import { useAuth } from '../../context/AuthContext';

export function AdminDashboardHome() {
  const { admin } = useAuth();

  const [metrics, setMetrics] = useState({
    projects: { count: 0, loading: true, error: null },
    skills: { count: 0, loading: true, error: null },
    experience: { count: 0, loading: true, error: null },
    education: { count: 0, loading: true, error: null },
    certifications: { count: 0, loading: true, error: null },
    messages: { count: 0, unreadCount: 0, loading: true, error: null },
  });

  const fetchSummary = async () => {
    // 1. Projects
    portfolioService
      .getProjects()
      .then((data) => {
        setMetrics((prev) => ({
          ...prev,
          projects: { count: data.length, loading: false, error: null },
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
          skills: { count: data.length, loading: false, error: null },
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
          experience: { count: data.length, loading: false, error: null },
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
          education: { count: data.length, loading: false, error: null },
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
          certifications: { count: data.length, loading: false, error: null },
        }));
      })
      .catch((err) => {
        setMetrics((prev) => ({
          ...prev,
          certifications: { count: 0, loading: false, error: err.message || 'Failed to load' },
        }));
      });

    // 6. Messages (Protected)
    portfolioService
      .getMessages()
      .then((data) => {
        const unread = Array.isArray(data)
          ? data.filter((m) => !m.isRead && !m.read).length
          : 0;
        setMetrics((prev) => ({
          ...prev,
          messages: {
            count: Array.isArray(data) ? data.length : 0,
            unreadCount: unread,
            loading: false,
            error: null,
          },
        }));
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
      });
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const cards = [
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
      link: '/admin/dashboard/experience',
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
      link: '/admin/dashboard/education',
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
      link: '/admin/dashboard/certifications',
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
      link: '/admin/dashboard/messages',
      color: 'from-cyan-500/20 to-sky-500/20',
      iconColor: 'text-cyan-400',
      badge:
        metrics.messages.unreadCount > 0 ? `${metrics.messages.unreadCount} unread` : null,
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
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                System Active
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Welcome back, {admin?.username || 'Admin'}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Here is an overview of your portfolio content and communication status.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchSummary}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Ambient glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan-500/10 blur-[90px]" />
      </div>

      {/* Metric Cards Grid */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Portfolio Overview
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-6 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-400/40 hover:shadow-xl hover:shadow-cyan-400/5"
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
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-400">
                    {card.badge}
                  </span>
                )}
              </div>

              <div className="mt-6 flex items-baseline justify-between">
                {card.metric.loading ? (
                  <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-800" />
                ) : card.metric.error ? (
                  <div className="text-xs font-medium text-amber-400">
                    {card.metric.error}
                  </div>
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

      {/* Fast Shortcuts / Status Footer */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
        <h3 className="text-sm font-semibold text-white">Phase 14 Foundation Status</h3>
        <p className="mt-1 text-xs text-slate-400">
          Admin authentication, session guard, and dashboard foundation are operational. Management screens for CRUD modules can be populated in upcoming phases.
        </p>
      </div>
    </div>
  );
}

export default AdminDashboardHome;
