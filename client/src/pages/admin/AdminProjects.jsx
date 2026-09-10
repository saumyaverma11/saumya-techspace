import { useState, useEffect, useMemo } from 'react';
import portfolioService from '../../services/portfolioService';

const DEFAULT_CATEGORIES = [
  'Full Stack',
  'Frontend',
  'Backend',
  'Mobile App',
  'UI/UX Design',
  'Cloud / DevOps',
  'AI / Machine Learning',
  'Other',
];

export function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Form Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Full Stack',
    image: '',
    technologies: [],
    githubUrl: '',
    liveUrl: '',
    featured: false,
  });
  const [techInput, setTechInput] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // User Notification Feedback
  const [feedback, setFeedback] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portfolioService.getProjects();
      setProjects(data || []);
    } catch (err) {
      setError(err.message || 'Unable to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Dismiss feedback after 4 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Dynamic list of categories from projects + defaults
  const categoriesList = useMemo(() => {
    const fromProjects = projects
      .map((p) => p.category)
      .filter((c) => c && typeof c === 'string' && c.trim().length > 0);
    const set = new Set(['All', ...DEFAULT_CATEGORIES, ...fromProjects]);
    return Array.from(set);
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        !searchQuery.trim() ||
        (project.title &&
          project.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (project.description &&
          project.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' || project.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [projects, searchQuery, selectedCategory]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormData({
      title: '',
      description: '',
      category: 'Full Stack',
      image: '',
      technologies: [],
      githubUrl: '',
      liveUrl: '',
      featured: false,
    });
    setTechInput('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (project) => {
    setEditingProject(project);
    const techArray = Array.isArray(project.technologies)
      ? project.technologies
      : typeof project.technologies === 'string' && project.technologies
      ? project.technologies.split(',').map((t) => t.trim())
      : [];

    setFormData({
      title: project.title || '',
      description: project.description || '',
      category: project.category || 'Full Stack',
      image: project.image || '',
      technologies: techArray,
      githubUrl: project.githubUrl || project.github || '',
      liveUrl: project.liveUrl || project.live || '',
      featured: Boolean(project.featured),
    });
    setTechInput('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Add technology tag
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

  // Remove technology tag
  const handleRemoveTech = (techToRemove) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t !== techToRemove),
    }));
  };

  // Handle tech input keydown
  const handleTechKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTech();
    }
  };

  // Validate Form
  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Project title is required.';
    }
    if (!formData.description.trim()) {
      errors.description = 'Project description is required.';
    }
    if (!formData.category.trim()) {
      errors.category = 'Category is required.';
    }

    const urlRegex = /^(https?:\/\/)?([\w.-]+)+([/?#].*)?$/i;
    if (formData.githubUrl.trim() && !urlRegex.test(formData.githubUrl.trim())) {
      errors.githubUrl = 'Please enter a valid GitHub URL.';
    }
    if (formData.liveUrl.trim() && !urlRegex.test(formData.liveUrl.trim())) {
      errors.liveUrl = 'Please enter a valid Live Demo URL.';
    }
    if (formData.image.trim() && !urlRegex.test(formData.image.trim())) {
      errors.image = 'Please enter a valid image URL.';
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
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        image: formData.image.trim(),
        technologies: formData.technologies,
        githubUrl: formData.githubUrl.trim(),
        liveUrl: formData.liveUrl.trim(),
        featured: Boolean(formData.featured),
      };

      if (editingProject) {
        const updated = await portfolioService.updateProject(
          editingProject._id,
          payload
        );
        setProjects((prev) =>
          prev.map((p) => (p._id === editingProject._id ? updated : p))
        );
        setFeedback({
          type: 'success',
          message: `Project "${updated.title}" updated successfully.`,
        });
      } else {
        const created = await portfolioService.createProject(payload);
        setProjects((prev) => [created, ...prev]);
        setFeedback({
          type: 'success',
          message: `Project "${created.title}" created successfully.`,
        });
      }

      setIsModalOpen(false);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to save project. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (project) => {
    setProjectToDelete(project);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      await portfolioService.deleteProject(projectToDelete._id);
      setProjects((prev) => prev.filter((p) => p._id !== projectToDelete._id));
      setFeedback({
        type: 'success',
        message: `Project "${projectToDelete.title}" deleted successfully.`,
      });
      setDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete project.',
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
            <svg className="h-5 w-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              Projects Management
            </h1>
            {!loading && (
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-0.5 text-xs font-semibold text-cyan-300">
                {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Create, update, and manage your portfolio projects in real time.
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
          <span>Add New Project</span>
        </button>
      </div>

      {/* Controls Bar: Search & Category Filter */}
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
            placeholder="Search projects by title or keywords..."
            className="w-full rounded-xl border border-white/10 bg-slate-950 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400"
          />
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-3">
          <label htmlFor="categoryFilter" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Category:
          </label>
          <select
            id="categoryFilter"
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

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((id) => (
            <div
              key={id}
              className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-5"
            >
              <div className="h-40 w-full rounded-xl bg-slate-800" />
              <div className="mt-4 space-y-2">
                <div className="h-5 w-2/3 rounded bg-slate-800" />
                <div className="h-4 w-full rounded bg-slate-800" />
                <div className="h-4 w-4/5 rounded bg-slate-800" />
              </div>
              <div className="mt-5 flex gap-2">
                <div className="h-5 w-14 rounded-full bg-slate-800" />
                <div className="h-5 w-14 rounded-full bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="mx-auto max-w-lg rounded-2xl border border-red-500/20 bg-red-950/30 p-8 text-center">
          <p className="text-base font-semibold text-red-400">Failed to load projects</p>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <button
            type="button"
            onClick={fetchProjects}
            className="mt-5 inline-flex items-center rounded-xl bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredProjects.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-800 text-slate-400">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-base font-bold text-white">
            {searchQuery || selectedCategory !== 'All'
              ? 'No matching projects found'
              : 'No projects added yet'}
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-xs text-slate-400">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your search criteria or resetting the category filter.'
              : 'Start showcasing your work by creating your first portfolio project entry.'}
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              <span>+ Create First Project</span>
            </button>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && !error && filteredProjects.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const techList = Array.isArray(project.technologies)
              ? project.technologies
              : typeof project.technologies === 'string' && project.technologies
              ? project.technologies.split(',').map((t) => t.trim())
              : [];

            return (
              <div
                key={project._id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 transition duration-200 hover:border-cyan-400/40 hover:shadow-xl hover:shadow-cyan-400/5"
              >
                {/* Thumbnail / Header Area */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                  {project.image ? (
                    <img
                      src={project.image}
                      alt={project.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement.innerHTML = `
                          <div class="flex h-full w-full items-center justify-center bg-slate-900 text-3xl font-bold text-cyan-400/50">
                            ${(project.title || 'P').charAt(0)}
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-3xl font-bold text-cyan-400/50">
                      {(project.title || 'P').charAt(0)}
                    </div>
                  )}

                  {/* Status Badges Overlay */}
                  <div className="absolute left-3 top-3 flex items-center gap-2">
                    {project.featured && (
                      <span className="rounded-full border border-yellow-400/30 bg-yellow-400/20 px-2.5 py-0.5 text-[11px] font-semibold text-yellow-300 backdrop-blur-md">
                        ★ Featured
                      </span>
                    )}
                    {project.category && (
                      <span className="rounded-full border border-cyan-400/30 bg-cyan-400/20 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-200 backdrop-blur-md">
                        {project.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-bold text-white transition group-hover:text-cyan-300">
                    {project.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-slate-400">
                    {project.description}
                  </p>

                  {/* Tech Tags */}
                  {techList.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {techList.map((t, idx) => (
                        <span
                          key={`${t}-${idx}`}
                          className="rounded-lg border border-white/5 bg-slate-950 px-2 py-0.5 text-[11px] text-slate-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Links Preview */}
                  <div className="mt-4 flex items-center gap-3 border-t border-white/5 pt-3 text-xs text-slate-400">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-cyan-400"
                      >
                        <span>GitHub</span>
                        <span className="text-[10px]">&nearr;</span>
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                      >
                        <span>Live Demo</span>
                        <span className="text-[10px]">&nearr;</span>
                      </a>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(project)}
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
                      onClick={() => handleOpenDelete(project)}
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
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* REUSABLE ADD / EDIT PROJECT MODAL                        */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          />

          {/* Dialog Card */}
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h2>
                <p className="text-xs text-slate-400">
                  {editingProject
                    ? 'Update the project details and save changes.'
                    : 'Fill in the information to add a project to your portfolio.'}
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
            <form onSubmit={handleSubmitForm} className="max-h-[75vh] space-y-5 overflow-y-auto px-6 py-6" noValidate>
              {/* Title */}
              <div>
                <label htmlFor="modalTitle" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Project Title <span className="text-cyan-400">*</span>
                </label>
                <input
                  id="modalTitle"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, title: e.target.value }));
                    if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: null }));
                  }}
                  placeholder="e.g. Modern Developer Portfolio"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400"
                />
                {formErrors.title && <p className="mt-1 text-xs text-red-400">{formErrors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="modalDescription" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Description <span className="text-cyan-400">*</span>
                </label>
                <textarea
                  id="modalDescription"
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, description: e.target.value }));
                    if (formErrors.description)
                      setFormErrors((prev) => ({ ...prev, description: null }));
                  }}
                  placeholder="Comprehensive description of the application, architecture, and features..."
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400"
                />
                {formErrors.description && (
                  <p className="mt-1 text-xs text-red-400">{formErrors.description}</p>
                )}
              </div>

              {/* Category & Featured Toggle Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="modalCategory" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Category <span className="text-cyan-400">*</span>
                  </label>
                  <select
                    id="modalCategory"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400"
                  >
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-slate-950 p-2.5">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, featured: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-400 focus:ring-cyan-400"
                    />
                    <div>
                      <span className="text-xs font-semibold text-white">Feature on Public Portfolio</span>
                      <p className="text-[11px] text-slate-400">Highlights project on public showcase</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Technologies Tag Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Technologies
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    type="text"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={handleTechKeyDown}
                    placeholder="Type technology (e.g. React, Node.js, MongoDB) and press Add or Enter"
                    className="flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddTech}
                    className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
                  >
                    Add
                  </button>
                </div>

                {/* Tag Pills */}
                {formData.technologies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-300"
                      >
                        <span>{tech}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTech(tech)}
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

              {/* Image URL & Live Preview */}
              <div>
                <label htmlFor="modalImage" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Image URL
                </label>
                <input
                  id="modalImage"
                  type="url"
                  value={formData.image}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, image: e.target.value }));
                    if (formErrors.image) setFormErrors((prev) => ({ ...prev, image: null }));
                  }}
                  placeholder="https://images.unsplash.com/... or /assets/pic.jpg"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400"
                />
                {formErrors.image && <p className="mt-1 text-xs text-red-400">{formErrors.image}</p>}

                {/* Small Image Preview */}
                {formData.image && (
                  <div className="mt-3 flex items-center gap-4 rounded-xl border border-white/10 bg-slate-950 p-3">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="h-16 w-24 rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="text-xs text-slate-400">
                      <p className="font-semibold text-slate-200">Image Preview</p>
                      <p className="truncate max-w-xs">{formData.image}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* GitHub and Live Demo Links */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="modalGithub" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    GitHub URL
                  </label>
                  <input
                    id="modalGithub"
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, githubUrl: e.target.value }));
                      if (formErrors.githubUrl) setFormErrors((prev) => ({ ...prev, githubUrl: null }));
                    }}
                    placeholder="https://github.com/username/repo"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400"
                  />
                  {formErrors.githubUrl && (
                    <p className="mt-1 text-xs text-red-400">{formErrors.githubUrl}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="modalLive" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Live Demo URL
                  </label>
                  <input
                    id="modalLive"
                    type="url"
                    value={formData.liveUrl}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, liveUrl: e.target.value }));
                      if (formErrors.liveUrl) setFormErrors((prev) => ({ ...prev, liveUrl: null }));
                    }}
                    placeholder="https://myproject.vercel.app"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400"
                  />
                  {formErrors.liveUrl && (
                    <p className="mt-1 text-xs text-red-400">{formErrors.liveUrl}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
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
                    <span>{editingProject ? 'Save Changes' : 'Create Project'}</span>
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
      {deleteModalOpen && projectToDelete && (
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
                <h3 className="text-base font-bold text-white">Delete Project</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-white">"{projectToDelete.title}"</span>?
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

export default AdminProjects;
