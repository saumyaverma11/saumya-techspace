import { useState, useEffect, useMemo } from 'react';
import portfolioService from '../../services/portfolioService';
import { FileUpload } from '../../components/admin/FileUpload';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_COLORS = {
  pending: {
    bg: 'bg-amber-400/10',
    text: 'text-amber-400',
    border: 'border-amber-400/20',
    label: 'Pending'
  },
  approved: {
    bg: 'bg-emerald-400/10',
    text: 'text-emerald-400',
    border: 'border-emerald-400/20',
    label: 'Approved'
  },
  rejected: {
    bg: 'bg-red-400/10',
    text: 'text-red-400',
    border: 'border-red-400/20',
    label: 'Rejected'
  }
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text} ${s.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.text.replace('text-', 'bg-')}`} />
      {s.label}
    </span>
  );
}

export function AdminResumeRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Toast (declared first so all functions can reference it) ────────────────
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Resume Management state ──────────────────────────────────────────────
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeLoading, setResumeLoading] = useState(true);
  const [resumeSaving, setResumeSaving] = useState(false);

  const fetchProfile = async () => {
    setResumeLoading(true);
    try {
      const data = await portfolioService.getProfile();
      setResumeUrl(data?.resumeUrl || '');
    } catch {
      // silently fail — resume management section will just show empty state
    } finally {
      setResumeLoading(false);
    }
  };

  // Called by FileUpload onChange — immediately saves the returned Cloudinary URL
  const handleResumeChange = async (url) => {
    setResumeUrl(url);
    setResumeSaving(true);
    try {
      await portfolioService.updateProfile({ resumeUrl: url });
      showToast('success', url ? 'Resume uploaded and saved successfully.' : 'Resume removed.');
    } catch (err) {
      showToast('error', err.message || 'Failed to save resume URL to profile.');
    } finally {
      setResumeSaving(false);
    }
  };

  // ── Request filter state ─────────────────────────────────────────────────
  // Filter
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Detail modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'approve'|'reject', request, rejectionNote }
  const [rejectionNote, setRejectionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Toast
  // (state already declared above — showToast already declared above)

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portfolioService.getResumeRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load resume requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchProfile();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === 'pending').length;
    const approved = requests.filter((r) => r.status === 'approved').length;
    const rejected = requests.filter((r) => r.status === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [requests]);

  // Filtered
  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'All' && r.status !== statusFilter.toLowerCase()) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.name?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.message?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requests, statusFilter, searchQuery]);

  const openConfirm = (type, request) => {
    setRejectionNote('');
    setConfirmModal({ type, request });
  };

  const closeConfirm = () => {
    setConfirmModal(null);
    setRejectionNote('');
  };

  const handleApprove = async () => {
    if (!confirmModal) return;
    setActionLoading(true);
    try {
      await portfolioService.approveResumeRequest(confirmModal.request._id);
      showToast('success', `Request from ${confirmModal.request.name} approved. Approval email sent.`);
      await fetchRequests();
      closeConfirm();
      if (detailOpen && selectedRequest?._id === confirmModal.request._id) {
        setDetailOpen(false);
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to approve request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirmModal) return;
    setActionLoading(true);
    try {
      await portfolioService.rejectResumeRequest(
        confirmModal.request._id,
        rejectionNote.trim()
      );
      showToast('success', `Request from ${confirmModal.request.name} rejected.`);
      await fetchRequests();
      closeConfirm();
      if (detailOpen && selectedRequest?._id === confirmModal.request._id) {
        setDetailOpen(false);
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to reject request.');
    } finally {
      setActionLoading(false);
    }
  };

  const openDetail = (request) => {
    setSelectedRequest(request);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Resume Download Requests
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage and review resume download access requests from visitors.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchRequests}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300 disabled:opacity-50"
        >
          <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* ── RESUME MANAGEMENT SECTION ─────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10">
              <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-semibold text-white">Resume Management</h2>
              <p className="text-xs text-slate-400">Upload or replace the public portfolio resume PDF.</p>
            </div>
          </div>
          {resumeUrl && (
            <a
              href="/resume"
              target="_blank"
              rel="noreferrer"
              id="admin-view-resume-public-btn"
              className="flex items-center gap-1.5 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Public Page
            </a>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {resumeLoading ? (
            <div className="flex items-center gap-3 py-4">
              <svg className="h-5 w-5 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-slate-400">Loading resume status...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current status banner */}
              <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                resumeUrl
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-amber-500/20 bg-amber-500/5'
              }`}>
                {resumeUrl ? (
                  <>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
                      <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-emerald-400">Resume Available</p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-400" title={resumeUrl}>
                        {resumeUrl.split('/').pop() || resumeUrl}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Live
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                      <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-amber-400">No Resume Uploaded</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">Upload a PDF to make it available on the public portfolio.</p>
                    </div>
                  </>
                )}
              </div>

              {/* FileUpload component */}
              <div>
                <FileUpload
                  id="admin-resume-upload"
                  label={resumeUrl ? 'Replace Resume PDF' : 'Upload Resume PDF'}
                  type="resume"
                  value={resumeUrl}
                  onChange={handleResumeChange}
                  placeholder="https://res.cloudinary.com/..."
                  helperText="PDF only, max 10 MB. Uploads directly to Cloudinary and updates profile.resumeUrl."
                />
              </div>

              {resumeSaving && (
                <div className="flex items-center gap-2 text-xs text-cyan-400">
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving to profile...
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── DIVIDER ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Resume Download Requests</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 flex items-center gap-3 rounded-xl border px-5 py-3 shadow-xl transition-all ${
            toast.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-cyan-400', bgIcon: 'bg-cyan-400/10' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-400', bgIcon: 'bg-amber-400/10' },
          { label: 'Approved', value: stats.approved, color: 'text-emerald-400', bgIcon: 'bg-emerald-400/10' },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-400', bgIcon: 'bg-red-400/10' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-slate-900/60 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {stat.label}
            </p>
            <p className={`mt-2 text-3xl font-extrabold ${stat.color}`}>
              {loading ? '—' : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/10"
          />
        </div>

        <div className="flex gap-2">
          {['All', 'Pending', 'Approved', 'Rejected'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                statusFilter === f
                  ? 'border border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
                  : 'border border-white/10 bg-slate-900/60 text-slate-400 hover:border-white/20 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="h-8 w-8 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-slate-400">Loading requests...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center">
          <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-red-300">Failed to Load Requests</p>
            <p className="mt-1 text-sm text-slate-400">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchRequests}
            className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/30 p-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10">
            <svg className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          <div>
            <p className="font-semibold text-white">
              {requests.length === 0 ? 'No requests yet' : 'No matching requests'}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {requests.length === 0
                ? 'Resume download requests from visitors will appear here.'
                : 'Try adjusting your search or filter.'}
            </p>
          </div>
        </div>
      )}

      {/* Requests Table */}
      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-slate-900/60">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Visitor
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Requested At
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Message
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((request) => (
                  <tr
                    key={request._id}
                    className="bg-slate-900/30 transition hover:bg-slate-900/60"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{request.name}</div>
                      <div className="mt-0.5 text-xs text-slate-400">{request.email}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {formatDate(request.requestedAt || request.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="max-w-[200px] px-5 py-4 text-xs text-slate-400">
                      {request.message ? (
                        <span className="line-clamp-2">{request.message}</span>
                      ) : (
                        <span className="italic text-slate-600">No message</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {/* View */}
                        <button
                          type="button"
                          onClick={() => openDetail(request)}
                          className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
                        >
                          View
                        </button>

                        {/* Approve */}
                        {(request.status === 'pending' || request.status === 'rejected') && (
                          <button
                            type="button"
                            onClick={() => openConfirm('approve', request)}
                            className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 hover:text-emerald-300"
                          >
                            Approve
                          </button>
                        )}

                        {/* Reject */}
                        {request.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => openConfirm('reject', request)}
                            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="divide-y divide-white/5 lg:hidden">
            {filtered.map((request) => (
              <div
                key={request._id}
                className="bg-slate-900/30 p-5 transition hover:bg-slate-900/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{request.name}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{request.email}</div>
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  {formatDate(request.requestedAt || request.createdAt)}
                </div>

                {request.message && (
                  <p className="mt-2 line-clamp-2 text-xs text-slate-400">
                    {request.message}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openDetail(request)}
                    className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300"
                  >
                    View
                  </button>
                  {(request.status === 'pending' || request.status === 'rejected') && (
                    <button
                      type="button"
                      onClick={() => openConfirm('approve', request)}
                      className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20"
                    >
                      Approve
                    </button>
                  )}
                  {request.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => openConfirm('reject', request)}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setDetailOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="text-base font-semibold text-white">Request Details</h3>
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Name</p>
                  <p className="mt-1 text-sm text-white">{selectedRequest.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</p>
                  <p className="mt-1 break-all text-sm text-cyan-400">{selectedRequest.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={selectedRequest.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Requested</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {formatDate(selectedRequest.requestedAt || selectedRequest.createdAt)}
                  </p>
                </div>
                {selectedRequest.reviewedAt && (
                  <>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reviewed At</p>
                      <p className="mt-1 text-sm text-slate-300">{formatDate(selectedRequest.reviewedAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reviewed By</p>
                      <p className="mt-1 text-sm text-slate-300">{selectedRequest.reviewedBy || '—'}</p>
                    </div>
                  </>
                )}
              </div>

              {selectedRequest.message && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Message</p>
                  <div className="mt-1 rounded-xl border border-white/10 bg-slate-800/60 p-3 text-sm leading-6 text-slate-300">
                    {selectedRequest.message}
                  </div>
                </div>
              )}

              {selectedRequest.rejectionNote && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rejection Note</p>
                  <div className="mt-1 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">
                    {selectedRequest.rejectionNote}
                  </div>
                </div>
              )}

              {selectedRequest.approvalTokenExpire && selectedRequest.status === 'approved' && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                  <p className="text-xs font-semibold text-emerald-400">
                    Download link expires: {formatDate(selectedRequest.approvalTokenExpire)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:border-white/20 hover:text-white"
              >
                Close
              </button>
              {(selectedRequest.status === 'pending' || selectedRequest.status === 'rejected') && (
                <button
                  type="button"
                  onClick={() => { setDetailOpen(false); openConfirm('approve', selectedRequest); }}
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20"
                >
                  Approve
                </button>
              )}
              {selectedRequest.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => { setDetailOpen(false); openConfirm('reject', selectedRequest); }}
                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20"
                >
                  Reject
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal (Approve / Reject) */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={!actionLoading ? closeConfirm : undefined}
          />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    confirmModal.type === 'approve'
                      ? 'bg-emerald-500/10'
                      : 'bg-red-500/10'
                  }`}
                >
                  {confirmModal.type === 'approve' ? (
                    <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </span>
                <h3 className="text-base font-semibold text-white">
                  {confirmModal.type === 'approve' ? 'Approve Request' : 'Reject Request'}
                </h3>
              </div>

              <p className="text-sm text-slate-400">
                {confirmModal.type === 'approve'
                  ? `Approve the resume download request from ${confirmModal.request.name}? A secure download link will be sent to ${confirmModal.request.email}.`
                  : `Reject the request from ${confirmModal.request.name}? They will be notified by email.`}
              </p>

              {/* Rejection note field */}
              {confirmModal.type === 'reject' && (
                <div className="mt-4">
                  <label
                    htmlFor="rejection-note"
                    className="mb-1.5 block text-xs font-medium text-slate-400"
                  >
                    Rejection Note <span className="text-slate-500">(optional)</span>
                  </label>
                  <textarea
                    id="rejection-note"
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    rows={3}
                    placeholder="Briefly explain why the request was not approved (optional)..."
                    disabled={actionLoading}
                    className="w-full resize-none rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-400/40 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={actionLoading}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:border-white/20 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                id={confirmModal.type === 'approve' ? 'confirm-approve-btn' : 'confirm-reject-btn'}
                type="button"
                onClick={confirmModal.type === 'approve' ? handleApprove : handleReject}
                disabled={actionLoading}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                  confirmModal.type === 'approve'
                    ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                }`}
              >
                {actionLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </>
                ) : confirmModal.type === 'approve' ? (
                  'Confirm Approve'
                ) : (
                  'Confirm Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminResumeRequests;
