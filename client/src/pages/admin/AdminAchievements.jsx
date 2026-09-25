import { useState, useEffect, useMemo } from 'react';
import portfolioService from '../../services/portfolioService';
import FileUpload from '../../components/admin/FileUpload';

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

export function AdminAchievements() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Form Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    displayOrder: 0,
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [achievementToDelete, setAchievementToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Feedback Notification
  const [feedback, setFeedback] = useState(null);

  const fetchAchievements = async () => {
    setLoading(true);
    setError(null);
    try {
      // Pass all: true to fetch both active and inactive achievements in admin
      const data = await portfolioService.getAchievements({ all: true });
      setAchievements(data || []);
    } catch (err) {
      setError(err.message || 'Unable to load achievements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  // Dismiss toast feedback after 4 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Filtered achievements based on search
  const filteredAchievements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return achievements;

    return achievements.filter((item) => {
      const title = (item.title || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [achievements, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingAchievement(null);
    setFormData({
      title: '',
      description: '',
      image: '',
      displayOrder:
        achievements.length > 0
          ? Math.max(...achievements.map((a) => (typeof a.displayOrder === 'number' ? a.displayOrder : 0))) + 1
          : 1,
      isActive: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingAchievement(item);
    setFormData({
      title: item.title || '',
      description: item.description || '',
      image: item.image || '',
      displayOrder: typeof item.displayOrder === 'number' ? item.displayOrder : (typeof item.order === 'number' ? item.order : 0),
      isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Achievement title is required.';
    }

    if (!formData.description.trim()) {
      errors.description = 'Achievement description is required.';
    }

    if (formData.image.trim() && !isValidUrl(formData.image.trim())) {
      errors.image = 'Please enter a valid image URL.';
    }

    if (isNaN(Number(formData.displayOrder))) {
      errors.displayOrder = 'Display order must be a valid number.';
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
      const orderVal = Number(formData.displayOrder) || 0;
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        image: formData.image.trim(),
        displayOrder: orderVal,
        order: orderVal,
        isActive: Boolean(formData.isActive),
      };

      if (editingAchievement) {
        const updated = await portfolioService.updateAchievement(
          editingAchievement._id,
          payload
        );
        setAchievements((prev) =>
          prev.map((item) => (item._id === editingAchievement._id ? updated : item))
        );
        setFeedback({
          type: 'success',
          message: `Achievement "${updated.title}" updated successfully.`,
        });
      } else {
        const created = await portfolioService.createAchievement(payload);
        setAchievements((prev) => [...prev, created]);
        setFeedback({
          type: 'success',
          message: `Achievement "${created.title}" created successfully.`,
        });
      }

      setIsModalOpen(false);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to save achievement.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (item) => {
    setAchievementToDelete(item);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!achievementToDelete) return;

    setIsDeleting(true);
    try {
      await portfolioService.deleteAchievement(achievementToDelete._id);
      setAchievements((prev) =>
        prev.filter((item) => item._id !== achievementToDelete._id)
      );
      setFeedback({
        type: 'success',
        message: `Achievement "${achievementToDelete.title}" deleted successfully.`,
      });
      setDeleteModalOpen(false);
      setAchievementToDelete(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete achievement.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick toggle active status
  const handleToggleActive = async (item) => {
    try {
      const newStatus = !item.isActive;
      const updated = await portfolioService.updateAchievement(item._id, {
        isActive: newStatus,
      });
      setAchievements((prev) =>
        prev.map((a) => (a._id === item._id ? updated : a))
      );
      setFeedback({
        type: 'success',
        message: `Achievement "${item.title}" marked as ${newStatus ? 'active' : 'inactive'}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update status.',
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Feedback Notification */}
      {feedback && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl backdrop-blur-xl transition-all ${
            feedback.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-200'
              : 'border-red-500/30 bg-red-950/90 text-red-200'
          }`}
        >
          <span className="text-lg">
            {feedback.type === 'success' ? '✓' : '⚠'}
          </span>
          <p className="text-xs font-medium">{feedback.message}</p>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/90 p-6 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Achievements
            </h1>
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-0.5 text-xs font-semibold text-cyan-300">
              {achievements.length} {achievements.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Manage your career milestones, competition awards, honors, and notable accomplishments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAchievements}
            disabled={loading}
            title="Refresh achievements list"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300 disabled:opacity-50"
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
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            id="add-achievement-btn"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/30 active:scale-[0.98]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Achievement</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/40 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search achievements by title or description..."
            className="w-full rounded-xl border border-white/10 bg-slate-950/80 py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 transition focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{filteredAchievements.length}</strong> of{' '}
            <strong className="text-white">{achievements.length}</strong> items
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="rounded-lg border border-slate-700/50 px-2.5 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && achievements.length === 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((skeletonId) => (
            <div
              key={skeletonId}
              className="animate-pulse rounded-2xl border border-white/10 bg-slate-900/50 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-slate-800" />
                <div className="h-5 w-12 rounded bg-slate-800" />
              </div>
              <div className="mt-4 h-5 w-3/4 rounded bg-slate-800" />
              <div className="mt-2 h-4 w-1/2 rounded bg-slate-800" />
              <div className="mt-4 space-y-2">
                <div className="h-3 w-full rounded bg-slate-800/60" />
                <div className="h-3 w-5/6 rounded bg-slate-800/60" />
              </div>
              <div className="mt-6 flex justify-end gap-2 border-t border-white/5 pt-4">
                <div className="h-7 w-16 rounded-xl bg-slate-800" />
                <div className="h-7 w-16 rounded-xl bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="mt-4 text-sm font-bold text-white">Failed to Load Achievements</h3>
          <p className="mt-1 text-xs text-red-300">{error}</p>
          <button
            type="button"
            onClick={fetchAchievements}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-white"
          >
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredAchievements.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-slate-900/30 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-slate-400">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-base font-bold text-white">
            {searchQuery ? 'No matching achievements found' : 'No achievements added yet'}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
            {searchQuery
              ? `No results match "${searchQuery}". Try a different keyword.`
              : 'Add your awards, competition recognitions, and major career achievements to show them on your live portfolio.'}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Your First Achievement</span>
            </button>
          )}
        </div>
      )}

      {/* Achievements Cards Grid */}
      {!loading && !error && filteredAchievements.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAchievements.map((item) => (
            <article
              key={item._id}
              className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-6 transition duration-300 hover:border-cyan-400/40 hover:shadow-xl hover:shadow-cyan-400/5"
            >
              <div>
                {/* Header row: Icon/Image + Badges */}
                <div className="flex items-start justify-between gap-3">
                  {item.image ? (
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-950">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-xl font-bold text-amber-400">
                      🏆
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {/* Active/Inactive Toggle Badge */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      title={`Click to mark as ${item.isActive ? 'Inactive' : 'Active'}`}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                        item.isActive
                          ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          : 'border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {item.isActive ? '● Active' : '○ Inactive'}
                    </button>

                    {/* Display Order Badge */}
                    <span
                      title="Display Order"
                      className="rounded-lg border border-white/10 bg-slate-950/80 px-2 py-1 text-[11px] font-mono font-medium text-slate-400"
                    >
                      #{item.displayOrder ?? item.order ?? 0}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="mt-4 text-base font-bold text-white transition group-hover:text-cyan-300">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-400">
                  {item.description}
                </p>

                {/* Image preview badge if available */}
                {item.image && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-slate-950">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="max-h-28 w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
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
            </article>
          ))}
        </div>
      )}

      {/* Form Modal (Add / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between border-b border-white/10 pb-5">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingAchievement ? 'Edit Achievement' : 'Add New Achievement'}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {editingAchievement
                    ? 'Update the achievement details and display settings.'
                    : 'Add a new achievement or award to showcase on your portfolio.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-white/10 p-2 text-slate-400 hover:border-white/20 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="mt-6 space-y-5" noValidate>
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Achievement Title <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  id="achievement-form-title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (formErrors.title) setFormErrors({ ...formErrors, title: null });
                  }}
                  placeholder="e.g. 1st Place - Smart India Hackathon"
                  className={`mt-1.5 w-full rounded-xl border bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                    formErrors.title
                      ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                      : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                  }`}
                />
                {formErrors.title && (
                  <p className="mt-1 text-xs text-red-400">{formErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Description <span className="text-cyan-400">*</span>
                </label>
                <textarea
                  id="achievement-form-description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (formErrors.description) setFormErrors({ ...formErrors, description: null });
                  }}
                  placeholder="Details regarding the achievement, competition, scope, or impact..."
                  className={`mt-1.5 w-full rounded-xl border bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                    formErrors.description
                      ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                      : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                  }`}
                />
                {formErrors.description && (
                  <p className="mt-1 text-xs text-red-400">{formErrors.description}</p>
                )}
              </div>

              {/* Display Order & Active Status Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Display Order (lower numbers appear first)
                  </label>
                  <input
                    type="number"
                    id="achievement-form-order"
                    value={formData.displayOrder}
                    onChange={(e) => {
                      setFormData({ ...formData, displayOrder: e.target.value });
                      if (formErrors.displayOrder) setFormErrors({ ...formErrors, displayOrder: null });
                    }}
                    placeholder="1"
                    className={`mt-1.5 w-full rounded-xl border bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 ${
                      formErrors.displayOrder
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                    }`}
                  />
                  {formErrors.displayOrder && (
                    <p className="mt-1 text-xs text-red-400">{formErrors.displayOrder}</p>
                  )}
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-slate-950/80 p-2.5">
                    <input
                      type="checkbox"
                      id="achievement-form-active"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-400 focus:ring-cyan-400"
                    />
                    <div>
                      <span className="text-xs font-semibold text-white">Active Status</span>
                      <p className="text-[11px] text-slate-400">Display this achievement on live portfolio</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Image Upload (Optional) */}
              <div>
                <FileUpload
                  id="achievement-form-image"
                  label="Achievement Image / Certificate (Optional — JPG, PNG, WEBP — max 5MB)"
                  type="achievement"
                  value={formData.image}
                  onChange={(val) => {
                    setFormData({ ...formData, image: val });
                    if (formErrors.image) setFormErrors({ ...formErrors, image: null });
                  }}
                  error={formErrors.image}
                  placeholder="https://... or click Upload Image"
                  helperText="Optional image for this achievement. If omitted, an elegant award emblem will be shown."
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
                  id="save-achievement-btn"
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
                    <span>{editingAchievement ? 'Update Achievement' : 'Save Achievement'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && achievementToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-base font-bold text-white">Delete Achievement?</h3>
              <p className="mt-2 text-xs text-slate-400">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-200">
                  "{achievementToDelete.title}"
                </strong>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setAchievementToDelete(null);
                }}
                disabled={isDeleting}
                className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-delete-achievement-btn"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Permanently</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAchievements;
