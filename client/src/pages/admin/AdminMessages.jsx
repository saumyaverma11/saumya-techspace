import { useState, useEffect, useMemo } from 'react';
import portfolioService from '../../services/portfolioService';

function formatMessageDate(dateStr) {
  if (!dateStr) return '';
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

export function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Unread' | 'Read'

  // Detail Modal State
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Feedback Notification
  const [feedback, setFeedback] = useState(null);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portfolioService.getMessages();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    portfolioService
      .getMessages()
      .then((data) => {
        if (isMounted) {
          setMessages(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Unable to load messages.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Dismiss feedback banner after 4 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Derived counts
  const unreadCount = useMemo(() => {
    return messages.filter((m) => !m.read && !m.isRead).length;
  }, [messages]);

  const readCount = useMemo(() => {
    return messages.filter((m) => Boolean(m.read || m.isRead)).length;
  }, [messages]);

  // Filtered messages
  const filteredMessages = useMemo(() => {
    return messages.filter((item) => {
      const isUnread = !item.read && !item.isRead;
      const isRead = Boolean(item.read || item.isRead);

      // Status filter
      if (statusFilter === 'Unread' && !isUnread) return false;
      if (statusFilter === 'Read' && !isRead) return false;

      // Search query
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      const name = (item.name || '').toLowerCase();
      const email = (item.email || '').toLowerCase();
      const subject = (item.subject || '').toLowerCase();
      const message = (item.message || '').toLowerCase();

      return (
        name.includes(q) ||
        email.includes(q) ||
        subject.includes(q) ||
        message.includes(q)
      );
    });
  }, [messages, searchQuery, statusFilter]);

  // Mark a message as read
  const handleMarkAsRead = async (id) => {
    setIsUpdatingStatus(true);
    try {
      await portfolioService.markMessageAsRead(id);
      setMessages((prev) =>
        prev.map((m) => (m._id === id ? { ...m, read: true } : m))
      );
      if (selectedMessage && selectedMessage._id === id) {
        setSelectedMessage((prev) => ({ ...prev, read: true }));
      }
      setFeedback({
        type: 'success',
        message: 'Message marked as read.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update message status.',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Open Detail Modal
  const handleOpenDetail = (message) => {
    setSelectedMessage(message);
    // Auto-mark as read when opened if unread
    if (!message.read && !message.isRead) {
      handleMarkAsRead(message._id);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (message, e) => {
    if (e) e.stopPropagation();
    setMessageToDelete(message);
    setDeleteModalOpen(true);
  };

  // Confirm Delete Message
  const handleConfirmDelete = async () => {
    if (!messageToDelete) return;

    setIsDeleting(true);
    try {
      await portfolioService.deleteMessage(messageToDelete._id);
      setMessages((prev) => prev.filter((m) => m._id !== messageToDelete._id));

      if (selectedMessage && selectedMessage._id === messageToDelete._id) {
        setSelectedMessage(null);
      }

      setFeedback({
        type: 'success',
        message: `Message from "${messageToDelete.name}" deleted successfully.`,
      });
      setDeleteModalOpen(false);
      setMessageToDelete(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete message.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
  };

  return (
    <div className="space-y-8">
      {/* Toast Feedback Notification */}
      {feedback && (
        <div
          role="alert"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl backdrop-blur-xl transition-all ${
            feedback.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-200'
              : 'border-red-500/30 bg-red-950/90 text-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <svg className="h-5 w-5 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="text-sm font-medium">{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="ml-2 text-slate-400 hover:text-white"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Messages
            </h1>
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-0.5 text-xs font-semibold text-cyan-300">
              {messages.length} Total
            </span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-0.5 text-xs font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            View, inspect, and reply to client and visitor inquiries submitted through the contact form.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchMessages}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300 disabled:opacity-50"
            title="Refresh messages"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/40 p-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="text"
            id="message-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by sender name, email, subject, or message content..."
            className="w-full rounded-xl border border-white/10 bg-slate-950/80 py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 transition focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* Status Filter Tabs & Reset */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Filter:</span>
          {[
            { label: 'All', count: messages.length },
            { label: 'Unread', count: unreadCount },
            { label: 'Read', count: readCount },
          ].map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setStatusFilter(tab.label)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === tab.label
                  ? 'border border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
                  : 'border border-white/5 bg-slate-950/60 text-slate-400 hover:border-white/10 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  statusFilter === tab.label
                    ? 'bg-cyan-400/20 text-cyan-300'
                    : 'bg-white/5 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}

          {(searchQuery || statusFilter !== 'All') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="ml-2 rounded-lg border border-slate-700/50 px-2.5 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Filter status summary */}
      {(searchQuery || statusFilter !== 'All') && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {filteredMessages.length} of {messages.length} messages
          </span>
        </div>
      )}

      {/* Loading Skeleton State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="animate-pulse rounded-2xl border border-white/10 bg-slate-900/50 p-5 sm:p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-48 rounded bg-slate-800" />
                  <div className="h-4 w-32 rounded bg-slate-800" />
                </div>
                <div className="h-4 w-24 rounded bg-slate-800" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3.5 w-full rounded bg-slate-800" />
                <div className="h-3.5 w-3/4 rounded bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-8 text-center">
          <p className="text-sm font-semibold text-red-400">Failed to load messages</p>
          <p className="mt-1 text-xs text-slate-400">{error}</p>
          <button
            type="button"
            onClick={fetchMessages}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-white"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredMessages.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-slate-900/30 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-slate-400">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-base font-semibold text-white">
            {messages.length === 0 ? 'No messages received yet' : 'No matching messages found'}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
            {messages.length === 0
              ? 'Inquiries submitted through your portfolio contact form will appear here.'
              : 'No messages matched your current search or filter. Try clearing the filter.'}
          </p>
          {messages.length > 0 && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
              >
                Clear Search & Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Messages List */}
      {!loading && !error && filteredMessages.length > 0 && (
        <div className="space-y-4">
          {filteredMessages.map((item) => {
            const isUnread = !item.read && !item.isRead;
            const formattedDate = formatMessageDate(item.createdAt);

            return (
              <div
                key={item._id}
                onClick={() => handleOpenDetail(item)}
                className={`group relative flex flex-col justify-between rounded-2xl border p-5 sm:p-6 transition duration-300 cursor-pointer ${
                  isUnread
                    ? 'border-cyan-400/40 bg-slate-900/80 shadow-lg shadow-cyan-500/5 hover:border-cyan-400'
                    : 'border-white/10 bg-slate-900/40 hover:border-white/20'
                }`}
              >
                <div>
                  {/* Top Row: Sender Name, Email, Status Badge, Date */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`font-semibold text-sm sm:text-base ${
                            isUnread ? 'text-white font-bold' : 'text-slate-300'
                          }`}
                        >
                          {item.name}
                        </span>

                        {isUnread ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Unread
                          </span>
                        ) : (
                          <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-400">
                            Read
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="text-cyan-400">{item.email}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 sm:text-right shrink-0">
                      {formattedDate}
                    </div>
                  </div>

                  {/* Subject Line */}
                  <div className="mt-3">
                    <h3
                      className={`text-sm ${
                        isUnread ? 'font-bold text-slate-100' : 'font-medium text-slate-300'
                      }`}
                    >
                      {item.subject}
                    </h3>
                  </div>

                  {/* Message Preview */}
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">
                    {item.message}
                  </p>
                </div>

                {/* Card Actions Footer */}
                <div
                  className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(item)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
                  >
                    <span>Read full message &rarr;</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(item._id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
                        title="Mark as Read"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Mark Read</span>
                      </button>
                    )}

                    <a
                      href={`mailto:${item.email}?subject=Re: ${encodeURIComponent(item.subject)}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-slate-950/80 px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
                      title="Reply via Email"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                        />
                      </svg>
                      <span>Reply</span>
                    </a>

                    <button
                      type="button"
                      onClick={(e) => handleOpenDelete(item, e)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
                      title="Delete Message"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-white sm:text-xl">
                    {selectedMessage.subject}
                  </h2>
                  {selectedMessage.read || selectedMessage.isRead ? (
                    <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-400">
                      Read
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Unread
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Received on {formatMessageDate(selectedMessage.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close modal"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sender Details */}
            <div className="mt-5 rounded-2xl border border-white/5 bg-slate-950/60 p-4">
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div>
                  <span className="font-medium text-slate-500">From:</span>
                  <p className="mt-0.5 font-semibold text-white">{selectedMessage.name}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-500">Email Address:</span>
                  <p className="mt-0.5 font-semibold text-cyan-400">{selectedMessage.email}</p>
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div className="mt-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Message Body
              </label>
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/80 p-5 text-xs sm:text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
                {selectedMessage.message}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
              <div>
                <button
                  type="button"
                  onClick={(e) => handleOpenDelete(selectedMessage, e)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {!selectedMessage.read && !selectedMessage.isRead && (
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleMarkAsRead(selectedMessage._id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Mark as Read</span>
                  </button>
                )}

                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Reply via Email</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && messageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-red-500/20 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white">Delete Message</h2>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-300">
              Are you sure you want to delete the message from{' '}
              <span className="font-semibold text-white">"{messageToDelete.name}"</span>{' '}
              regarding{' '}
              <span className="font-semibold text-white">"{messageToDelete.subject}"</span>?
            </p>

            <p className="mt-2 text-xs text-slate-400">
              This action cannot be undone and will permanently remove this inquiry from your inbox.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteModalOpen(false);
                  setMessageToDelete(null);
                }}
                className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-delete-btn"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Message</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMessages;
