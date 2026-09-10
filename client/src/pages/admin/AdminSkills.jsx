import { useState, useEffect, useMemo } from 'react';
import portfolioService from '../../services/portfolioService';

// Base suggested categories for developer skills
const SUGGESTED_CATEGORIES = [
  'Frontend',
  'Backend',
  'Database',
  'Tools',
  'Languages',
  'Mobile',
  'DevOps & Cloud',
  'Other',
];

// Supported skill proficiency levels matching public portfolio logic
const SKILL_LEVELS = [
  { label: 'Beginner (45%)', value: 'Beginner', width: '45%' },
  { label: 'Intermediate (65%)', value: 'Intermediate', width: '65%' },
  { label: 'Advanced (85%)', value: 'Advanced', width: '85%' },
  { label: 'Expert (95%)', value: 'Expert', width: '95%' },
];

function getLevelPercentage(level) {
  if (!level) return '65%';
  const lower = String(level).trim().toLowerCase();
  if (lower.includes('expert') || lower.includes('master')) return '95%';
  if (lower.includes('advanced')) return '85%';
  if (lower.includes('intermediate') || lower.includes('mid')) return '65%';
  if (lower.includes('beginner') || lower.includes('basic')) return '45%';
  return '65%';
}

export function AdminSkills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Form Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Frontend',
    level: 'Intermediate',
    icon: '',
    order: 0,
  });
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // User Notification Feedback
  const [feedback, setFeedback] = useState(null);

  const fetchSkills = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portfolioService.getSkills();
      setSkills(data || []);
    } catch (err) {
      setError(err.message || 'Unable to load skills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  // Dismiss feedback after 4 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Dynamically derive categories from existing skills + suggestions
  const categoriesList = useMemo(() => {
    const fromSkills = skills
      .map((s) => s.category)
      .filter((c) => c && typeof c === 'string' && c.trim().length > 0)
      .map((c) => c.trim());

    // Merge API categories with suggested defaults, removing duplicates
    const set = new Set(['All', ...SUGGESTED_CATEGORIES, ...fromSkills]);
    return Array.from(set);
  }, [skills]);

  // Filtered skills list
  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      const matchesSearch =
        !searchQuery.trim() ||
        (skill.name &&
          skill.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (skill.category &&
          skill.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (skill.level &&
          skill.level.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' ||
        (skill.category && skill.category.trim() === selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [skills, searchQuery, selectedCategory]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingSkill(null);
    setFormData({
      name: '',
      category: 'Frontend',
      level: 'Intermediate',
      icon: '',
      order: skills.length > 0 ? Math.max(...skills.map((s) => s.order || 0)) + 1 : 1,
    });
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (skill) => {
    setEditingSkill(skill);
    const existingCat = (skill.category || '').trim();
    const isStandard = SUGGESTED_CATEGORIES.includes(existingCat);

    setFormData({
      name: skill.name || '',
      category: existingCat || 'Frontend',
      level: skill.level || 'Intermediate',
      icon: skill.icon || '',
      order: typeof skill.order === 'number' ? skill.order : 0,
    });

    if (existingCat && !isStandard) {
      setIsCustomCategory(true);
      setCustomCategoryInput(existingCat);
    } else {
      setIsCustomCategory(false);
      setCustomCategoryInput('');
    }

    setFormErrors({});
    setIsModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Skill name is required.';
    }

    const effectiveCategory = isCustomCategory
      ? customCategoryInput.trim()
      : formData.category.trim();

    if (!effectiveCategory) {
      errors.category = 'Skill category is required.';
    }

    if (!formData.level.trim()) {
      errors.level = 'Proficiency level is required.';
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
      const effectiveCategory = isCustomCategory
        ? customCategoryInput.trim()
        : formData.category.trim();

      const payload = {
        name: formData.name.trim(),
        category: effectiveCategory,
        level: formData.level.trim(),
        icon: formData.icon.trim(),
        order: Number(formData.order) || 0,
      };

      if (editingSkill) {
        const updated = await portfolioService.updateSkill(editingSkill._id, payload);
        setSkills((prev) =>
          prev.map((s) => (s._id === editingSkill._id ? updated : s))
        );
        setFeedback({
          type: 'success',
          message: `Skill "${updated.name}" updated successfully.`,
        });
      } else {
        const created = await portfolioService.createSkill(payload);
        setSkills((prev) => [...prev, created]);
        setFeedback({
          type: 'success',
          message: `Skill "${created.name}" created successfully.`,
        });
      }

      setIsModalOpen(false);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to save skill. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (skill) => {
    setSkillToDelete(skill);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!skillToDelete) return;

    setIsDeleting(true);
    try {
      await portfolioService.deleteSkill(skillToDelete._id);
      setSkills((prev) => prev.filter((s) => s._id !== skillToDelete._id));
      setFeedback({
        type: 'success',
        message: `Skill "${skillToDelete.name}" deleted successfully.`,
      });
      setDeleteModalOpen(false);
      setSkillToDelete(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete skill.',
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
              Skills
            </h1>
            {!loading && (
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-0.5 text-xs font-semibold text-cyan-300">
                {skills.length} {skills.length === 1 ? 'Skill' : 'Skills'}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Manage your technical competencies, categorization, and proficiency levels.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New Skill</span>
        </button>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills by name, category, or level..."
            className="w-full rounded-xl border border-white/10 bg-slate-950 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400"
          />
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-3">
          <label htmlFor="skillCategoryFilter" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Category:
          </label>
          <select
            id="skillCategoryFilter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-sm text-slate-200 outline-none transition focus:border-cyan-400"
          >
            {categoriesList.map((cat) => (
              <option key={cat} value={cat} className="bg-slate-900 text-white">
                {cat}
              </option>
            ))}
          </select>

          {(searchQuery || selectedCategory !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="text-xs font-medium text-slate-400 underline transition hover:text-cyan-400"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((id) => (
            <div
              key={id}
              className="animate-pulse rounded-2xl border border-white/10 bg-slate-900/60 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-28 rounded bg-slate-800" />
                  <div className="h-4 w-20 rounded bg-slate-800" />
                </div>
                <div className="h-6 w-20 rounded-full bg-slate-800" />
              </div>
              <div className="mt-5 h-1.5 w-full rounded-full bg-slate-800" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="mx-auto max-w-lg rounded-2xl border border-red-500/20 bg-red-950/30 p-8 text-center">
          <p className="text-base font-semibold text-red-400">Failed to load skills</p>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <button
            type="button"
            onClick={fetchSkills}
            className="mt-5 inline-flex items-center rounded-xl bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredSkills.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-800 text-slate-400">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-base font-bold text-white">
            {searchQuery || selectedCategory !== 'All'
              ? 'No matching skills found'
              : 'No skills added yet'}
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-xs text-slate-400">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your search criteria or resetting the category filter.'
              : 'Start organizing your technical stack by adding your first skill.'}
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              <span>+ Add First Skill</span>
            </button>
          </div>
        </div>
      )}

      {/* Skills Grid */}
      {!loading && !error && filteredSkills.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSkills.map((skill) => {
            const width = getLevelPercentage(skill.level);

            return (
              <div
                key={skill._id}
                className="group relative rounded-2xl border border-white/10 bg-slate-900/70 p-6 transition duration-200 hover:border-cyan-400/40 hover:shadow-xl hover:shadow-cyan-400/5"
              >
                {/* Top Row: Info & Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 font-bold text-cyan-300 shadow-sm shadow-cyan-400/10">
                      {skill.icon ? (
                        <span className="text-xs">{skill.icon.slice(0, 3)}</span>
                      ) : (
                        <span>{(skill.name || 'S').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white transition group-hover:text-cyan-300">
                        {skill.name}
                      </h3>
                      {skill.category && (
                        <p className="mt-0.5 text-xs text-slate-400">{skill.category}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {skill.level && (
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400">
                        {skill.level}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-500">
                      Order: #{skill.order ?? 0}
                    </span>
                  </div>
                </div>

                {/* Level Progress Indicator */}
                <div className="mt-5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                      style={{ width }}
                    />
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/5 pt-4">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(skill)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:bg-slate-800 hover:text-cyan-300"
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
                    onClick={() => handleOpenDelete(skill)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
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

      {/* ======================================================== */}
      {/* REUSABLE ADD / EDIT SKILL MODAL                          */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingSkill ? 'Edit Skill' : 'Add New Skill'}
                </h2>
                <p className="text-xs text-slate-400">
                  {editingSkill
                    ? 'Update the skill information and save.'
                    : 'Add a new competency to your skill showcase.'}
                </p>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                aria-label="Close modal"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitForm} className="space-y-5 px-6 py-6" noValidate>
              {/* Skill Name */}
              <div>
                <label htmlFor="skillName" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Skill Name <span className="text-cyan-400">*</span>
                </label>
                <input
                  id="skillName"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="e.g. React.js, Node.js, MongoDB"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400"
                />
                {formErrors.name && <p className="mt-1 text-xs text-red-400">{formErrors.name}</p>}
              </div>

              {/* Category with Suggested Options & Custom Switch */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="skillCategory" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Category <span className="text-cyan-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory((prev) => !prev);
                      if (formErrors.category) setFormErrors((prev) => ({ ...prev, category: null }));
                    }}
                    className="text-xs font-medium text-cyan-400 hover:underline"
                  >
                    {isCustomCategory ? 'Choose Suggested' : '+ Custom Category'}
                  </button>
                </div>

                {isCustomCategory ? (
                  <input
                    id="skillCategoryCustom"
                    type="text"
                    required
                    value={customCategoryInput}
                    onChange={(e) => {
                      setCustomCategoryInput(e.target.value);
                      if (formErrors.category) setFormErrors((prev) => ({ ...prev, category: null }));
                    }}
                    placeholder="Enter custom category name (e.g. Cloud, Mobile)"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400"
                  />
                ) : (
                  <select
                    id="skillCategory"
                    value={formData.category}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, category: e.target.value }));
                      if (formErrors.category) setFormErrors((prev) => ({ ...prev, category: null }));
                    }}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400"
                  >
                    {SUGGESTED_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
                {formErrors.category && <p className="mt-1 text-xs text-red-400">{formErrors.category}</p>}
              </div>

              {/* Level Dropdown */}
              <div>
                <label htmlFor="skillLevel" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Proficiency Level <span className="text-cyan-400">*</span>
                </label>
                <select
                  id="skillLevel"
                  value={formData.level}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, level: e.target.value }));
                    if (formErrors.level) setFormErrors((prev) => ({ ...prev, level: null }));
                  }}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400"
                >
                  {SKILL_LEVELS.map((lvl) => (
                    <option key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </option>
                  ))}
                </select>
                {formErrors.level && <p className="mt-1 text-xs text-red-400">{formErrors.level}</p>}
              </div>

              {/* Display Order & Icon Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="skillOrder" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Display Order
                  </label>
                  <input
                    id="skillOrder"
                    type="number"
                    min={0}
                    value={formData.order}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, order: e.target.value }));
                      if (formErrors.order) setFormErrors((prev) => ({ ...prev, order: null }));
                    }}
                    placeholder="0"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400"
                  />
                  {formErrors.order && <p className="mt-1 text-xs text-red-400">{formErrors.order}</p>}
                </div>

                <div>
                  <label htmlFor="skillIcon" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Icon Identifier <span className="text-slate-500 text-[10px]">(Optional)</span>
                  </label>
                  <input
                    id="skillIcon"
                    type="text"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, icon: e.target.value }))
                    }
                    placeholder="e.g. react, js, node"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingSkill ? 'Save Changes' : 'Add Skill'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION DIALOG                               */}
      {/* ======================================================== */}
      {deleteModalOpen && skillToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
            onClick={() => !isDeleting && setDeleteModalOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Skill</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-white">"{skillToDelete.name}"</span>?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSkills;
