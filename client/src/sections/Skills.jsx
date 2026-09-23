import { useState, useEffect } from 'react';
import portfolioService from '../services/portfolioService';

function getSkillPercentage(level) {
  if (typeof level === 'number') return `${Math.min(100, Math.max(0, level))}%`;
  if (!level) return '65%';

  const str = String(level).trim();
  if (str.endsWith('%')) return str;
  if (!isNaN(Number(str))) return `${Math.min(100, Math.max(0, Number(str)))}%`;

  const lower = str.toLowerCase();
  if (lower.includes('expert') || lower.includes('master')) return '95%';
  if (lower.includes('advanced')) return '85%';
  if (lower.includes('intermediate') || lower.includes('mid')) return '65%';
  if (lower.includes('beginner') || lower.includes('basic')) return '45%';

  return '70%';
}

function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <section
      id="skills"
      className="bg-slate-100/80 px-5 py-20 text-[#0F172A] transition-colors duration-200 dark:bg-[#0F172A] dark:text-white sm:py-24 md:px-8"
    >
      <div className="reveal-on-scroll mx-auto max-w-7xl">
        {/* Section Heading */}
        <div className="mb-14 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-cyan-400 sm:text-sm">
            What I work with
          </p>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Skills & Technologies
          </h2>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-blue-600 dark:bg-cyan-400" />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((skeletonId) => (
              <div
                key={skeletonId}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#111827]"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="mt-5 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-500/20 bg-red-50 p-8 text-center dark:bg-red-950/30">
            <p className="text-base font-semibold text-red-600 dark:text-red-400">
              Unable to load skills
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <button
              type="button"
              onClick={fetchSkills}
              className="mt-5 inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && skills.length === 0 && (
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#111827]">
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
              No skills available
            </p>
            <p className="mt-1 text-sm text-slate-500">Skills list is currently empty.</p>
          </div>
        )}

        {/* Skills Grid */}
        {!loading && !error && skills.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill) => {
              const skillId = skill._id || skill.name;
              const width = getSkillPercentage(skill.level);

              return (
                <div
                  key={skillId}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-md dark:border-white/10 dark:bg-[#111827] dark:hover:border-cyan-400/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">
                        {skill.name}
                      </h3>

                      {skill.category && (
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {skill.category}
                        </p>
                      )}
                    </div>

                    {skill.level && (
                      <span className="rounded-full border border-blue-500/20 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-400">
                        {skill.level}
                      </span>
                    )}
                  </div>

                  {/* Visual Progress Indicator */}
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500 dark:from-blue-500 dark:to-cyan-400"
                      style={{ width }}
                    />
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

export default Skills;