import { useState, useEffect } from 'react';
import portfolioService from '../services/portfolioService';

function formatPeriod(item) {
  if (item.duration) return item.duration;

  const start = item.startDate
    ? new Date(item.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    : '';
  const end = item.current
    ? 'Present'
    : item.endDate
    ? new Date(item.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    : '';

  if (start && end) return `${start} - ${end}`;
  if (start && !end) return `${start} - Present`;
  if (!start && end) return end;
  return 'Present';
}

function Experience() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    fetchExperiences();
  }, []);

  return (
    <section
      id="experience"
      className="bg-slate-100/80 px-5 py-20 text-[#0F172A] transition-colors duration-200 dark:bg-[#0F172A] dark:text-white sm:py-24 md:px-8"
    >
      <div className="reveal-on-scroll mx-auto max-w-5xl">
        {/* Section Heading */}
        <div className="mb-14 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-cyan-400 sm:text-sm">
            My journey
          </p>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Experience
          </h2>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-blue-600 dark:bg-cyan-400" />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            {[1, 2].map((skeletonId) => (
              <div
                key={skeletonId}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#111827]"
              >
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-500/20 bg-red-50 p-8 text-center dark:bg-red-950/30">
            <p className="text-base font-semibold text-red-600 dark:text-red-400">
              Unable to load experience
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <button
              type="button"
              onClick={fetchExperiences}
              className="mt-5 inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && experiences.length === 0 && (
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#111827]">
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
              No experience records available
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Career history and internships will appear here once added.
            </p>
          </div>
        )}

        {/* Timeline */}
        {!loading && !error && experiences.length > 0 && (
          <div className="relative">
            {/* Center Vertical Guide Line */}
            <div className="absolute left-3 top-0 h-full w-0.5 bg-slate-300 dark:bg-slate-700 md:left-1/2 md:-translate-x-1/2" />

            {experiences.map((experience, index) => {
              const expId = experience._id || `${experience.company}-${index}`;
              const period = formatPeriod(experience);
              const techList = Array.isArray(experience.technologies)
                ? experience.technologies
                : typeof experience.technologies === 'string' && experience.technologies
                ? experience.technologies.split(',').map((t) => t.trim())
                : [];

              return (
                <div
                  key={expId}
                  className="relative mb-10 pl-10 md:grid md:grid-cols-2 md:gap-12 md:pl-0"
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 border-slate-100 bg-blue-600 dark:border-slate-900 dark:bg-cyan-400 md:left-1/2 md:-translate-x-1/2 shadow-sm" />

                  {/* Experience Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-md dark:border-white/10 dark:bg-[#111827] dark:hover:border-cyan-400/30 md:col-span-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-xl font-bold tracking-tight text-[#0F172A] dark:text-white">
                          {experience.position || experience.role}
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-blue-600 dark:text-cyan-400">
                            {experience.company}
                          </span>
                          {experience.location && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              • {experience.location}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="w-fit rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300">
                        {period}
                      </span>
                    </div>

                    {experience.description && (
                      <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400">
                        {experience.description}
                      </p>
                    )}

                    {techList.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {techList.map((technology, techIndex) => (
                          <span
                            key={`${technology}-${techIndex}`}
                            className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {technology}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default Experience;