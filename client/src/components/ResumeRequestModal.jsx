import { useState, useEffect, useRef } from 'react';
import portfolioService from '../services/portfolioService';
import analyticsService from '../services/analyticsService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ResumeRequestModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const firstInputRef = useRef(null);

  // Focus first input on open
  useEffect(() => {
    if (isOpen) {
      setForm({ name: '', email: '', message: '' });
      setErrors({});
      setSubmitting(false);
      setSubmitted(false);
      setSubmitError(null);
      setTimeout(() => firstInputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    else if (form.name.trim().length > 120) errs.name = 'Name must not exceed 120 characters.';

    if (!form.email.trim()) errs.email = 'Email address is required.';
    else if (!EMAIL_REGEX.test(form.email.trim())) errs.email = 'Please enter a valid email address.';

    if (form.message.trim().length > 1000) errs.message = 'Message must not exceed 1000 characters.';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await portfolioService.submitResumeRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        sessionId: analyticsService.getSessionId()
      });

      // ANALYTICS_HOOK: resume_download_request (Phase 27 — NO PII in analytics)
      const requestId = res?.data?._id;
      analyticsService.trackResumeDownloadRequest(requestId);

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={!submitting ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#111827]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 dark:bg-cyan-400/10">
              <svg className="h-5 w-5 text-blue-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <div>
              <h2 id="resume-modal-title" className="text-base font-semibold text-slate-900 dark:text-white">
                Resume Download Request
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Request will be reviewed and you'll be emailed.
              </p>
            </div>
          </div>
          {!submitting && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Close modal"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Success State */}
          {submitted ? (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-400/10">
                <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                Request Submitted!
              </h3>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                Your request has been submitted successfully. You will receive an email at{' '}
                <strong className="text-blue-600 dark:text-cyan-400">{form.email}</strong>{' '}
                after it is reviewed.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
              >
                Close
              </button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} noValidate>
              {submitError && (
                <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {submitError}
                </div>
              )}

              {/* Name */}
              <div className="mb-4">
                <label
                  htmlFor="resume-req-name"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={firstInputRef}
                  id="resume-req-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  disabled={submitting}
                  autoComplete="name"
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 ${
                    errors.name
                      ? 'border-red-400 focus:ring-red-400/30'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/10 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/20'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="mb-4">
                <label
                  htmlFor="resume-req-email"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="resume-req-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  disabled={submitting}
                  autoComplete="email"
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 ${
                    errors.email
                      ? 'border-red-400 focus:ring-red-400/30'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/10 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/20'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Message */}
              <div className="mb-6">
                <label
                  htmlFor="resume-req-message"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Message{' '}
                  <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="resume-req-message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Briefly describe why you'd like the resume (optional)..."
                  disabled={submitting}
                  rows={3}
                  className={`w-full resize-none rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 ${
                    errors.message
                      ? 'border-red-400 focus:ring-red-400/30'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/10 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/20'
                  }`}
                />
                <div className="mt-1 flex items-center justify-between">
                  {errors.message ? (
                    <p className="text-xs text-red-500">{errors.message}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-slate-400">
                    {form.message.length}/1000
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  id="resume-request-submit-btn"
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:opacity-60 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
                >
                  {submitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
                      </svg>
                      Request Download
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResumeRequestModal;
