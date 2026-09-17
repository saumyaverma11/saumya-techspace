import { useState, useEffect } from 'react';
import portfolioService from '../../services/portfolioService';
import defaultPicture from '../../assets/Pic.jpeg';

function isValidUrl(string) {
  if (!string) return true;
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function AdminProfile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [avatarError, setAvatarError] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    tagline: '',
    bio: '',
    aboutHeading: '',
    aboutDescription: '',
    avatar: '',
    resumeUrl: '',
    email: '',
    location: '',
    githubUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
  });

  const [formErrors, setFormErrors] = useState({});

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portfolioService.getProfile();
      if (data) {
        setFormData({
          name: data.name || '',
          title: data.title || '',
          tagline: data.tagline || '',
          bio: data.bio || '',
          aboutHeading: data.aboutHeading || '',
          aboutDescription: data.aboutDescription || '',
          avatar: data.avatar || '',
          resumeUrl: data.resumeUrl || '',
          email: data.email || '',
          location: data.location || '',
          githubUrl: data.githubUrl || '',
          linkedinUrl: data.linkedinUrl || '',
          twitterUrl: data.twitterUrl || '',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    portfolioService
      .getProfile()
      .then((data) => {
        if (isMounted && data) {
          setFormData({
            name: data.name || '',
            title: data.title || '',
            tagline: data.tagline || '',
            bio: data.bio || '',
            aboutHeading: data.aboutHeading || '',
            aboutDescription: data.aboutDescription || '',
            avatar: data.avatar || '',
            resumeUrl: data.resumeUrl || '',
            email: data.email || '',
            location: data.location || '',
            githubUrl: data.githubUrl || '',
            linkedinUrl: data.linkedinUrl || '',
            twitterUrl: data.twitterUrl || '',
          });
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load profile details.');
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

  // Reset avatar error flag if avatar url changes
  useEffect(() => {
    setAvatarError(false);
  }, [formData.avatar]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Full name is required.';
    }

    if (!formData.title.trim()) {
      errors.title = 'Professional title is required.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Primary email address is required.';
    } else if (!isValidEmail(formData.email.trim())) {
      errors.email = 'Please provide a valid email format (e.g. name@example.com).';
    }

    const urlFields = [
      { key: 'avatar', label: 'Avatar URL' },
      { key: 'resumeUrl', label: 'Resume URL' },
      { key: 'githubUrl', label: 'GitHub URL' },
      { key: 'linkedinUrl', label: 'LinkedIn URL' },
      { key: 'twitterUrl', label: 'Twitter / X URL' },
    ];

    for (const field of urlFields) {
      const val = formData[field.key].trim();
      if (val && !isValidUrl(val)) {
        errors[field.key] = `${field.label} must be a valid URL starting with http:// or https://`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        title: formData.title.trim(),
        tagline: formData.tagline.trim(),
        bio: formData.bio.trim(),
        aboutHeading: formData.aboutHeading.trim(),
        aboutDescription: formData.aboutDescription.trim(),
        avatar: formData.avatar.trim(),
        resumeUrl: formData.resumeUrl.trim(),
        email: formData.email.trim(),
        location: formData.location.trim(),
        githubUrl: formData.githubUrl.trim(),
        linkedinUrl: formData.linkedinUrl.trim(),
        twitterUrl: formData.twitterUrl.trim(),
      };

      const updated = await portfolioService.updateProfile(payload);
      if (updated) {
        setFormData({
          name: updated.name || '',
          title: updated.title || '',
          tagline: updated.tagline || '',
          bio: updated.bio || '',
          aboutHeading: updated.aboutHeading || '',
          aboutDescription: updated.aboutDescription || '',
          avatar: updated.avatar || '',
          resumeUrl: updated.resumeUrl || '',
          email: updated.email || '',
          location: updated.location || '',
          githubUrl: updated.githubUrl || '',
          linkedinUrl: updated.linkedinUrl || '',
          twitterUrl: updated.twitterUrl || '',
        });
      }

      setFeedback({
        type: 'success',
        message: 'Profile information updated and published successfully.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update profile. Please check your connection.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const previewAvatarSrc =
    formData.avatar.trim() && !avatarError ? formData.avatar.trim() : defaultPicture;

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
              Profile & Branding
            </h1>
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-0.5 text-xs font-semibold text-cyan-300">
              Active Profile
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Manage your personal branding, bio, about details, visual assets, contact info, and public social presence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchProfile}
            disabled={loading || isSaving}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300 disabled:opacity-50"
            title="Refresh profile details"
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
            id="save-profile-btn"
            onClick={handleSaveProfile}
            disabled={loading || isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            {isSaving ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading Skeleton State */}
      {loading && (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="animate-pulse rounded-3xl border border-white/10 bg-slate-900/50 p-6 sm:p-8"
              >
                <div className="h-5 w-40 rounded bg-slate-800" />
                <div className="mt-5 space-y-4">
                  <div className="h-10 w-full rounded-xl bg-slate-800" />
                  <div className="h-10 w-full rounded-xl bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
          <div className="animate-pulse rounded-3xl border border-white/10 bg-slate-900/50 p-6 sm:p-8">
            <div className="mx-auto h-32 w-32 rounded-full bg-slate-800" />
            <div className="mx-auto mt-6 h-5 w-3/4 rounded bg-slate-800" />
            <div className="mx-auto mt-3 h-4 w-1/2 rounded bg-slate-800" />
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-8 text-center">
          <p className="text-sm font-semibold text-red-400">Failed to load profile record</p>
          <p className="mt-1 text-xs text-slate-400">{error}</p>
          <button
            type="button"
            onClick={fetchProfile}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-white"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Main Profile Form & Live Preview Layout */}
      {!loading && !error && (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Form Editor (2 Cols) */}
          <form onSubmit={handleSaveProfile} className="space-y-6 lg:col-span-2">
            {/* Section A: Basic Profile */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
              <div className="flex items-center gap-2.5 pb-4 border-b border-white/5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400 font-bold text-xs">
                  A
                </span>
                <h2 className="text-base font-semibold text-white">Basic Information</h2>
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="profile-name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g. Saumya Verma"
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
                      Professional Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="profile-title"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="e.g. Junior Software Engineer | Full-Stack Developer"
                      className={`mt-1.5 w-full rounded-xl border bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                        formErrors.title
                          ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                          : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                      }`}
                    />
                    {formErrors.title && (
                      <p className="mt-1 text-[11px] text-red-400">{formErrors.title}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Hero Tagline
                  </label>
                  <input
                    type="text"
                    id="profile-tagline"
                    value={formData.tagline}
                    onChange={(e) => handleChange('tagline', e.target.value)}
                    placeholder="e.g. Welcome to my portfolio"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Appears above your name in the public hero section.
                  </p>
                </div>
              </div>
            </div>

            {/* Section B: About Section Content */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
              <div className="flex items-center gap-2.5 pb-4 border-b border-white/5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400 font-bold text-xs">
                  B
                </span>
                <h2 className="text-base font-semibold text-white">About Section Content</h2>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    About Heading
                  </label>
                  <input
                    type="text"
                    id="profile-about-heading"
                    value={formData.aboutHeading}
                    onChange={(e) => handleChange('aboutHeading', e.target.value)}
                    placeholder="e.g. Building ideas into real applications."
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Hero Bio (Short Bio)
                  </label>
                  <textarea
                    rows={3}
                    id="profile-bio"
                    value={formData.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="e.g. I build modern, scalable and user-friendly web applications..."
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs leading-relaxed text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Brief introduction displayed on the homepage hero section.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Detailed About Description
                  </label>
                  <textarea
                    rows={4}
                    id="profile-about-description"
                    value={formData.aboutDescription}
                    onChange={(e) => handleChange('aboutDescription', e.target.value)}
                    placeholder="e.g. I'm a Junior Software Engineer passionate about..."
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs leading-relaxed text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Detailed narrative displayed in the public About section.
                  </p>
                </div>
              </div>
            </div>

            {/* Section C: Visual Assets & Resume */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
              <div className="flex items-center gap-2.5 pb-4 border-b border-white/5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400 font-bold text-xs">
                  C
                </span>
                <h2 className="text-base font-semibold text-white">Visual Assets & Resume</h2>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Avatar Image URL
                  </label>
                  <input
                    type="url"
                    id="profile-avatar"
                    value={formData.avatar}
                    onChange={(e) => handleChange('avatar', e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className={`mt-1.5 w-full rounded-xl border bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                      formErrors.avatar
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                    }`}
                  />
                  {formErrors.avatar && (
                    <p className="mt-1 text-[11px] text-red-400">{formErrors.avatar}</p>
                  )}
                  <p className="mt-1 text-[11px] text-slate-500">
                    Direct public URL to your portrait image. Falls back to default asset if blank or broken.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      Resume URL
                    </label>
                    {formData.resumeUrl.trim() && (
                      <a
                        href={formData.resumeUrl.trim()}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300"
                      >
                        <span>Open Link</span>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    id="profile-resume"
                    value={formData.resumeUrl}
                    onChange={(e) => handleChange('resumeUrl', e.target.value)}
                    placeholder="https://drive.google.com/... or https://example.com/resume.pdf"
                    className={`mt-1.5 w-full rounded-xl border bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                      formErrors.resumeUrl
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                    }`}
                  />
                  {formErrors.resumeUrl && (
                    <p className="mt-1 text-[11px] text-red-400">{formErrors.resumeUrl}</p>
                  )}
                  <p className="mt-1 text-[11px] text-slate-500">
                    Direct link to your CV or hosted resume file.
                  </p>
                </div>
              </div>
            </div>

            {/* Section D: Contact Information */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
              <div className="flex items-center gap-2.5 pb-4 border-b border-white/5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400 font-bold text-xs">
                  D
                </span>
                <h2 className="text-base font-semibold text-white">Contact Details</h2>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Primary Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    id="profile-email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="e.g. saumya.work84@gmail.com"
                    className={`mt-1.5 w-full rounded-xl border bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                      formErrors.email
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-[11px] text-red-400">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Location
                  </label>
                  <input
                    type="text"
                    id="profile-location"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="e.g. Greater Noida, UP, India"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Section E: Social Profiles */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
              <div className="flex items-center gap-2.5 pb-4 border-b border-white/5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400 font-bold text-xs">
                  E
                </span>
                <h2 className="text-base font-semibold text-white">Social Profiles</h2>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    GitHub Profile URL
                  </label>
                  <input
                    type="url"
                    id="profile-github"
                    value={formData.githubUrl}
                    onChange={(e) => handleChange('githubUrl', e.target.value)}
                    placeholder="https://github.com/saumyaverma11"
                    className={`mt-1.5 w-full rounded-xl border bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                      formErrors.githubUrl
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                    }`}
                  />
                  {formErrors.githubUrl && (
                    <p className="mt-1 text-[11px] text-red-400">{formErrors.githubUrl}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    id="profile-linkedin"
                    value={formData.linkedinUrl}
                    onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/in/saumya-verma"
                    className={`mt-1.5 w-full rounded-xl border bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                      formErrors.linkedinUrl
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                    }`}
                  />
                  {formErrors.linkedinUrl && (
                    <p className="mt-1 text-[11px] text-red-400">{formErrors.linkedinUrl}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Twitter / X Profile URL
                  </label>
                  <input
                    type="url"
                    id="profile-twitter"
                    value={formData.twitterUrl}
                    onChange={(e) => handleChange('twitterUrl', e.target.value)}
                    placeholder="https://x.com/your_handle"
                    className={`mt-1.5 w-full rounded-xl border bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                      formErrors.twitterUrl
                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400'
                    }`}
                  />
                  {formErrors.twitterUrl && (
                    <p className="mt-1 text-[11px] text-red-400">{formErrors.twitterUrl}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Save Button in Form Bottom */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
              >
                {isSaving ? 'Saving Profile...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>

          {/* Right Column: Live Profile Preview (1 Col) */}
          <div className="space-y-6">
            <div className="sticky top-24 rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl sm:p-7">
              {/* Preview Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    Live Preview
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">Public Hero Card</span>
              </div>

              {/* Preview Body */}
              <div className="mt-6 text-center">
                {/* Avatar Image */}
                <div className="mx-auto h-32 w-32 overflow-hidden rounded-full border-2 border-cyan-400/80 shadow-lg shadow-cyan-500/10">
                  <img
                    src={previewAvatarSrc}
                    alt={formData.name || 'Profile Avatar'}
                    onError={() => setAvatarError(true)}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Name */}
                <h3 className="mt-4 text-lg font-bold text-white">
                  {formData.name || 'Your Name'}
                </h3>

                {/* Title */}
                <p className="mt-1 text-xs font-medium text-cyan-400">
                  {formData.title || 'Professional Title'}
                </p>

                {/* Tagline */}
                {formData.tagline && (
                  <p className="mt-2 inline-block rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-0.5 text-[11px] text-slate-300">
                    {formData.tagline}
                  </p>
                )}

                {/* Location & Email */}
                <div className="mt-4 space-y-1 text-xs text-slate-400">
                  {formData.location && (
                    <div className="flex items-center justify-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{formData.location}</span>
                    </div>
                  )}

                  {formData.email && (
                    <div className="flex items-center justify-center gap-1.5 truncate">
                      <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{formData.email}</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="mx-auto my-5 h-px w-16 bg-white/10" />

                {/* Bio snippet */}
                <p className="line-clamp-3 text-xs leading-relaxed text-slate-400">
                  {formData.bio || formData.aboutDescription || 'A short biography describing your role, skills, and goals.'}
                </p>

                {/* Social Links */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 pt-2">
                  {formData.githubUrl.trim() && (
                    <a
                      href={formData.githubUrl.trim()}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-white/10 bg-slate-950/60 p-2 text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
                      title="GitHub Profile"
                    >
                      <span className="text-xs font-mono">GitHub</span>
                    </a>
                  )}

                  {formData.linkedinUrl.trim() && (
                    <a
                      href={formData.linkedinUrl.trim()}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-white/10 bg-slate-950/60 p-2 text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
                      title="LinkedIn Profile"
                    >
                      <span className="text-xs font-mono">LinkedIn</span>
                    </a>
                  )}

                  {formData.twitterUrl.trim() && (
                    <a
                      href={formData.twitterUrl.trim()}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-white/10 bg-slate-950/60 p-2 text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
                      title="Twitter / X Profile"
                    >
                      <span className="text-xs font-mono">Twitter / X</span>
                    </a>
                  )}

                  {formData.resumeUrl.trim() && (
                    <a
                      href={formData.resumeUrl.trim()}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-300 transition hover:bg-cyan-400/20"
                      title="Resume"
                    >
                      <span className="text-xs font-semibold">Resume &rarr;</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProfile;
