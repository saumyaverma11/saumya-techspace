import { useState, useEffect, useMemo } from 'react';
import portfolioService from '../../services/portfolioService';

function formatPeriodDisplay(item) {
  if (item.duration) return item.duration;
  if (item.startYear && item.endYear) return `${item.startYear} — ${item.endYear}`;
  if (item.startYear && item.current) return `${item.startYear} — Present`;
  if (item.startYear) return `${item.startYear}`;
  if (item.endYear) return `${item.endYear}`;
  return 'Completed';
}

export function AdminEducation() {
  const [educations, setEducations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Current' | 'Completed'

  // Form Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState(null);
  const [formData, setFormData] = useState({
    degree: '',
    institution: '',
    location: '',
    startYear: '',
    endYear: '',
    current: false,
    description: '',
    grade: '',
    order: 0,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [educationToDelete, setEducationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Feedback Notification
  const [feedback, setFeedback] = useState(null);

  const fetchEducations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portfolioService.getEducation();
      setEducations(data || []);
    } catch (err) {
      setError(err.message || 'Unable to load education records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    portfolioService
      .getEducation()
      .then((data) => {
        if (isMounted) {
          setEducations(data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Unable to load education records.');
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

  // Filtered educations
  const filteredEducations = useMemo(() => {
    return educations.filter((item) => {
      const q = searchQuery.trim().toLowerCase();

      const matchesSearch =
        !q ||
        (item.degree && item.degree.toLowerCase().includes(q)) ||
        (item.institution && item.institution.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.grade && item.grade.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Current' && Boolean(item.current)) ||
        (statusFilter === 'Completed' && !item.current);

      return matchesSearch && matchesStatus;
    });
  }, [educations, searchQuery, statusFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingEducation(null);
    setFormData({
      degree: '',
      institution: '',
      location: '',
      startYear: '',
      endYear: '',
      current: false,
      description: '',
      grade: '',
      order:
        educations.length > 0
          ? Math.max(...educations.map((e) => (typeof e.order === 'number' ? e.order : 0))) + 1
          : 1,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingEducation(item);
    setFormData({
      degree: item.degree || '',
      institution: item.institution || '',
      location: item.location || '',
      startYear: item.startYear || '',
      endYear: item.endYear || '',
      current: Boolean(item.current),
      description: item.description || '',
      grade: item.grade || '',
      order: typeof item.order === 'number' ? item.order : 0,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};

    if (!formData.degree.trim()) {
      errors.degree = 'Degree title is required.';
    }

    if (!formData.institution.trim()) {
      errors.institution = 'Institution name is required.';
    }

    if (!String(formData.startYear).trim()) {
      errors.startYear = 'Start year is required.';
    }

    if (!formData.current && formData.endYear) {
      const startNum = parseInt(formData.startYear, 10);
      const endNum = parseInt(formData.endYear, 10);
      if (!isNaN(startNum) && !isNaN(endNum) && endNum < startNum) {
        errors.endYear = 'End year cannot be earlier than start year.';
      }
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
      const payload = {
        degree: formData.degree.trim(),
        institution: formData.institution.trim(),
        location: formData.location.trim(),
        startYear: String(formData.startYear).trim(),
        endYear: formData.current ? '' : String(formData.endYear).trim(),
        current: Boolean(formData.current),
        description: formData.description.trim(),
        grade: formData.grade.trim(),
        order: Number(formData.order) || 0,
      };

      if (editingEducation) {
        const updated = await portfolioService.updateEducation(editingEducation._id, payload);
        setEducations((prev) =>
          prev.map((item) => (item._id === editingEducation._id ? updated : item))
        );
        setFeedback({
          type: 'success',
          message: `Education "${updated.degree} at ${updated.institution}" updated successfully.`,
        });
      } else {
        const created = await portfolioService.createEducation(payload);
        setEducations((prev) => [...prev, created]);
        setFeedback({
          type: 'success',
          message: `Education "${created.degree} at ${created.institution}" created successfully.`,
        });
      }

      setIsModalOpen(false);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to save education record. Please check your connection.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (item) => {
    setEducationToDelete(item);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!educationToDelete) return;

    setIsDeleting(true);
    try {
      await portfolioService.deleteEducation(educationToDelete._id);
      setEducations((prev) => prev.filter((item) => item._id !== educationToDelete._id));
      setFeedback({
        type: 'success',
        message: `Education "${educationToDelete.degree} at ${educationToDelete.institution}" deleted successfully.`,
      });
      setDeleteModalOpen(false);
      setEducationToDelete(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete education record.',
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Education
            </h1>
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-0.5 text-xs font-semibold text-cyan-300">
              {educations.length} Total
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Manage your degrees, institutions, academic grades, and study history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchEducations}
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
            id="add-education-btn"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Education</span>
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
            id="education-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by degree, institution, location, grade, description..."
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
          <span className="text-xs font-medium text-slate-400">Status:</span>
          {['All', 'Current', 'Completed'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === status
                  ? 'border border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
                  : 'border border-white/5 bg-slate-950/60 text-slate-400 hover:border-white/10 hover:text-white'
              }`}
            >
              {status}
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
            Showing {filteredEducations.length} of {educations.length} education records
          </span>
        </div>
      )}

      {/* Loading Skeleton State */}
      {loading && (
        <div className="grid gap-5 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="animate-pulse rounded-2xl border border-white/10 bg-slate-900/50 p-6"
            >
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-44 rounded bg-slate-800" />
                  <div className="h-4 w-32 rounded bg-slate-800" />
                </div>
                <div className="h-6 w-20 rounded-full bg-slate-800" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3.5 w-full rounded bg-slate-800" />
                <div className="h-3.5 w-4/5 rounded bg-slate-800" />
              </div>
              <div className="mt-5 flex gap-2">
                <div className="h-6 w-20 rounded-full bg-slate-800" />
                <div className="h-6 w-24 rounded-full bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-8 text-center">
          <p className="text-sm font-semibold text-red-400">Failed to load education records</p>
          <p className="mt-1 text-xs text-slate-400">{error}</p>
          <button
            type="button"
            onClick={fetchEducations}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-white"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredEducations.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-slate-900/30 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-slate-400">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-base font-semibold text-white">
            {educations.length === 0 ? 'No education records yet' : 'No matching education records found'}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
            {educations.length === 0
              ? 'Start detailing your academic background by adding your first degree or school.'
              : 'No records matched your search criteria. Try modifying your filters.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {educations.length === 0 ? (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                + Add Education
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Educations Grid */}
      {!loading && !error && filteredEducations.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          {filteredEducations.map((item) => {
            const period = formatPeriodDisplay(item);

            return (
              <div
                key={item._id}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-6 transition duration-300 hover:border-cyan-400/40 hover:shadow-xl hover:shadow-cyan-400/5"
              >
                <div>
                  {/* Top Row: Degree, Institution, Status Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-bold text-white group-hover:text-cyan-300">
                          {item.degree}
                        </h3>
                        {item.current ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Current
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                            Completed
                          </span>
                        )}
                      </div>

                      <p className="mt-1 font-medium text-cyan-400">
                        {item.institution}
                      </p>
                    </div>

                    {/* Display Order Badge */}
                    <span
                      title="Display Sort Order"
                      className="rounded-lg border border-white/10 bg-slate-950/80 px-2 py-1 text-[11px] font-mono font-medium text-slate-400"
                    >
                      #{item.order ?? 0}
                    </span>
                  </div>

                  {/* Metadata Row: Period, Location & Grade */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{period}</span>
                    </div>

                    {item.location && (
                      <div className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{item.location}</span>
                      </div>
                    )}

                    {item.grade && (
                      <div className="flex items-center gap-1">
                        <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[11px] font-medium text-cyan-300">
                          Grade: {item.grade}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="mt-4 line-clamp-4 text-xs leading-relaxed text-slate-300">
                      {item.description}
                    </p>
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

      {/* Add / Edit Education Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-5">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingEducation ? 'Edit Education' : 'Add New Education'}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {editingEducation
                    ? 'Update the academic record details below.'
                    : 'Fill in the information to add an education credential or degree.'}
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
              {/* Degree & Institution Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Degree / Certificate <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="education-form-degree"
                    value={formData.degree}
                    onChange={(e) => {
                      setFormData({ ...formData, degree: e.target.value });
                      if (formErrors.degree) setFormErrors({ ...formErrors, degree: null });
                    }}
                    placeholder="e.g. Master of Computer Applications"
                    className={`mt-1.5 w-full rounded-xl border bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                      formErrors.degree
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                    }`}
                  />
                  {formErrors.degree && (
                    <p className="mt-1 text-[11px] text-red-400">{formErrors.degree}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Institution / University <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="education-form-institution"
                    value={formData.institution}
                    onChange={(e) => {
                      setFormData({ ...formData, institution: e.target.value });
                      if (formErrors.institution) setFormErrors({ ...formErrors, institution: null });
                    }}
                    placeholder="e.g. G.L. Bajaj Institute of Technology & Management"
                    className={`mt-1.5 w-full rounded-xl border bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                      formErrors.institution
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                    }`}
                  />
                  {formErrors.institution && (
                    <p className="mt-1 text-[11px] text-red-400">{formErrors.institution}</p>
                  )}
                </div>
              </div>

              {/* Location & Grade Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Location
                  </label>
                  <input
                    type="text"
                    id="education-form-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Greater Noida, UP, India"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Grade / CGPA
                  </label>
                  <input
                    type="text"
                    id="education-form-grade"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    placeholder="e.g. 9.07 CGPA or 88%"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              {/* Years & Current Toggle Row */}
              <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="education-form-current"
                    checked={formData.current}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((prev) => ({
                        ...prev,
                        current: checked,
                        endYear: checked ? '' : prev.endYear,
                      }));
                      if (checked && formErrors.endYear) {
                        setFormErrors((prev) => ({ ...prev, endYear: null }));
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-950"
                  />
                  <label
                    htmlFor="education-form-current"
                    className="cursor-pointer text-xs font-medium text-slate-200 select-none"
                  >
                    Currently studying here (Current Education)
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Start Year <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="1950"
                      max="2100"
                      id="education-form-start-year"
                      value={formData.startYear}
                      onChange={(e) => {
                        setFormData({ ...formData, startYear: e.target.value });
                        if (formErrors.startYear) setFormErrors({ ...formErrors, startYear: null });
                      }}
                      placeholder="e.g. 2021"
                      className={`mt-1.5 w-full rounded-xl border bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 ${
                        formErrors.startYear
                          ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                          : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                      }`}
                    />
                    {formErrors.startYear && (
                      <p className="mt-1 text-[11px] text-red-400">{formErrors.startYear}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      End Year
                    </label>
                    <input
                      type="number"
                      min="1950"
                      max="2100"
                      id="education-form-end-year"
                      disabled={formData.current}
                      value={formData.current ? '' : formData.endYear}
                      onChange={(e) => {
                        setFormData({ ...formData, endYear: e.target.value });
                        if (formErrors.endYear) setFormErrors({ ...formErrors, endYear: null });
                      }}
                      placeholder="e.g. 2024"
                      className={`mt-1.5 w-full rounded-xl border bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-40 ${
                        formErrors.endYear
                          ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                          : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                      }`}
                    />
                    {formErrors.endYear && (
                      <p className="mt-1 text-[11px] text-red-400">{formErrors.endYear}</p>
                    )}
                    {formData.current && (
                      <p className="mt-1 text-[11px] text-emerald-400">Status set to "Present".</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Row */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Display Order
                </label>
                <input
                  type="number"
                  id="education-form-order"
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

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Description / Highlights
                </label>
                <textarea
                  id="education-form-description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Key achievements, coursework, specializations, or activities..."
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
                  id="save-education-btn"
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
                    <span>{editingEducation ? 'Update Education' : 'Save Education'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && educationToDelete && (
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
              <h2 className="text-lg font-bold text-white">Delete Education</h2>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-300">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-white">
                "{educationToDelete.degree}" at "{educationToDelete.institution}"
              </span>
              ?
            </p>

            <p className="mt-2 text-xs text-slate-400">
              This action cannot be undone and will permanently remove this record from both the admin console and public portfolio.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteModalOpen(false);
                  setEducationToDelete(null);
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
                  <span>Delete Education</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEducation;
