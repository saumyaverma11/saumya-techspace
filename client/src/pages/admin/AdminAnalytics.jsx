import { useState, useEffect, useMemo, useCallback } from 'react';
import portfolioService from '../../services/portfolioService';

// ─── Utility Helpers ─────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('T')[0].split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('T')[0].split('-');
  if (parts.length === 3) {
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(2026, month, day);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return dateStr;
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return '';
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AdminAnalytics() {
  // Date Filtering State: 'today' | '7d' | '30d' | 'all' | 'custom'
  const [dateRange, setDateRange] = useState('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [dateError, setDateError] = useState('');

  // Dashboard Data States
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [engagement, setEngagement] = useState(null);
  const [projects, setProjects] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [resumeFunnel, setResumeFunnel] = useState(null);
  const [contactData, setContactData] = useState(null);
  const [trafficData, setTrafficData] = useState(null);

  // Recent Events & Server-side Filter States
  const [eventsList, setEventsList] = useState([]);
  const [eventsPagination, setEventsPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [eventFilters, setEventFilters] = useState({
    eventType: '',
    deviceType: '',
    source: '',
    section: ''
  });

  // UI Control States
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // SVG Chart Series Toggles & Hover State
  const [showVisits, setShowVisits] = useState(true);
  const [showPageViews, setShowPageViews] = useState(true);
  const [showSessions, setShowSessions] = useState(true);
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState(null);

  // ─── Query Parameter Builder ───────────────────────────────────────────────
  const getQueryParams = useCallback(() => {
    if (dateRange === 'custom') {
      return { range: 'custom', from: customFrom, to: customTo };
    }
    return { range: dateRange };
  }, [dateRange, customFrom, customTo]);

  // ─── Fetch All Dashboard Data ──────────────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    const params = getQueryParams();
    setLoading(true);
    setError(null);

    try {
      const [
        summaryRes,
        trendsRes,
        engagementRes,
        projectsRes,
        certsRes,
        resumeRes,
        contactRes,
        trafficRes
      ] = await Promise.all([
        portfolioService.getDashboardSummary(params),
        portfolioService.getActivityTrends(params),
        portfolioService.getEngagementAnalytics(params),
        portfolioService.getProjectAnalytics(params),
        portfolioService.getCertificationAnalytics(params),
        portfolioService.getResumeFunnelAnalytics(params),
        portfolioService.getContactAnalytics(params),
        portfolioService.getTrafficAndDeviceAnalytics(params)
      ]);

      setSummary(summaryRes);
      setTrends(Array.isArray(trendsRes) ? trendsRes : trendsRes?.trends || []);
      setEngagement(engagementRes);
      setProjects(Array.isArray(projectsRes) ? projectsRes : projectsRes?.projects || []);
      setCertifications(Array.isArray(certsRes) ? certsRes : certsRes?.certifications || []);
      setResumeFunnel(resumeRes?.funnel || resumeRes || null);
      setContactData(contactRes);
      setTrafficData(trafficRes);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Unable to load analytics data.');
    } finally {
      setLoading(false);
    }
  }, [getQueryParams]);

  // ─── Fetch Paginated Recent Events ─────────────────────────────────────────
  const fetchRecentEvents = useCallback(async (page = 1) => {
    const params = {
      ...getQueryParams(),
      page,
      limit: eventsPagination.limit,
      ...eventFilters
    };

    setEventsLoading(true);
    try {
      const res = await portfolioService.getRecentEvents(params);
      setEventsList(res?.events || []);
      if (res?.pagination) {
        setEventsPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load recent events:', err);
    } finally {
      setEventsLoading(false);
    }
  }, [getQueryParams, eventsPagination.limit, eventFilters]);

  // Trigger main dashboard load on date range change
  useEffect(() => {
    if (dateRange === 'custom') {
      if (!customFrom || !customTo) return;
      if (customFrom > customTo) return;
    }
    fetchDashboardData();
    fetchRecentEvents(1);
  }, [fetchDashboardData, fetchRecentEvents, dateRange]);

  // Custom Date Range Submission Handler
  const handleApplyCustomRange = (e) => {
    e.preventDefault();
    setDateError('');

    if (!customFrom || !customTo) {
      setDateError('Both start and end dates are required.');
      return;
    }
    if (customFrom > customTo) {
      setDateError('Start date cannot be after end date.');
      return;
    }

    fetchDashboardData();
    fetchRecentEvents(1);
  };

  // Event Filter Change Handler
  const handleFilterChange = (key, value) => {
    setEventFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Trigger events refresh when filters change
  useEffect(() => {
    fetchRecentEvents(1);
  }, [eventFilters]);

  // ─── SVG Chart Geometry Calculation ────────────────────────────────────────
  const chartGeometry = useMemo(() => {
    if (!trends || trends.length === 0) return null;

    const width = 860;
    const height = 280;
    const paddingLeft = 46;
    const paddingRight = 24;
    const paddingTop = 26;
    const paddingBottom = 46;

    const innerWidth = width - paddingLeft - paddingRight;
    const innerHeight = height - paddingTop - paddingBottom;

    // Calculate maximum across all active series (min value 5 for neat scale)
    let maxVal = 5;
    trends.forEach((t) => {
      if (showVisits) maxVal = Math.max(maxVal, t.visits || 0);
      if (showPageViews) maxVal = Math.max(maxVal, t.pageViews || 0);
      if (showSessions) maxVal = Math.max(maxVal, t.uniqueSessions || 0);
    });

    const getX = (index) => {
      if (trends.length === 1) return paddingLeft + innerWidth / 2;
      return paddingLeft + (index / (trends.length - 1)) * innerWidth;
    };

    const getY = (val) => {
      return paddingTop + innerHeight - (val / maxVal) * innerHeight;
    };

    // Calculate coordinates for series
    const visitPoints = trends.map((t, i) => ({ x: getX(i), y: getY(t.visits || 0), value: t.visits || 0, date: t.date }));
    const pageViewPoints = trends.map((t, i) => ({ x: getX(i), y: getY(t.pageViews || 0), value: t.pageViews || 0, date: t.date }));
    const sessionPoints = trends.map((t, i) => ({ x: getX(i), y: getY(t.uniqueSessions || 0), value: t.uniqueSessions || 0, date: t.date }));

    // Path builders
    const buildPath = (points) => {
      if (points.length === 0) return '';
      if (points.length === 1) return `M ${points[0].x - 15} ${points[0].y} L ${points[0].x + 15} ${points[0].y}`;
      return points.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');
    };

    const buildArea = (points) => {
      if (points.length === 0) return '';
      const lineD = buildPath(points);
      const bottomY = height - paddingBottom;
      if (points.length === 1) {
        return `M ${points[0].x - 15} ${bottomY} L ${points[0].x - 15} ${points[0].y} L ${points[0].x + 15} ${points[0].y} L ${points[0].x + 15} ${bottomY} Z`;
      }
      return `${lineD} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
    };

    // Grid lines (4 levels)
    const gridLines = [0, 0.33, 0.66, 1].map((ratio) => {
      const y = paddingTop + innerHeight - ratio * innerHeight;
      const value = Math.round(ratio * maxVal);
      return { y, value };
    });

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      innerWidth,
      innerHeight,
      maxVal,
      gridLines,
      visitPoints,
      pageViewPoints,
      sessionPoints,
      visitPath: buildPath(visitPoints),
      visitArea: buildArea(visitPoints),
      pageViewPath: buildPath(pageViewPoints),
      pageViewArea: buildArea(pageViewPoints),
      sessionPath: buildPath(sessionPoints),
      sessionArea: buildArea(sessionPoints)
    };
  }, [trends, showVisits, showPageViews, showSessions]);

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-900 dark:text-slate-100 animate-fade-in">
      {/* ─── Top Control Bar: Title & Filters ─────────────────────────────── */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50 dark:bg-cyan-400 dark:shadow-cyan-400/50" />
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
              Visitor Intelligence & Telemetry
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Advanced Analytics
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
            Comprehensive visitor behavior, engagement depth, and funnel metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {lastRefreshed && (
            <span className="hidden text-xs text-slate-500 xl:inline-block dark:text-slate-400">
              Updated: <span className="font-medium text-slate-700 dark:text-slate-200">{lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              fetchDashboardData();
              fetchRecentEvents(eventsPagination.page);
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-500/40 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-cyan-400/40 dark:hover:bg-slate-800 dark:hover:text-cyan-300"
            title="Refresh dashboard metrics"
          >
            <svg
              className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600 dark:text-cyan-400' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ─── Date Filter Controls ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backdrop-blur-md transition-colors duration-200 dark:border-white/10 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Period:
            </span>
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom Range' }
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setDateRange(btn.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  dateRange === btn.id
                    ? 'border border-blue-500/50 bg-blue-50 text-blue-700 shadow-sm dark:border-cyan-400/50 dark:bg-cyan-500/20 dark:text-cyan-300 dark:shadow-cyan-500/20'
                    : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-white/5 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Active Range:{' '}
            <span className="font-semibold text-blue-600 dark:text-cyan-300">
              {dateRange === 'today' && 'Today'}
              {dateRange === '7d' && 'Past 7 Days'}
              {dateRange === '30d' && 'Past 30 Days'}
              {dateRange === 'all' && 'All-Time Record'}
              {dateRange === 'custom' && (customFrom && customTo ? `${customFrom} to ${customTo}` : 'Custom Selection')}
            </span>
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {dateRange === 'custom' && (
          <form onSubmit={handleApplyCustomRange} className="mt-2 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3 dark:border-white/10">
            <div className="flex items-center gap-2">
              <label htmlFor="customFrom" className="text-xs text-slate-500 dark:text-slate-400">
                From:
              </label>
              <input
                id="customFrom"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-cyan-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="customTo" className="text-xs text-slate-500 dark:text-slate-400">
                To:
              </label>
              <input
                id="customTo"
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-cyan-400"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg border border-blue-500/40 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-cyan-400/40 dark:bg-cyan-500/20 dark:text-cyan-300 dark:hover:bg-cyan-500/30"
            >
              Apply Filter
            </button>
            {dateError && <span className="text-xs font-medium text-red-500 dark:text-red-400">{dateError}</span>}
          </form>
        )}
      </div>

      {/* ─── Friendly Error Alert ─────────────────────────────────────────── */}
      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 shrink-0 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="self-start rounded-xl border border-red-500/30 bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-500/30 sm:self-auto dark:text-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── Section 1: Summary Metric Cards Grid ──────────────────────────── */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Core Traffic & Activity KPIs
        </h2>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {/* Card: Total Visits */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:border-blue-400/50 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-cyan-400/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Visits
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-600/20 bg-blue-600/10 text-blue-600 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              {loading && !summary ? (
                <div className="h-7 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              ) : (
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {summary?.totalVisits ?? 0}
                </div>
              )}
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Daily visit counter</p>
            </div>
          </div>

          {/* Card: Page Views */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:border-indigo-400/50 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-indigo-400/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Page Views
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-600/20 bg-indigo-600/10 text-indigo-600 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              {loading && !summary ? (
                <div className="h-7 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              ) : (
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {summary?.totalPageViews ?? 0}
                </div>
              )}
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Event-based views</p>
            </div>
          </div>

          {/* Card: Unique Sessions */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:border-emerald-400/50 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-emerald-400/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Unique Sessions
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-600/20 bg-emerald-600/10 text-emerald-600 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              {loading && !summary ? (
                <div className="h-7 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              ) : (
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {summary?.uniqueSessions ?? 0}
                </div>
              )}
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Distinct visitor sessions</p>
            </div>
          </div>

          {/* Card: Total Events */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:border-amber-400/50 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-amber-400/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Events
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-600/20 bg-amber-600/10 text-amber-600 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              {loading && !summary ? (
                <div className="h-7 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              ) : (
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {summary?.totalEvents ?? 0}
                </div>
              )}
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Avg {summary?.avgEventsPerSession ?? 0} / session
              </p>
            </div>
          </div>

          {/* Card: Resume Activity */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:border-sky-400/50 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-sky-400/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Resume Views
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-600/20 bg-sky-600/10 text-sky-600 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              {loading && !summary ? (
                <div className="h-7 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              ) : (
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {summary?.resumeViews ?? 0}
                </div>
              )}
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                {summary?.resumeRequests ?? 0} requests ({summary?.authorizedDownloads ?? 0} actions)
              </p>
            </div>
          </div>
        </div>

        {/* Secondary KPI Bar: Conversions & External Clicks */}
        <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 px-4 shadow-sm dark:border-white/5 dark:bg-slate-900/40">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Contact Starts → Submits</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {summary?.contactStarts ?? 0} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">starts</span> → {summary?.contactSubmissions ?? 0} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">submits</span>
              </div>
            </div>
            <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {summary?.contactConversionRate ?? 0}% conv
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 px-4 shadow-sm dark:border-white/5 dark:bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </div>
              <span className="text-xs text-slate-700 dark:text-slate-300">GitHub Clicks</span>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{summary?.githubClicks ?? 0}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 px-4 shadow-sm dark:border-white/5 dark:bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </div>
              <span className="text-xs text-slate-700 dark:text-slate-300">LinkedIn Clicks</span>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{summary?.linkedinClicks ?? 0}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 px-4 shadow-sm dark:border-white/5 dark:bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs text-slate-700 dark:text-slate-300">Email Clicks</span>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{summary?.emailClicks ?? 0}</span>
          </div>
        </div>
      </div>

      {/* ─── Section 2: Activity Trends Responsive SVG Chart ──────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 dark:backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Activity Trends</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily comparison between visits, page views, and distinct sessions.
            </p>
          </div>

          {/* Interactive Series Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowVisits(!showVisits)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-150 ${
                showVisits
                  ? 'border border-cyan-400/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300'
                  : 'border border-slate-200 bg-slate-100 text-slate-400 line-through dark:border-white/5 dark:bg-slate-800/40 dark:text-slate-500'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Visits
            </button>
            <button
              type="button"
              onClick={() => setShowPageViews(!showPageViews)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-150 ${
                showPageViews
                  ? 'border border-violet-400/40 bg-violet-500/10 text-violet-600 dark:text-violet-300'
                  : 'border border-slate-200 bg-slate-100 text-slate-400 line-through dark:border-white/5 dark:bg-slate-800/40 dark:text-slate-500'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-violet-400" />
              Page Views
            </button>
            <button
              type="button"
              onClick={() => setShowSessions(!showSessions)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-150 ${
                showSessions
                  ? 'border border-emerald-400/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                  : 'border border-slate-200 bg-slate-100 text-slate-400 line-through dark:border-white/5 dark:bg-slate-800/40 dark:text-slate-500'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Unique Sessions
            </button>
          </div>
        </div>

        {/* SVG Chart Render */}
        <div className="mt-4">
          {loading && !chartGeometry ? (
            <div className="flex h-64 w-full animate-pulse items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-500 dark:bg-slate-950/60">
              Loading trends data...
            </div>
          ) : !chartGeometry || trends.length === 0 ? (
            <div className="flex h-64 w-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-400">
              No activity trend records for this date range.
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
                className="w-full min-w-[620px] select-none"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  {/* Cyan Gradient for Visits */}
                  <linearGradient id="cyanAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
                  </linearGradient>
                  {/* Violet Gradient for Page Views */}
                  <linearGradient id="violetAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.0" />
                  </linearGradient>
                  {/* Emerald Gradient for Sessions */}
                  <linearGradient id="emeraldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.20" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines & Y-Axis Labels */}
                {chartGeometry.gridLines.map((line, idx) => (
                  <g key={idx}>
                    <line
                      x1={chartGeometry.paddingLeft}
                      y1={line.y}
                      x2={chartGeometry.width - chartGeometry.paddingRight}
                      y2={line.y}
                      stroke="currentColor"
                      className="text-slate-200 dark:text-white/10"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={chartGeometry.paddingLeft - 10}
                      y={line.y + 4}
                      fill="#64748b"
                      fontSize="10"
                      textAnchor="end"
                    >
                      {line.value}
                    </text>
                  </g>
                ))}

                {/* Area Fills */}
                {showVisits && (
                  <path d={chartGeometry.visitArea} fill="url(#cyanAreaGrad)" />
                )}
                {showPageViews && (
                  <path d={chartGeometry.pageViewArea} fill="url(#violetAreaGrad)" />
                )}
                {showSessions && (
                  <path d={chartGeometry.sessionArea} fill="url(#emeraldAreaGrad)" />
                )}

                {/* Metric Lines */}
                {showVisits && (
                  <path
                    d={chartGeometry.visitPath}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {showPageViews && (
                  <path
                    d={chartGeometry.pageViewPath}
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {showSessions && (
                  <path
                    d={chartGeometry.sessionPath}
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points and Hover Zones */}
                {trends.map((t, idx) => {
                  const ptV = chartGeometry.visitPoints[idx];
                  const ptP = chartGeometry.pageViewPoints[idx];
                  const ptS = chartGeometry.sessionPoints[idx];
                  const isHovered = hoveredTrendIndex === idx;

                  return (
                    <g key={idx}>
                      {/* Vertical indicator line when hovered */}
                      {isHovered && (
                        <line
                          x1={ptV.x}
                          y1={chartGeometry.paddingTop}
                          x2={ptV.x}
                          y2={chartGeometry.height - chartGeometry.paddingBottom}
                          stroke="#94a3b8"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                      )}

                      {/* Circles */}
                      {showVisits && (
                        <circle
                          cx={ptV.x}
                          cy={ptV.y}
                          r={isHovered ? 5 : 3.5}
                          fill="#0f172a"
                          stroke="#22d3ee"
                          strokeWidth="2"
                        />
                      )}
                      {showPageViews && (
                        <circle
                          cx={ptP.x}
                          cy={ptP.y}
                          r={isHovered ? 5 : 3.5}
                          fill="#0f172a"
                          stroke="#a78bfa"
                          strokeWidth="2"
                        />
                      )}
                      {showSessions && (
                        <circle
                          cx={ptS.x}
                          cy={ptS.y}
                          r={isHovered ? 5 : 3.5}
                          fill="#0f172a"
                          stroke="#34d399"
                          strokeWidth="2"
                        />
                      )}

                      {/* X-Axis Date Labels */}
                      <text
                        x={ptV.x}
                        y={chartGeometry.height - chartGeometry.paddingBottom + 20}
                        fill={isHovered ? '#0284c7' : '#64748b'}
                        fontSize="10"
                        textAnchor="middle"
                        fontWeight={isHovered ? 'bold' : 'normal'}
                      >
                        {formatShortDate(t.date)}
                      </text>

                      {/* Transparent Hover Target Zone */}
                      <rect
                        x={ptV.x - 14}
                        y={chartGeometry.paddingTop}
                        width="28"
                        height={chartGeometry.innerHeight}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredTrendIndex(idx)}
                        onMouseLeave={() => setHoveredTrendIndex(null)}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip Overlay */}
              {hoveredTrendIndex !== null && trends[hoveredTrendIndex] && (
                <div className="pointer-events-none mt-2 flex items-center justify-center">
                  <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white/95 px-4 py-2 text-xs shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-950/90">
                    <span className="font-semibold text-slate-800 dark:text-slate-300">
                      {formatDate(trends[hoveredTrendIndex].date)}
                    </span>
                    {showVisits && (
                      <span className="text-cyan-600 dark:text-cyan-400">
                        Visits: <strong>{trends[hoveredTrendIndex].visits || 0}</strong>
                      </span>
                    )}
                    {showPageViews && (
                      <span className="text-violet-600 dark:text-violet-400">
                        Page Views: <strong>{trends[hoveredTrendIndex].pageViews || 0}</strong>
                      </span>
                    )}
                    {showSessions && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Unique Sessions: <strong>{trends[hoveredTrendIndex].uniqueSessions || 0}</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Section 3: Engagement Analytics (Scroll Depth & Section Reach) ─── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Scroll Depth Milestones */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 dark:backdrop-blur-md lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Scroll Depth Milestones</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visitor scroll reach across the page.
              </p>
            </div>
            <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              {engagement?.totalUniqueSessions ?? 0} Sessions
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {(!engagement?.scrollDepth || engagement.scrollDepth.length === 0) ? (
              <p className="py-6 text-center text-xs text-slate-500">
                No scroll milestone events recorded in this period.
              </p>
            ) : (
              engagement.scrollDepth.map((item) => {
                const milestoneVal = item.depth ?? item.milestone ?? 0;
                return (
                  <div key={milestoneVal} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{milestoneVal}% Scroll Depth</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 dark:text-slate-400">{item.count} events</span>
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">{item.reachPercentage}% reach</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, item.reachPercentage))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-500 dark:border-white/5 dark:bg-slate-950/40 dark:text-slate-400">
            * 100% scroll depth indicates the visitor reached the bottom milestone, not that every piece of content was read.
          </p>
        </div>

        {/* Section Views & Reach Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 dark:backdrop-blur-md lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Section Reach & Visibility</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Meaningful viewport exposure per section.
              </p>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Sorted by reach</span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400">
                  <th className="pb-2.5 font-semibold uppercase tracking-wider">Section</th>
                  <th className="pb-2.5 font-semibold uppercase tracking-wider">Total Views</th>
                  <th className="pb-2.5 font-semibold uppercase tracking-wider">Unique Sessions</th>
                  <th className="pb-2.5 font-semibold uppercase tracking-wider text-right">Reach %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {(!engagement?.sectionViews || engagement.sectionViews.length === 0) ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-500">
                      No section view events recorded in this period.
                    </td>
                  </tr>
                ) : (
                  engagement.sectionViews.map((sec) => (
                    <tr key={sec.section} className="transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="py-2.5 font-medium capitalize text-slate-900 dark:text-white">{sec.section}</td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-300">{sec.views}</td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-300">{sec.uniqueSessions}</td>
                      <td className="py-2.5 text-right font-bold text-cyan-600 dark:text-cyan-400">
                        {sec.reachPercentage}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Section 4: Projects & Certifications Analytics ────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Project Interest */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 dark:backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Project Interest</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Views and external click interactions per project.
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400">
                  <th className="pb-2.5 font-semibold uppercase tracking-wider">Project</th>
                  <th className="pb-2.5 font-semibold uppercase tracking-wider text-center">Views</th>
                  <th className="pb-2.5 font-semibold uppercase tracking-wider text-center">GitHub</th>
                  <th className="pb-2.5 font-semibold uppercase tracking-wider text-center">Live Demo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-500">
                      No project events recorded for this date range.
                    </td>
                  </tr>
                ) : (
                  projects.map((proj, idx) => (
                    <tr key={idx} className="transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="py-2.5 font-medium text-slate-900 dark:text-white">{proj.projectTitle || proj.projectId || 'Untitled Project'}</td>
                      <td className="py-2.5 text-center text-slate-600 dark:text-slate-300">{proj.views || 0}</td>
                      <td className="py-2.5 text-center text-slate-600 dark:text-slate-300">{proj.githubClicks || 0}</td>
                      <td className="py-2.5 text-center text-slate-600 dark:text-slate-300">{proj.liveClicks || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            * Sorted by interaction counts for usability. Not presented as a quality ranking.
          </p>
        </div>

        {/* Certification Interest */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 dark:backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Certification Visibility</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Meaningful viewport exposures per credential card.
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400">
                  <th className="pb-2.5 font-semibold uppercase tracking-wider">Certification</th>
                  <th className="pb-2.5 font-semibold uppercase tracking-wider text-center">Views</th>
                  <th className="pb-2.5 font-semibold uppercase tracking-wider text-center">Unique Sessions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {certifications.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-6 text-center text-slate-500">
                      No certification events recorded for this date range.
                    </td>
                  </tr>
                ) : (
                  certifications.map((cert, idx) => (
                    <tr key={idx} className="transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="py-2.5 font-medium text-slate-900 dark:text-white">{cert.certName || cert.certId || 'Credential Item'}</td>
                      <td className="py-2.5 text-center text-slate-600 dark:text-slate-300">{cert.views || 0}</td>
                      <td className="py-2.5 text-center text-slate-600 dark:text-slate-300">{cert.uniqueSessions || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            * certificate_view indicates the certification card became meaningfully visible in viewport, not a credential-link click.
          </p>
        </div>
      </div>

      {/* ─── Section 5: Resume Funnel Visualization ────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 dark:backdrop-blur-md">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Resume Funnel Conversion</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete journey from visitor view to verified download action.
            </p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Selected Period Metrics
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Step 1 */}
          <div className="relative rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10 dark:bg-slate-950/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              Stage 1
            </span>
            <div className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">Resume Views</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
              {resumeFunnel?.resumeViews ?? resumeFunnel?.views ?? 0}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Visitors viewing resume page</p>
          </div>

          {/* Step 2 */}
          <div className="relative rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10 dark:bg-slate-950/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Stage 2
            </span>
            <div className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">Download Requests</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
              {resumeFunnel?.resumeRequests ?? resumeFunnel?.requests ?? 0}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">
              {resumeFunnel?.rates?.requestRate ?? resumeFunnel?.requestRate ?? 0}% conversion from views
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10 dark:bg-slate-950/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Stage 3
            </span>
            <div className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">Admin Approvals</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
              {resumeFunnel?.resumeApprovals ?? resumeFunnel?.approvals ?? 0}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">
              {resumeFunnel?.rates?.approvalRate ?? resumeFunnel?.approvalRate ?? 0}% approval rate
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10 dark:bg-slate-950/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Stage 4
            </span>
            <div className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">Authorized Download Actions</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
              {resumeFunnel?.authorizedDownloads ?? 0}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-300">
              {resumeFunnel?.rates?.downloadRate ?? resumeFunnel?.downloadRate ?? 0}% download completion
            </div>
          </div>
        </div>
        <p className="mt-4 text-[11px] text-slate-500">
          * Authorized Download Actions tracks validated token redemptions. It does not prove the file was successfully saved to the client device.
        </p>
      </div>

      {/* ─── Section 6: Contact & Traffic Demographics ──────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Traffic Sources */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 dark:backdrop-blur-md lg:col-span-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Traffic Sources</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Referral origins and inbound channels.
          </p>

          <div className="mt-4 space-y-3">
            {(!trafficData?.sources || trafficData.sources.length === 0) ? (
              <p className="py-6 text-center text-xs text-slate-500">No source records available.</p>
            ) : (
              trafficData.sources.map((item) => (
                <div key={item.source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium capitalize text-slate-700 dark:text-slate-300">{item.source}</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-cyan-500 dark:bg-cyan-400"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Device Types */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 dark:backdrop-blur-md lg:col-span-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Devices & Platforms</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Client hardware categorization.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {['desktop', 'mobile', 'tablet', 'unknown'].map((dType) => {
              const item = trafficData?.devices?.find((d) => d.deviceType === dType) || {
                deviceType: dType,
                count: 0,
                percentage: 0
              };
              return (
                <div key={dType} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-white/5 dark:bg-slate-950/40">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {dType}
                  </span>
                  <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{item.count}</div>
                  <div className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">{item.percentage}%</div>
                </div>
              );
            })}
          </div>

          {/* Browsers & OS Sub-breakdown */}
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 text-xs dark:border-white/10">
            <div>
              <span className="font-semibold text-slate-500 dark:text-slate-400">Browsers</span>
              <ul className="mt-2 space-y-1 text-slate-700 dark:text-slate-300">
                {trafficData?.browsers?.slice(0, 4).map((b, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{b.browser}</span>
                    <span className="font-medium text-slate-500 dark:text-slate-400">{b.count}</span>
                  </li>
                )) || <li className="text-slate-500">None</li>}
              </ul>
            </div>
            <div>
              <span className="font-semibold text-slate-500 dark:text-slate-400">Operating Systems</span>
              <ul className="mt-2 space-y-1 text-slate-700 dark:text-slate-300">
                {trafficData?.operatingSystems?.slice(0, 4).map((os, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{os.operatingSystem}</span>
                    <span className="font-medium text-slate-500 dark:text-slate-400">{os.count}</span>
                  </li>
                )) || <li className="text-slate-500">None</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Section 7: Recent Events Paginated Log ────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 dark:backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Analytics Events</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Granular event log with server-side filtering. (Strictly zero visitor PII or session IDs)
            </p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Total Logged: <strong className="text-slate-900 dark:text-white">{eventsPagination.total}</strong>
          </span>
        </div>

        {/* Server-side Filter Toolbar */}
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={eventFilters.eventType}
            onChange={(e) => handleFilterChange('eventType', e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition focus:border-cyan-500 focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:focus:border-cyan-400"
          >
            <option value="">All Event Types</option>
            <option value="page_view">page_view</option>
            <option value="section_view">section_view</option>
            <option value="scroll_depth">scroll_depth</option>
            <option value="project_view">project_view</option>
            <option value="project_github_click">project_github_click</option>
            <option value="project_live_click">project_live_click</option>
            <option value="certificate_view">certificate_view</option>
            <option value="resume_view">resume_view</option>
            <option value="resume_download_request">resume_download_request</option>
            <option value="resume_download_approved">resume_download_approved</option>
            <option value="resume_download_completed">resume_download_completed</option>
            <option value="github_click">github_click</option>
            <option value="linkedin_click">linkedin_click</option>
            <option value="email_click">email_click</option>
            <option value="contact_form_start">contact_form_start</option>
            <option value="contact_form_submit">contact_form_submit</option>
          </select>

          <select
            value={eventFilters.deviceType}
            onChange={(e) => handleFilterChange('deviceType', e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition focus:border-cyan-500 focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:focus:border-cyan-400"
          >
            <option value="">All Device Types</option>
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
            <option value="tablet">Tablet</option>
            <option value="unknown">Unknown</option>
          </select>

          <select
            value={eventFilters.source}
            onChange={(e) => handleFilterChange('source', e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition focus:border-cyan-500 focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:focus:border-cyan-400"
          >
            <option value="">All Traffic Sources</option>
            <option value="direct">Direct</option>
            <option value="search">Search</option>
            <option value="social">Social</option>
            <option value="referral">Referral</option>
            <option value="internal">Internal</option>
          </select>

          <select
            value={eventFilters.section}
            onChange={(e) => handleFilterChange('section', e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition focus:border-cyan-500 focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:focus:border-cyan-400"
          >
            <option value="">All Sections</option>
            <option value="hero">Hero</option>
            <option value="about">About</option>
            <option value="skills">Skills</option>
            <option value="projects">Projects</option>
            <option value="experience">Experience</option>
            <option value="education">Education</option>
            <option value="certifications">Certifications</option>
            <option value="contact">Contact</option>
          </select>
        </div>

        {/* Events Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400">
                <th className="pb-2.5 font-semibold uppercase tracking-wider">Event</th>
                <th className="pb-2.5 font-semibold uppercase tracking-wider">Page / Section</th>
                <th className="pb-2.5 font-semibold uppercase tracking-wider">Device</th>
                <th className="pb-2.5 font-semibold uppercase tracking-wider">Browser</th>
                <th className="pb-2.5 font-semibold uppercase tracking-wider">Source</th>
                <th className="pb-2.5 font-semibold uppercase tracking-wider text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {eventsLoading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    Loading recent events...
                  </td>
                </tr>
              ) : eventsList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No recent events match the active filters.
                  </td>
                </tr>
              ) : (
                eventsList.map((e) => (
                  <tr key={e._id} className="transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="py-2.5">
                      <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-cyan-600 dark:text-cyan-300">
                        {e.eventType}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-700 dark:text-slate-300">
                      {e.page || '/'} {e.section && <span className="font-mono text-slate-400 dark:text-slate-500">#{e.section}</span>}
                    </td>
                    <td className="py-2.5 capitalize text-slate-700 dark:text-slate-300">{e.deviceType || 'unknown'}</td>
                    <td className="py-2.5 text-slate-700 dark:text-slate-300">{e.browser || 'Unknown'}</td>
                    <td className="py-2.5 capitalize text-slate-700 dark:text-slate-300">{e.source || 'direct'}</td>
                    <td className="py-2.5 text-right text-slate-500 dark:text-slate-400" title={formatDate(e.timestamp)}>
                      {formatRelativeTime(e.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-xs dark:border-white/10">
          <span className="text-slate-500 dark:text-slate-400">
            Page <strong className="text-slate-900 dark:text-white">{eventsPagination.page}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white">{eventsPagination.pages || 1}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchRecentEvents(eventsPagination.page - 1)}
              disabled={eventsPagination.page <= 1 || eventsLoading}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700 transition hover:border-cyan-500 hover:text-cyan-600 disabled:opacity-40 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-cyan-400/40 dark:hover:text-white"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => fetchRecentEvents(eventsPagination.page + 1)}
              disabled={eventsPagination.page >= eventsPagination.pages || eventsLoading}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700 transition hover:border-cyan-500 hover:text-cyan-600 disabled:opacity-40 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-cyan-400/40 dark:hover:text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;
