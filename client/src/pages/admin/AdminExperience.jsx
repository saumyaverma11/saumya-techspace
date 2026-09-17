import { useState, useEffect, useMemo } from 'react';
import portfolioService from '../../services/portfolioService';

function toDateInputValue(dateStr) {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

function formatPeriodDisplay(item) {
  if (item.duration) return item.duration;

  const formatDate = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const start = formatDate(item.startDate);
  const end = item.current
    ? 'Present'
    : item.endDate
    ? formatDate(item.endDate)
    : '';

  if (start && end) return `${start} — ${end}`;
  if (start && !end) return `${start} — Present`;
  if (!start && end) return end;
  return 'Present';
}

export function AdminExperience() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Current' | 'Previous'

  // Form Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState(null);
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
    technologies: [],
    order: 0,
  });
  const [techInput, setTechInput] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [experienceToDelete, setExperienceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // User Notification Feedback
  const [feedback, setFeedback] = useState(null);

  const fetchExperiences = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portfolioService.getExperiences();
      setExperiences(data || []);
    } catch (err) {
      setError(err.message || 'Unable to load experience records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    portfolioService
      .getExperiences()
      .then((data) => {
        if (isMounted) {
          setExperiences(data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Unable to load experience records.');
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

  // Filtered experiences
  const filteredExperiences = useMemo(() => {
    return experiences.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const techList = Array.isArray(item.technologies)
        ? item.technologies
        : typeof item.technologies === 'string' && item.technologies
        ? item.technologies.split(',').map((t) => t.trim())
        : [];

      const matchesSearch =
        !q ||
        (item.company && item.company.toLowerCase().includes(q)) ||
        (item.position && item.position.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        techList.some((t) => t.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Current' && Boolean(item.current)) ||
        (statusFilter === 'Previous' && !item.current);

      return matchesSearch && matchesStatus;
    });
  }, [experiences, searchQuery, statusFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingExperience(null);
    setFormData({
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      technologies: [],
      order:
        experiences.length > 0
          ? Math.max(...experiences.map((e) => (typeof e.order === 'number' ? e.order : 0))) + 1
          : 1,
    });
    setTechInput('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingExperience(item);
    const techArray = Array.isArray(item.technologies)
      ? item.technologies
      : typeof item.technologies === 'string' && item.technologies
      ? item.technologies.split(',').map((t) => t.trim())
      : [];

    setFormData({
      company: item.company || '',
      position: item.position || '',
      location: item.location || '',
      startDate: toDateInputValue(item.startDate),
      endDate: toDateInputValue(item.endDate),
      current: Boolean(item.current),
      description: item.description || '',
      technologies: techArray,
      order: typeof item.order === 'number' ? item.order : 0,
    });
    setTechInput('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Tag Management
  const handleAddTech = () => {
    const trimmed = techInput.trim();
    if (!trimmed) return;
    if (!formData.technologies.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        technologies: [...prev.technologies, trimmed],
      }));
    }
    setTechInput('');
  };

  const handleRemoveTech = (techToRemove) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t !== techToRemove),
    }));
  };

  const handleTechKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTech();
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};

    if (!formData.company.trim()) {
      errors.company = 'Company name is required.';
    }

    if (!formData.position.trim()) {
      errors.position = 'Position title is required.';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required.';
    }

    if (!formData.current) {
      if (!formData.endDate) {
        errors.endDate = 'End date is required for previous positions.';
      } else if (formData.startDate && new Date(formData.startDate) > new Date(formData.endDate)) {
        errors.endDate = 'End date cannot be earlier than start date.';
      }
    }

    if (!formData.description.trim()) {
      errors.description = 'Role description is required.';
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
        company: formData.company.trim(),
        position: formData.position.trim(),
        location: formData.location.trim(),
        startDate: formData.startDate,
        endDate: formData.current ? '' : formData.endDate,
        current: Boolean(formData.current),
        description: formData.description.trim(),
        technologies: formData.technologies,
        order: Number(formData.order) || 0,
      };

      if (editingExperience) {
        const updated = await portfolioService.updateExperience(editingExperience._id, payload);
        setExperiences((prev) =>
          prev.map((item) => (item._id === editingExperience._id ? updated : item))
        );
        setFeedback({
          type: 'success',
          message: `Experience "${updated.position} at ${updated.company}" updated successfully.`,
        });
      } else {
        const created = await portfolioService.createExperience(payload);
        setExperiences((prev) => [...prev, created]);
        setFeedback({
          type: 'success',
          message: `Experience "${created.position} at ${created.company}" created successfully.`,
        });
      }

      setIsModalOpen(false);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to save experience. Please check your connection.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (item) => {
    setExperienceToDelete(item);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!experienceToDelete) return;

    setIsDeleting(true);
    try {
      await portfolioService.deleteExperience(experienceToDelete._id);
      setExperiences((prev) => prev.filter((item) => item._id !== experienceToDelete._id));
      setFeedback({
        type: 'success',
        message: `Experience "${experienceToDelete.position} at ${experienceToDelete.company}" deleted successfully.`,
      });
      setDeleteModalOpen(false);
      setExperienceToDelete(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete experience.',
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
              Experience
            </h1>
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-0.5 text-xs font-semibold text-cyan-300">
              {experiences.length} Total
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Manage your career history, current positions, and role details.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchExperiences}
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
            id="add-experience-btn"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Experience</span>
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
            id="experience-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company, position, location, description, tech..."
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
          {['All', 'Current', 'Previous'].map((status) => (
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
            Showing {filteredExperiences.length} of {experiences.length} experiences
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
                  <div className="h-5 w-40 rounded bg-slate-800" />
                  <div className="h-4 w-28 rounded bg-slate-800" />
                </div>
                <div className="h-6 w-16 rounded-full bg-slate-800" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3.5 w-full rounded bg-slate-800" />
                <div className="h-3.5 w-4/5 rounded bg-slate-800" />
              </div>
              <div className="mt-5 flex gap-2">
                <div className="h-6 w-16 rounded-full bg-slate-800" />
                <div className="h-6 w-20 rounded-full bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-8 text-center">
          <p className="text-sm font-semibold text-red-400">Failed to load experience records</p>
          <p className="mt-1 text-xs text-slate-400">{error}</p>
          <button
            type="button"
            onClick={fetchExperiences}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-white"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredExperiences.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-slate-900/30 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-slate-400">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-base font-semibold text-white">
            {experiences.length === 0 ? 'No experiences yet' : 'No matching experiences found'}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
            {experiences.length === 0
              ? 'Start building your career timeline by adding your first work experience.'
              : 'No experiences matched your search criteria. Try modifying your filters.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {experiences.length === 0 ? (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                + Add Experience
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

      {/* Experiences Grid */}
      {!loading && !error && filteredExperiences.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          {filteredExperiences.map((item) => {
            const period = formatPeriodDisplay(item);
            const techList = Array.isArray(item.technologies)
              ? item.technologies
              : typeof item.technologies === 'string' && item.technologies
              ? item.technologies.split(',').map((t) => t.trim())
              : [];

            return (
              <div
                key={item._id}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-6 transition duration-300 hover:border-cyan-400/40 hover:shadow-xl hover:shadow-cyan-400/5"
              >
                <div>
                  {/* Top Row: Title, Company, Status Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-bold text-white group-hover:text-cyan-300">
                          {item.position}
                        </h3>
                        {item.current ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Current
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                            Previous
                          </span>
                        )}
                      </div>

                      <p className="mt-1 font-medium text-cyan-400">
                        {item.company}
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

                  {/* Metadata Row: Period & Location */}
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
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="mt-4 line-clamp-4 text-xs leading-relaxed text-slate-300">
                      {item.description}
                    </p>
                  )}

                  {/* Technologies Tags */}
                  {techList.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {techList.map((t, idx) => (
                        <span
                          key={`${t}-${idx}`}
                          className="rounded-md border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 text-[11px] font-medium text-cyan-300"
                        >
                          {t}
                        </span>
                      ))}
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

      {/* Add / Edit Experience Modal */}
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
                  {editingExperience ? 'Edit Experience' : 'Add New Experience'}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {editingExperience
                    ? 'Update the experience record details below.'
                    : 'Fill in the information to add a work experience record.'}
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
              {/* Company & Position Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Company <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="experience-form-company"
                    value={formData.company}
                    onChange={(e) => {
                      setFormData({ ...formData, company: e.target.value });
                      if (formErrors.company) setFormErrors({ ...formErrors, company: null });
                    }}
                    placeholder="e.g. Acme Innovations"
                    className={`mt-1.5 w-full rounded-xl border bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                      formErrors.company
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                    }`}
                  />
                  {formErrors.company && (
                    <p className="mt-1 text-[11px] text-red-400">{formErrors.company}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Position / Role <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="experience-form-position"
                    value={formData.position}
                    onChange={(e) => {
                      setFormData({ ...formData, position: e.target.value });
                      if (formErrors.position) setFormErrors({ ...formErrors, position: null });
                    }}
                    placeholder="e.g. Senior Full Stack Engineer"
                    className={`mt-1.5 w-full rounded-xl border bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                      formErrors.position
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                    }`}
                  />
                  {formErrors.position && (
                    <p className="mt-1 text-[11px] text-red-400">{formErrors.position}</p>
                  )}
                </div>
              </div>

              {/* Location & Order Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Location
                  </label>
                  <input
                    type="text"
                    id="experience-form-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. San Francisco, CA (or Remote)"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Display Order
                  </label>
                  <input
                    type="number"
                    id="experience-form-order"
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

              {/* Dates & Current Toggle Row */}
              <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="experience-form-current"
                    checked={formData.current}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((prev) => ({
                        ...prev,
                        current: checked,
                        endDate: checked ? '' : prev.endDate,
                      }));
                      if (checked && formErrors.endDate) {
                        setFormErrors((prev) => ({ ...prev, endDate: null }));
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-950"
                  />
                  <label
                    htmlFor="experience-form-current"
                    className="cursor-pointer text-xs font-medium text-slate-200 select-none"
                  >
                    Currently working here (Current Role)
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Start Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      id="experience-form-start-date"
                      value={formData.startDate}
                      onChange={(e) => {
                        setFormData({ ...formData, startDate: e.target.value });
                        if (formErrors.startDate) setFormErrors({ ...formErrors, startDate: null });
                      }}
                      className={`mt-1.5 w-full rounded-xl border bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 ${
                        formErrors.startDate
                          ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                          : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                      }`}
                    />
                    {formErrors.startDate && (
                      <p className="mt-1 text-[11px] text-red-400">{formErrors.startDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      End Date {!formData.current && <span className="text-red-400">*</span>}
                    </label>
                    <input
                      type="date"
                      id="experience-form-end-date"
                      disabled={formData.current}
                      value={formData.current ? '' : formData.endDate}
                      onChange={(e) => {
                        setFormData({ ...formData, endDate: e.target.value });
                        if (formErrors.endDate) setFormErrors({ ...formErrors, endDate: null });
                      }}
                      className={`mt-1.5 w-full rounded-xl border bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-40 ${
                        formErrors.endDate
                          ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                          : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                      }`}
                    />
                    {formErrors.endDate && (
                      <p className="mt-1 text-[11px] text-red-400">{formErrors.endDate}</p>
                    )}
                    {formData.current && (
                      <p className="mt-1 text-[11px] text-emerald-400">Position set to "Present".</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="experience-form-description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (formErrors.description) setFormErrors({ ...formErrors, description: null });
                  }}
                  placeholder="Describe your key responsibilities, contributions, and achievements..."
                  className={`mt-1.5 w-full rounded-xl border bg-slate-950/80 px-3.5 py-2.5 text-xs leading-relaxed text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                    formErrors.description
                      ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                      : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                  }`}
                />
                {formErrors.description && (
                  <p className="mt-1 text-[11px] text-red-400">{formErrors.description}</p>
                )}
              </div>

              {/* Technologies Tag Manager */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Technologies / Skills Used
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    type="text"
                    id="experience-form-tech-input"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={handleTechKeyDown}
                    placeholder="e.g. React, Node.js, AWS (Press Enter to add)"
                    className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                  <button
                    type="button"
                    id="add-tech-pill-btn"
                    onClick={handleAddTech}
                    className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
                  >
                    Add
                  </button>
                </div>

                {formData.technologies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.technologies.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-300"
                      >
                        <span>{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTech(t)}
                          className="text-cyan-400 hover:text-white"
                          title="Remove tag"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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
                  id="save-experience-btn"
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
                    <span>{editingExperience ? 'Update Experience' : 'Save Experience'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && experienceToDelete && (
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
              <h2 className="text-lg font-bold text-white">Delete Experience</h2>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-300">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-white">
                "{experienceToDelete.position}" at "{experienceToDelete.company}"
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
                  setExperienceToDelete(null);
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
                  <span>Delete Experience</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminExperience;
