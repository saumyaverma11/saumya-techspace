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
      className="bg-slate-950 px-5 py-20 text-white sm:py-24 md:px-8"
    >
      <div className="mx-auto max-w-5xl">
        {/* Heading */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Academic background
          </p>

          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            Education
          </h2>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-cyan-400" />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            {[1, 2].map((skeletonId) => (
              <div
                key={skeletonId}
                className="animate-pulse rounded-2xl border border-white/10 bg-slate-900 p-6"
              >
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <div className="h-6 w-56 rounded bg-slate-800" />
                    <div className="h-4 w-40 rounded bg-slate-800" />
                  </div>
                  <div className="h-6 w-24 rounded-full bg-slate-800" />
                </div>
                <div className="mt-5 space-y-2">
                  <div className="h-4 w-full rounded bg-slate-800" />
                  <div className="h-4 w-4/5 rounded bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-500/20 bg-red-950/30 p-8 text-center">
            <p className="text-base font-medium text-red-400">
              Unable to load education
            </p>
            <p className="mt-2 text-sm text-slate-400">{error}</p>
            <button
              type="button"
              onClick={fetchEducation}
              className="mt-5 inline-flex items-center rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && educationList.length === 0 && (
          <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-900/50 p-8 text-center">
            <p className="text-lg font-medium text-slate-300">No education records available</p>
            <p className="mt-2 text-sm text-slate-500">Education history will appear here once added.</p>
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
                  className="rounded-2xl border border-white/10 bg-slate-900 p-6 transition duration-300 hover:border-cyan-400/40"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{item.degree}</h3>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className="text-cyan-400">{item.institution}</p>
                        {item.location && (
                          <span className="text-xs text-slate-400">• {item.location}</span>
                        )}
                        {item.grade && (
                          <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-300">
                            Grade: {item.grade}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="w-fit rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-400">
                      {period}
                    </span>
                  </div>

                  {item.description && (
                    <p className="mt-5 text-sm leading-7 text-slate-400">
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