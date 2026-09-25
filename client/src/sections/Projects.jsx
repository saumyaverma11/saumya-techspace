import { useState, useEffect, useRef, useCallback } from 'react';
import portfolioService from '../services/portfolioService';
import analyticsService from '../services/analyticsService';

function ProjectCard({ project, onVisible }) {
  const cardRef = useRef(null);
  const projectId = project._id || project.id;
  const rawGithub = (project.githubUrl || project.github || '').trim();
  const rawLive = (project.liveUrl || project.live || '').trim();
  const isGithubVisible = project.showGithubUrl !== false && Boolean(rawGithub) && rawGithub !== '#';
  const isLiveVisible = project.showLiveUrl !== false && Boolean(rawLive) && rawLive !== '#';
  const hasAnyLink = isGithubVisible || isLiveVisible;
  const [isExpanded, setIsExpanded] = useState(false);

  const PREVIEW_LIMIT = 140;
  const description = project.description || '';
  const isLongDescription = description.length > PREVIEW_LIMIT;

  useEffect(() => {
    if (!cardRef.current || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            onVisible(project);
            observer.disconnect();
          }
        });
      },
      { threshold: [0.25] }
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, [project, onVisible]);

  const techList = Array.isArray(project.technologies)
    ? project.technologies
    : typeof project.technologies === 'string' && project.technologies
    ? project.technologies.split(',').map((t) => t.trim())
    : [];

  return (
    <article
      ref={cardRef}
      id={`project-card-${projectId}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-blue-500/40 hover:shadow-xl dark:border-white/10 dark:bg-[#111827] dark:hover:border-cyan-400/40"
    >
      {/* Project Image or Fallback Initial Header */}
      {project.image ? (
        <div className="h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={project.image}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement.innerHTML = `
                <div class="flex h-48 w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                  <span class="text-4xl font-bold text-blue-600/60 dark:text-cyan-400/60">${(project.title || 'P').charAt(0)}</span>
                </div>
              `;
            }}
          />
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center bg-slate-100 dark:bg-slate-800">
          <span className="text-4xl font-bold text-blue-600/60 dark:text-cyan-400/60">
            {(project.title || 'P').charAt(0)}
          </span>
        </div>
      )}

      {/* Project Content */}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold tracking-tight text-[#0F172A] dark:text-white">
            {project.title}
          </h3>

          <div className="flex shrink-0 items-center gap-2">
            {project.featured && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-300">
                ★ Featured
              </span>
            )}
            {project.category && (
              <span className="rounded-full border border-blue-500/20 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-400">
                {project.category}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-start">
          <p
            id={`project-desc-${projectId}`}
            className={`text-sm leading-6 text-slate-600 dark:text-slate-400 transition-all duration-200 ${
              !isExpanded && isLongDescription ? 'line-clamp-3' : ''
            }`}
          >
            {description}
          </p>

          {isLongDescription && (
            <button
              type="button"
              id={`project-toggle-${projectId}`}
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              aria-controls={`project-desc-${projectId}`}
              className="mt-2 inline-flex items-center gap-1 self-start text-xs font-semibold text-blue-600 transition hover:text-blue-500 focus-visible:outline-none focus-visible:underline dark:text-cyan-400 dark:hover:text-cyan-300"
            >
              <span>{isExpanded ? 'Read Less' : 'Read More'}</span>
              <svg
                className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Technologies Tags */}
        {techList.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {techList.map((technology, index) => (
              <span
                key={`${technology}-${index}`}
                className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-700 transition duration-150 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
              >
                {technology}
              </span>
            ))}
          </div>
        )}

        {/* Action Links */}
        {hasAnyLink && (
          <div className="mt-6 flex items-center gap-4 pt-2">
            {isGithubVisible && (
              <a
                href={rawGithub}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  analyticsService.trackProjectGithubClick(projectId, project.title);
                }}
                className="inline-flex items-center text-sm font-semibold text-slate-600 transition duration-200 hover:-translate-y-0.5 hover:text-blue-600 dark:text-slate-300 dark:hover:text-cyan-400"
              >
                GitHub &rarr;
              </a>
            )}

            {isLiveVisible && (
              <a
                href={rawLive}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  analyticsService.trackProjectLiveClick(projectId, project.title);
                }}
                className="inline-flex items-center text-sm font-semibold text-blue-600 transition duration-200 hover:-translate-y-0.5 hover:text-blue-500 dark:text-cyan-400 dark:hover:text-cyan-300"
              >
                Live Demo &rarr;
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const viewedProjectsRef = useRef(new Set());

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

  const handleProjectVisible = useCallback((proj) => {
    const id = proj._id || proj.id;
    if (id && !viewedProjectsRef.current.has(id)) {
      viewedProjectsRef.current.add(id);
      analyticsService.trackProjectView(id, proj.title);
    }
  }, []);

  return (
    <section
      id="projects"
      className="bg-[#F8FAFC] px-5 py-20 text-[#0F172A] transition-colors duration-200 dark:bg-[#0B1220] dark:text-white sm:py-24 md:px-8"
    >
      <div className="reveal-on-scroll mx-auto max-w-7xl">
        {/* Section Heading */}
        <div className="mb-14 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-cyan-400 sm:text-sm">
            My work
          </p>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Featured Projects
          </h2>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-blue-600 dark:bg-cyan-400" />

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-400">
            A selection of projects I have built while exploring full-stack engineering, scalable APIs, and modern frontend interfaces.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((skeletonId) => (
              <div
                key={skeletonId}
                className="animate-pulse overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#111827]"
              >
                <div className="h-48 bg-slate-200 dark:bg-slate-800" />
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="h-6 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="mt-5 flex gap-2">
                    <div className="h-6 w-14 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="h-6 w-14 rounded-full bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-500/20 bg-red-50 p-8 text-center dark:bg-red-950/30">
            <p className="text-base font-semibold text-red-600 dark:text-red-400">
              Unable to load projects
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <button
              type="button"
              onClick={fetchProjects}
              className="mt-5 inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && projects.length === 0 && (
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#111827]">
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No projects available</p>
            <p className="mt-1 text-sm text-slate-500">
              Projects will appear here once added in the system.
            </p>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && !error && projects.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project._id || project.id}
                project={project}
                onVisible={handleProjectVisible}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Projects;