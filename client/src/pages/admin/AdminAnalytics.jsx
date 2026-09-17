import { useState, useEffect, useMemo } from 'react';
import portfolioService from '../../services/portfolioService';

function formatDate(dateStr) {
  if (!dateStr) return '';
  // dateStr is in YYYY-MM-DD format
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDayOfWeek(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function getYesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

export function AdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Date range filter: '7d' | '30d' | 'all'
  const [dateRange, setDateRange] = useState('30d');
  // Chart style: 'area' | 'bar'
  const [chartType, setChartType] = useState('area');
  // Hovered data point for chart tooltip
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portfolioService.getAnalytics();
      setAnalyticsData(data);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err.message || 'Unable to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    portfolioService
      .getAnalytics()
      .then((data) => {
        if (isMounted) {
          setAnalyticsData(data);
          setLastRefreshed(new Date());
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Unable to load analytics data.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Daily records sorted descending (newest first)
  const dailyRecords = useMemo(() => {
    if (!analyticsData?.dailyVisits || !Array.isArray(analyticsData.dailyVisits)) {
      return [];
    }
    return [...analyticsData.dailyVisits].sort((a, b) => b.date.localeCompare(a.date));
  }, [analyticsData]);

  // Derived real metrics
  const totalVisits = useMemo(() => {
    if (typeof analyticsData?.totalVisits === 'number') {
      return analyticsData.totalVisits;
    }
    return dailyRecords.reduce((acc, curr) => acc + (curr.visits || 0), 0);
  }, [analyticsData, dailyRecords]);

  const todayISO = getTodayISO();
  const yesterdayISO = getYesterdayISO();

  const todayVisits = useMemo(() => {
    const record = dailyRecords.find((r) => r.date === todayISO);
    return record ? record.visits : 0;
  }, [dailyRecords, todayISO]);

  const yesterdayVisits = useMemo(() => {
    const record = dailyRecords.find((r) => r.date === yesterdayISO);
    return record ? record.visits : 0;
  }, [dailyRecords, yesterdayISO]);

  const activeDays = dailyRecords.length;

  const avgDailyVisits = useMemo(() => {
    if (activeDays === 0) return '0';
    return (totalVisits / activeDays).toFixed(1);
  }, [totalVisits, activeDays]);

  const peakDay = useMemo(() => {
    if (dailyRecords.length === 0) return null;
    return dailyRecords.reduce(
      (max, curr) => (curr.visits > (max ? max.visits : 0) ? curr : max),
      dailyRecords[0]
    );
  }, [dailyRecords]);

  // Filtered records for Chart (chronological: earliest to latest)
  const chartRecords = useMemo(() => {
    if (dailyRecords.length === 0) return [];
    // Start with chronological order
    const chronological = [...dailyRecords].sort((a, b) => a.date.localeCompare(b.date));

    if (dateRange === '7d') {
      return chronological.slice(-7);
    }
    if (dateRange === '30d') {
      return chronological.slice(-30);
    }
    return chronological;
  }, [dailyRecords, dateRange]);

  // SVG Chart Geometry Calculations
  const chartGeometry = useMemo(() => {
    if (chartRecords.length === 0) return null;

    const width = 800;
    const height = 260;
    const paddingLeft = 40;
    const paddingRight = 30;
    const paddingTop = 25;
    const paddingBottom = 45;

    const innerWidth = width - paddingLeft - paddingRight;
    const innerHeight = height - paddingTop - paddingBottom;

    const maxVisits = Math.max(...chartRecords.map((r) => r.visits), 5);

    // Compute coordinates
    const points = chartRecords.map((r, index) => {
      const x =
        chartRecords.length === 1
          ? paddingLeft + innerWidth / 2
          : paddingLeft + (index / (chartRecords.length - 1)) * innerWidth;
      const y = paddingTop + innerHeight - (r.visits / maxVisits) * innerHeight;
      return { x, y, record: r };
    });

    // Create SVG path string for line
    let pathD = '';
    if (points.length === 1) {
      pathD = `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y}`;
    } else {
      pathD = points.reduce((acc, pt, i) => {
        return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
      }, '');
    }

    // Create closed area path for gradient fill
    const areaD =
      points.length === 1
        ? `M ${points[0].x - 20} ${height - paddingBottom} L ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y} L ${points[0].x + 20} ${height - paddingBottom} Z`
        : `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

    // Horizontal grid lines (4 levels)
    const gridLines = [0, 0.33, 0.66, 1].map((ratio) => {
      const y = paddingTop + innerHeight - ratio * innerHeight;
      const value = Math.round(ratio * maxVisits);
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
      maxVisits,
      points,
      pathD,
      areaD,
      gridLines,
    };
  }, [chartRecords]);

  return (
    <div className="space-y-8">
      {/* Top Header & Refresh Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Traffic Intelligence
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Track portfolio visits and understand your website activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="hidden text-xs text-slate-400 md:inline-block">
              Last updated:{' '}
              <span className="text-slate-200">
                {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </span>
          )}

          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-200 backdrop-blur-md transition hover:border-cyan-400/40 hover:bg-slate-800 hover:text-cyan-300 disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 ${loading ? 'animate-spin text-cyan-400' : ''}`}
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
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm font-medium text-red-300">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchAnalytics}
            className="self-start rounded-xl border border-red-500/30 bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/30 sm:self-auto"
          >
            Retry Fetch
          </button>
        </div>
      )}

      {/* Summary Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Visits Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-md transition duration-200 hover:border-cyan-400/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Visits
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            {loading && !analyticsData ? (
              <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-800" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  {totalVisits}
                </span>
                <span className="text-xs text-slate-400">views</span>
              </div>
            )}
            <p className="mt-1 text-xs text-slate-500">Cumulative all-time visitors</p>
          </div>
        </div>

        {/* Today's Visits Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-md transition duration-200 hover:border-emerald-400/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Today's Visits
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            {loading && !analyticsData ? (
              <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-800" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  {todayVisits}
                </span>
                <span className="text-xs text-slate-400">views today</span>
              </div>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Recorded for {formatDate(todayISO)}
            </p>
          </div>
        </div>

        {/* Yesterday's Visits Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-md transition duration-200 hover:border-indigo-400/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Yesterday
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-400/10 text-indigo-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            {loading && !analyticsData ? (
              <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-800" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  {yesterdayVisits}
                </span>
                <span className="text-xs text-slate-400">views</span>
              </div>
            )}
            <p className="mt-1 text-xs text-slate-500">
              {yesterdayVisits > 0 ? `Recorded on ${formatDate(yesterdayISO)}` : 'No visits recorded'}
            </p>
          </div>
        </div>

        {/* Daily Average Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-md transition duration-200 hover:border-amber-400/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Daily Average
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            {loading && !analyticsData ? (
              <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-800" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  {avgDailyVisits}
                </span>
                <span className="text-xs text-slate-400">per active day</span>
              </div>
            )}
            <p className="mt-1 text-xs text-slate-500">Across {activeDays} recorded days</p>
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Visit Trends Over Time</h2>
              {peakDay && (
                <span className="hidden rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-400 md:inline-block">
                  Peak: {peakDay.visits} views ({formatDate(peakDay.date)})
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Visual overview of traffic patterns based on recorded visits
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Chart Type Selector */}
            <div className="flex rounded-xl border border-white/10 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => setChartType('area')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  chartType === 'area'
                    ? 'bg-cyan-400/20 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Area
              </button>
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  chartType === 'bar'
                    ? 'bg-cyan-400/20 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Bar
              </button>
            </div>

            {/* Date Range Selector */}
            <div className="flex rounded-xl border border-white/10 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => setDateRange('7d')}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                  dateRange === '7d'
                    ? 'bg-cyan-400/20 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setDateRange('30d')}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                  dateRange === '30d'
                    ? 'bg-cyan-400/20 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => setDateRange('all')}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                  dateRange === 'all'
                    ? 'bg-cyan-400/20 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Time
              </button>
            </div>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="relative mt-6">
          {loading && !analyticsData ? (
            <div className="flex h-64 w-full animate-pulse flex-col items-center justify-center rounded-2xl bg-slate-950/60 text-slate-500">
              <div className="h-6 w-32 rounded bg-slate-800" />
              <p className="mt-3 text-xs text-slate-500">Loading visit trajectory...</p>
            </div>
          ) : chartRecords.length === 0 ? (
            <div className="flex h-64 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-slate-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-300">No visit data yet</h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                Visit data will appear here once visitors browse your public portfolio.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[500px]">
                <svg
                  viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
                  className="w-full h-64 overflow-visible select-none"
                >
                  <defs>
                    <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines & Left Labels */}
                  {chartGeometry.gridLines.map((line, i) => (
                    <g key={i}>
                      <line
                        x1={chartGeometry.paddingLeft}
                        y1={line.y}
                        x2={chartGeometry.width - chartGeometry.paddingRight}
                        y2={line.y}
                        stroke="rgba(255, 255, 255, 0.07)"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={chartGeometry.paddingLeft - 8}
                        y={line.y + 4}
                        fill="#64748b"
                        fontSize="10"
                        textAnchor="end"
                        fontFamily="inherit"
                      >
                        {line.value}
                      </text>
                    </g>
                  ))}

                  {/* Area Chart Mode */}
                  {chartType === 'area' && (
                    <>
                      {/* Area Fill */}
                      <path d={chartGeometry.areaD} fill="url(#analyticsGradient)" />

                      {/* Stroke Line */}
                      <path
                        d={chartGeometry.pathD}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Data Point Dots */}
                      {chartGeometry.points.map((pt, i) => {
                        const isHovered = hoveredPoint?.record.date === pt.record.date;
                        return (
                          <g
                            key={i}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPoint(pt)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          >
                            {/* Hover hit radius */}
                            <circle cx={pt.x} cy={pt.y} r={16} fill="transparent" />
                            {/* Outer glow ring */}
                            {isHovered && (
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={8}
                                fill="#22d3ee"
                                fillOpacity="0.25"
                                className="animate-pulse"
                              />
                            )}
                            {/* Inner dot */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isHovered ? 5 : 3.5}
                              fill={isHovered ? '#67e8f9' : '#0891b2'}
                              stroke="#0f172a"
                              strokeWidth="2"
                              className="transition-all duration-150"
                            />
                          </g>
                        );
                      })}
                    </>
                  )}

                  {/* Bar Chart Mode */}
                  {chartType === 'bar' && (
                    <>
                      {chartGeometry.points.map((pt, i) => {
                        const isHovered = hoveredPoint?.record.date === pt.record.date;
                        const barWidth = Math.min(
                          Math.max(chartGeometry.innerWidth / (chartGeometry.points.length * 1.8), 12),
                          36
                        );
                        const barX = pt.x - barWidth / 2;
                        const barHeight = chartGeometry.height - chartGeometry.paddingBottom - pt.y;

                        return (
                          <g
                            key={i}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPoint(pt)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          >
                            <rect
                              x={barX}
                              y={pt.y}
                              width={barWidth}
                              height={barHeight}
                              rx={4}
                              fill={isHovered ? '#38bdf8' : 'url(#barGradient)'}
                              className="transition-all duration-150"
                            />
                            {isHovered && (
                              <rect
                                x={barX - 2}
                                y={pt.y - 2}
                                width={barWidth + 4}
                                height={barHeight + 4}
                                rx={6}
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="1.5"
                              />
                            )}
                          </g>
                        );
                      })}
                    </>
                  )}

                  {/* Bottom Date Labels */}
                  {chartGeometry.points.map((pt, i) => {
                    // Show labels strategically to avoid overlap if many points
                    const totalPoints = chartGeometry.points.length;
                    const showLabel =
                      totalPoints <= 10 ||
                      i === 0 ||
                      i === totalPoints - 1 ||
                      i % Math.ceil(totalPoints / 7) === 0;

                    if (!showLabel) return null;

                    const dateShort = formatDate(pt.record.date).replace(/, \d{4}/, '');
                    return (
                      <text
                        key={i}
                        x={pt.x}
                        y={chartGeometry.height - chartGeometry.paddingBottom + 20}
                        fill="#94a3b8"
                        fontSize="10"
                        textAnchor="middle"
                        fontFamily="inherit"
                      >
                        {dateShort}
                      </text>
                    );
                  })}
                </svg>

                {/* Interactive Tooltip Overlay */}
                {hoveredPoint && (
                  <div
                    className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl border border-cyan-400/40 bg-slate-950/95 px-3 py-2 text-center shadow-xl shadow-cyan-950/50 backdrop-blur-md"
                    style={{
                      left: `${(hoveredPoint.x / chartGeometry.width) * 100}%`,
                      top: `${(hoveredPoint.y / chartGeometry.height) * 100}%`,
                      marginTop: '-12px',
                    }}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                      {getDayOfWeek(hoveredPoint.record.date)}, {formatDate(hoveredPoint.record.date)}
                    </div>
                    <div className="mt-0.5 text-base font-extrabold text-white">
                      {hoveredPoint.record.visits}{' '}
                      <span className="text-xs font-normal text-slate-400">visits</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daily Visit History Table */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Daily Visit History</h2>
            <p className="text-xs text-slate-400">
              Detailed chronological records of portfolio activity
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {dailyRecords.length} recorded day{dailyRecords.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading && !analyticsData ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 w-full animate-pulse rounded-xl bg-slate-950/60" />
            ))}
          </div>
        ) : dailyRecords.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-slate-400">No daily visit records found.</p>
            <p className="mt-1 text-xs text-slate-500">
              Visitor counts will accumulate automatically as visitors browse.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th scope="col" className="pb-3 pl-3">
                    Date
                  </th>
                  <th scope="col" className="pb-3">
                    Day
                  </th>
                  <th scope="col" className="pb-3">
                    Visits
                  </th>
                  <th scope="col" className="pb-3 pr-3 text-right">
                    Relative Volume
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dailyRecords.map((record) => {
                  const isToday = record.date === todayISO;
                  const isYesterday = record.date === yesterdayISO;
                  const maxVisits = peakDay ? peakDay.visits : 1;
                  const percentOfPeak = Math.round((record.visits / maxVisits) * 100);

                  return (
                    <tr
                      key={record.date}
                      className="group transition hover:bg-slate-800/40"
                    >
                      {/* Date */}
                      <td className="py-3.5 pl-3 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span>{formatDate(record.date)}</span>
                          {isToday && (
                            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                              Today
                            </span>
                          )}
                          {isYesterday && (
                            <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-400">
                              Yesterday
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Day of Week */}
                      <td className="py-3.5 text-xs text-slate-400">
                        {getDayOfWeek(record.date)}
                      </td>

                      {/* Visits Count */}
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-bold text-white">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                          <span>{record.visits}</span>
                          <span className="text-xs font-normal text-slate-400">
                            {record.visits === 1 ? 'visit' : 'visits'}
                          </span>
                        </span>
                      </td>

                      {/* Relative Volume Bar */}
                      <td className="py-3.5 pr-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-500"
                              style={{ width: `${percentOfPeak}%` }}
                            />
                          </div>
                          <span className="w-9 text-xs text-slate-400">
                            {percentOfPeak}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminAnalytics;
