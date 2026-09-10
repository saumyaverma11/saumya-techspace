import { useState, useEffect } from 'react';
import portfolioService from '../services/portfolioService';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <section
      id="projects"
      className="bg-slate-950 px-5 py-20 text-white sm:py-24 md:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            My work
          </p>

          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            Featured Projects
          </h2>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-cyan-400" />

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            A selection of projects I have worked on while learning,
            experimenting and building real-world applications.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((skeletonId) => (
              <div
                key={skeletonId}
                className="animate-pulse overflow-hidden rounded-3xl border border-white/10 bg-slate-900"
              >
                <div className="h-48 bg-slate-800" />
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="h-6 w-1/2 rounded bg-slate-800" />
                    <div className="h-5 w-16 rounded-full bg-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-slate-800" />
                    <div className="h-4 w-5/6 rounded bg-slate-800" />
                    <div className="h-4 w-2/3 rounded bg-slate-800" />
                  </div>
                  <div className="mt-5 flex gap-2">
                    <div className="h-6 w-14 rounded-full bg-slate-800" />
                    <div className="h-6 w-14 rounded-full bg-slate-800" />
                    <div className="h-6 w-14 rounded-full bg-slate-800" />
                  </div>
                  <div className="mt-6 flex gap-4">
                    <div className="h-4 w-16 rounded bg-slate-800" />
                    <div className="h-4 w-20 rounded bg-slate-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-500/20 bg-red-950/30 p-8 text-center">
            <p className="text-base font-medium text-red-400">
              Unable to load projects
            </p>
            <p className="mt-2 text-sm text-slate-400">{error}</p>
            <button
              type="button"
              onClick={fetchProjects}
              className="mt-5 inline-flex items-center rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && projects.length === 0 && (
          <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-900/50 p-8 text-center">
            <p className="text-lg font-medium text-slate-300">No projects available</p>
            <p className="mt-2 text-sm text-slate-500">
              Projects will appear here once added in the system.
            </p>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && !error && projects.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const techList = Array.isArray(project.technologies)
                ? project.technologies
                : typeof project.technologies === 'string' && project.technologies
                ? project.technologies.split(',').map((t) => t.trim())
                : [];

              const githubUrl = project.githubUrl || project.github || '#';
              const liveUrl = project.liveUrl || project.live || '#';
              const projectId = project._id || project.id;

              return (
                <article
                  key={projectId}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900 transition duration-300 hover:-translate-y-2 hover:border-cyan-400/40"
                >
                  {/* Project Image or Initial Badge */}
                  {project.image ? (
                    <div className="h-48 w-full overflow-hidden bg-slate-800">
                      <img
                        src={project.image}
                        alt={project.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement.innerHTML = `
                            <div class="flex h-48 w-full items-center justify-center bg-slate-800">
                              <span class="text-4xl font-bold text-cyan-400/60">${(project.title || 'P').charAt(0)}</span>
                            </div>
                          `;
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-slate-800">
                      <span className="text-4xl font-bold text-cyan-400/60">
                        {(project.title || 'P').charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Project Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-xl font-semibold">{project.title}</h3>

                      <div className="flex items-center gap-2">
                        {project.featured && (
                          <span className="rounded-full bg-yellow-400/10 px-2.5 py-0.5 text-xs font-medium text-yellow-300">
                            ★ Featured
                          </span>
                        )}
                        {project.category && (
                          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-400">
                            {project.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="min-h-[84px] flex-1 text-sm leading-6 text-slate-400">
                      {project.description}
                    </p>

                    {/* Technologies */}
                    {techList.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {techList.map((technology, index) => (
                          <span
                            key={`${technology}-${index}`}
                            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
                          >
                            {technology}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Links */}
                    <div className="mt-6 flex gap-4 pt-2">
                      <a
                        href={githubUrl}
                        target={githubUrl !== '#' ? '_blank' : undefined}
                        rel="noreferrer"
                        className="text-sm font-medium text-slate-300 transition hover:text-cyan-400"
                      >
                        GitHub →
                      </a>

                      <a
                        href={liveUrl}
                        target={liveUrl !== '#' ? '_blank' : undefined}
                        rel="noreferrer"
                        className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                      >
                        Live Demo →
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default Projects;