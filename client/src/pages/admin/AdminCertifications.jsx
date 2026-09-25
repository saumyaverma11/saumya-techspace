import { useState, useEffect, useMemo } from 'react';
import portfolioService from '../../services/portfolioService';
import FileUpload from '../../components/admin/FileUpload';

function formatIssueDateDisplay(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

function isValidUrl(string) {
  if (!string) return true;
  if (string.startsWith('/uploads/')) return true;
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function AdminCertifications() {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Form Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCertification, setEditingCertification] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    issuer: '',
    issueDate: '',
    credentialId: '',
    credentialUrl: '',
    showCredentialUrl: true,
    image: '',
    description: '',
    order: 0,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [certificationToDelete, setCertificationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Feedback Notification
  const [feedback, setFeedback] = useState(null);

  const fetchCertifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portfolioService.getCertifications();
      setCertifications(data || []);
    } catch (err) {
      setError(err.message || 'Unable to load certifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    portfolioService
      .getCertifications()
      .then((data) => {
        if (isMounted) {
          setCertifications(data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Unable to load certifications.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Dismiss toast feedback after 4 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Filtered certifications based on search
  const filteredCertifications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return certifications;

    return certifications.filter((item) => {
      const certName = (item.name || item.title || '').toLowerCase();
      const issuer = (item.issuer || '').toLowerCase();
      const credId = (item.credentialId || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const issueDate = (item.issueDate || '').toLowerCase();

      return (
        certName.includes(q) ||
        issuer.includes(q) ||
        credId.includes(q) ||
        desc.includes(q) ||
        issueDate.includes(q)
      );
    });
  }, [certifications, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCertification(null);
    setFormData({
      name: '',
      issuer: '',
      issueDate: '',
      credentialId: '',
      credentialUrl: '',
      showCredentialUrl: true,
      image: '',
      description: '',
      order:
        certifications.length > 0
          ? Math.max(...certifications.map((c) => (typeof c.displayOrder === 'number' ? c.displayOrder : (typeof c.order === 'number' ? c.order : 0)))) + 1
          : 1,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingCertification(item);
    setFormData({
      name: item.name || item.title || '',
      issuer: item.issuer || '',
      issueDate: item.issueDate || '',
      credentialId: item.credentialId || '',
      credentialUrl: item.credentialUrl || '',
      showCredentialUrl: item.showCredentialUrl !== false,
      image: item.image || '',
      description: item.description || '',
      order: typeof item.displayOrder === 'number' ? item.displayOrder : (typeof item.order === 'number' ? item.order : 0),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Certification name is required.';
    }

    if (!formData.issuer.trim()) {
      errors.issuer = 'Issuing organization is required.';
    }

    if (formData.credentialUrl.trim() && !isValidUrl(formData.credentialUrl.trim())) {
      errors.credentialUrl = 'Please enter a valid URL (starting with http:// or https://).';
    }

    if (formData.image.trim() && !isValidUrl(formData.image.trim())) {
      errors.image = 'Please enter a valid image URL.';
    }

    if (isNaN(Number(formData.order))) {
      errors.order = 'Display order must be a valid number.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Form (Create or Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const orderVal = Number(formData.order) || 0;
      const payload = {
        name: formData.name.trim(),
        issuer: formData.issuer.trim(),
        issueDate: formData.issueDate.trim(),
        credentialId: formData.credentialId.trim(),
        credentialUrl: formData.credentialUrl.trim(),
        showCredentialUrl: Boolean(formData.showCredentialUrl),
        image: formData.image.trim(),
        description: formData.description.trim(),
        order: orderVal,
        displayOrder: orderVal,
      };

      if (editingCertification) {
        const updated = await portfolioService.updateCertification(
          editingCertification._id,
          payload
        );
        setCertifications((prev) =>
          prev.map((item) => (item._id === editingCertification._id ? updated : item))
        );
        setFeedback({
          type: 'success',
          message: `Certification "${updated.name}" updated successfully.`,
        });
      } else {
        const created = await portfolioService.createCertification(payload);
        setCertifications((prev) => [...prev, created]);
        setFeedback({
          type: 'success',
          message: `Certification "${created.name}" created successfully.`,
        });
      }

      setIsModalOpen(false);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to save certification. Please check your connection.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (item) => {
    setCertificationToDelete(item);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!certificationToDelete) return;

    setIsDeleting(true);
    try {
      await portfolioService.deleteCertification(certificationToDelete._id);
      setCertifications((prev) =>
        prev.filter((item) => item._id !== certificationToDelete._id)
      );
      setFeedback({
        type: 'success',
        message: `Certification "${certificationToDelete.name || certificationToDelete.title}" deleted successfully.`,
      });
      setDeleteModalOpen(false);
      setCertificationToDelete(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete certification.',
      });
    } finally {
      setIsDeleting(false);
    }
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Certifications
            </h1>
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-0.5 text-xs font-semibold text-cyan-300">
              {certifications.length} Total
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Manage your industry certifications, credentials, and verification links.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchCertifications}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
            title="Refresh list"
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

          <button
            type="button"
            id="add-certification-btn"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Certification</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/40 p-4 lg:flex-row lg:items-center lg:justify-between">
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
            id="certification-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by certification name, issuer, credential ID, date..."
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

        {searchQuery && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Found {filteredCertifications.length} of {certifications.length}
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="rounded-lg border border-slate-700/50 px-2.5 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>

      {/* Loading Skeleton State */}
      {loading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="animate-pulse rounded-2xl border border-white/10 bg-slate-900/50 p-6"
            >
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-44 rounded bg-slate-800" />
                  <div className="h-4 w-28 rounded bg-slate-800" />
                </div>
                <div className="h-6 w-16 rounded-full bg-slate-800" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3.5 w-full rounded bg-slate-800" />
                <div className="h-3.5 w-3/4 rounded bg-slate-800" />
              </div>
              <div className="mt-5 flex gap-2">
                <div className="h-6 w-20 rounded-full bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-8 text-center">
          <p className="text-sm font-semibold text-red-400">Failed to load certification records</p>
          <p className="mt-1 text-xs text-slate-400">{error}</p>
          <button
            type="button"
            onClick={fetchCertifications}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-white"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredCertifications.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-slate-900/30 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-slate-400">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-base font-semibold text-white">
            {certifications.length === 0 ? 'No certifications yet' : 'No matching certifications found'}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
            {certifications.length === 0
              ? 'Showcase your recognized qualifications by adding your first certification.'
              : 'No certifications match your search query. Try clearing the search.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {certifications.length === 0 ? (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                + Add Certification
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      )}

      {/* Certifications Grid */}
      {!loading && !error && filteredCertifications.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCertifications.map((item) => {
            const certName = item.name || item.title;
            const formattedDate = formatIssueDateDisplay(item.issueDate);

            return (
              <div
                key={item._id}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-6 transition duration-300 hover:border-cyan-400/40 hover:shadow-xl hover:shadow-cyan-400/5"
              >
                <div>
                  {/* Top Row: Title, Issuer, Order Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <h3 className="truncate text-base font-bold text-white group-hover:text-cyan-300">
                          {certName}
                        </h3>
                      </div>

                      <p className="mt-2 font-medium text-cyan-400">
                        {item.issuer}
                      </p>
                    </div>

                    {/* Display Order Badge */}
                    <span
                      title="Display Sort Order"
                      className="rounded-lg border border-white/10 bg-slate-950/80 px-2 py-1 text-[11px] font-mono font-medium text-slate-400"
                    >
                      #{item.displayOrder ?? item.order ?? 0}
                    </span>
                  </div>

                  {/* Metadata Row: Date & Credential ID */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    {formattedDate && (
                      <div className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{formattedDate}</span>
                      </div>
                    )}

                    {item.credentialId && (
                      <div className="flex items-center gap-1">
                        <span className="rounded-md border border-white/10 bg-slate-950/60 px-2 py-0.5 text-[11px] text-slate-300">
                          ID: {item.credentialId}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Certificate Image Thumbnail */}
                  {item.image && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-slate-950">
                      <img
                        src={item.image}
                        alt={certName}
                        className="h-28 w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Description */}
                  {item.description && (
                    <p className="mt-4 line-clamp-4 text-xs leading-relaxed text-slate-300">
                      {item.description}
                    </p>
                  )}

                  {/* Credential Verification Link */}
                  {item.credentialUrl && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <a
                        href={item.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 transition hover:text-cyan-300"
                      >
                        <span>View Credential</span>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                      {item.showCredentialUrl === false && (
                        <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500 dark:text-amber-400">
                          Public Link Hidden
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="mt-6 flex items-center justify-end gap-2 border-t border-white/5 pt-4">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenDelete(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
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
            );
          })}
        </div>
      )}

      {/* Add / Edit Certification Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-5">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingCertification ? 'Edit Certification' : 'Add New Certification'}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {editingCertification
                    ? 'Update the certification details and verification links.'
                    : 'Fill in the information to add a recognized industry credential.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close modal"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="mt-6 space-y-5">
              {/* Name & Issuer Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Certification Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="certification-form-name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: null });
                    }}
                    placeholder="e.g. Java Programming Certification"
                    className={`mt-1.5 w-full rounded-xl border bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                      formErrors.name
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-[11px] text-red-400">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Issuing Organization <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="certification-form-issuer"
                    value={formData.issuer}
                    onChange={(e) => {
                      setFormData({ ...formData, issuer: e.target.value });
                      if (formErrors.issuer) setFormErrors({ ...formErrors, issuer: null });
                    }}
                    placeholder="e.g. HackerRank or Coursera"
                    className={`mt-1.5 w-full rounded-xl border bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                      formErrors.issuer
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                    }`}
                  />
                  {formErrors.issuer && (
                    <p className="mt-1 text-[11px] text-red-400">{formErrors.issuer}</p>
                  )}
                </div>
              </div>

              {/* Issue Date & Credential ID Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Issue Date
                  </label>
                  <input
                    type="text"
                    id="certification-form-date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    placeholder="e.g. 2024-05 or May 2024"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Credential ID
                  </label>
                  <input
                    type="text"
                    id="certification-form-credential-id"
                    value={formData.credentialId}
                    onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                    placeholder="e.g. HR-JAVA-12345"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              {/* Credential URL & Order Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Credential / Verification URL
                  </label>
                  <input
                    type="url"
                    id="certification-form-credential-url"
                    value={formData.credentialUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, credentialUrl: e.target.value });
                      if (formErrors.credentialUrl) setFormErrors({ ...formErrors, credentialUrl: null });
                    }}
                    placeholder="https://example.com/verify/12345"
                    className={`mt-1.5 w-full rounded-xl border bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                      formErrors.credentialUrl
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                    }`}
                  />
                  {formErrors.credentialUrl && (
                    <p className="mt-1 text-[11px] text-red-400">{formErrors.credentialUrl}</p>
                  )}
                  {/* Show Credential Link Checkbox */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="certification-form-show-credential"
                      checked={formData.showCredentialUrl}
                      onChange={(e) => setFormData({ ...formData, showCredentialUrl: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                    />
                    <label
                      htmlFor="certification-form-show-credential"
                      className="text-xs font-medium text-slate-300 cursor-pointer select-none"
                    >
                      Show Credential Link (Display &quot;View Credential&quot; button publicly)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Display Order
                  </label>
                  <input
                    type="number"
                    id="certification-form-order"
                    value={formData.order}
                    onChange={(e) => {
                      setFormData({ ...formData, order: e.target.value });
                      if (formErrors.order) setFormErrors({ ...formErrors, order: null });
                    }}
                    className={`mt-1.5 w-full rounded-xl border bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 ${
                      formErrors.order
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                    }`}
                  />
                  {formErrors.order && (
                    <p className="mt-1 text-[11px] text-red-400">{formErrors.order}</p>
                  )}
                  <p className="mt-1 text-[11px] text-slate-500">Lower numbers appear first.</p>
                </div>
              </div>

              {/* Certificate Image Upload */}
              <div>
                <FileUpload
                  id="certification-form-image"
                  label="Certificate Image / Badge (JPG, PNG, WEBP — max 5MB)"
                  type="certification"
                  value={formData.image}
                  onChange={(val) => {
                    setFormData({ ...formData, image: val });
                    if (formErrors.image) setFormErrors({ ...formErrors, image: null });
                  }}
                  error={formErrors.image}
                  placeholder="https://... or click Upload Image"
                  helperText="Optional uploaded certificate preview image or badge."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Description / Key Skills Covered
                </label>
                <textarea
                  id="certification-form-description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details regarding the skills assessed or curriculum covered..."
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs leading-relaxed text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-certification-btn"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingCertification ? 'Update Certification' : 'Save Certification'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && certificationToDelete && (
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
              <h2 className="text-lg font-bold text-white">Delete Certification</h2>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-300">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-white">
                "{certificationToDelete.name || certificationToDelete.title}"
              </span>{' '}
              issued by{' '}
              <span className="font-semibold text-white">
                "{certificationToDelete.issuer}"
              </span>
              ?
            </p>

            <p className="mt-2 text-xs text-slate-400">
              This action cannot be undone and will permanently remove this certification from both the admin console and public portfolio.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteModalOpen(false);
                  setCertificationToDelete(null);
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
                  <span>Delete Certification</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCertifications;
