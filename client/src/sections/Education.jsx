import { useState, useEffect } from 'react';
import portfolioService from '../services/portfolioService';

function formatEducationPeriod(item) {
  if (item.duration) return item.duration;
  if (item.startYear && item.endYear) return `${item.startYear} - ${item.endYear}`;
  if (item.startYear && item.current) return `${item.startYear} - Present`;
  if (item.startYear) return `${item.startYear}`;
  if (item.endYear) return `${item.endYear}`;
  return 'Completed';
}

function Education() {
  const [educationList, setEducationList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEducation = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portfolioService.getEducation();
      setEducationList(data || []);
    } catch (err) {
      setError(err.message || 'Unable to load education records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEducation();
  }, []);

  return (
    <section
      id="education"
      className="bg-[#F8FAFC] px-5 py-20 text-[#0F172A] transition-colors duration-200 dark:bg-[#0B1220] dark:text-white sm:py-24 md:px-8"
    >
      <div className="reveal-on-scroll mx-auto max-w-5xl">
        {/* Section Heading */}
        <div className="mb-14 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-cyan-400 sm:text-sm">
            Academic background
          </p>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Education
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
                    <div className="h-6 w-56 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="mt-5 space-y-2">
                  <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-500/20 bg-red-50 p-8 text-center dark:bg-red-950/30">
            <p className="text-base font-semibold text-red-600 dark:text-red-400">
              Unable to load education
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <button
              type="button"
              onClick={fetchEducation}
              className="mt-5 inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && educationList.length === 0 && (
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#111827]">
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
              No education records available
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Education milestones will appear here once added.
            </p>
          </div>
        )}

        {/* Education Cards */}
        {!loading && !error && educationList.length > 0 && (
          <div className="space-y-6">
            {educationList.map((item, index) => {
              const eduId = item._id || `${item.degree}-${item.institution}-${index}`;
              const period = formatEducationPeriod(item);

              return (
                <article
                  key={eduId}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-md dark:border-white/10 dark:bg-[#111827] dark:hover:border-cyan-400/40"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-[#0F172A] dark:text-white">
                        {item.degree}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-blue-600 dark:text-cyan-400">
                          {item.institution}
                        </p>
                        {item.location && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            • {item.location}
                          </span>
                        )}
                        {item.grade && (
                          <span className="rounded-md border border-blue-500/20 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300">
                            Grade: {item.grade}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="w-fit rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300">
                      {period}
                    </span>
                  </div>

                  {item.description && (
                    <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400">
                      {item.description}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default Education;