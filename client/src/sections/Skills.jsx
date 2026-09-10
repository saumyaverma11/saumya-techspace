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
      className="bg-slate-900 px-5 py-20 text-white sm:py-24 md:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            What I work with
          </p>

          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            Skills & Technologies
          </h2>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-cyan-400" />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((skeletonId) => (
              <div
                key={skeletonId}
                className="animate-pulse rounded-2xl border border-white/10 bg-slate-950 p-6"
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
            <p className="text-base font-medium text-red-400">Unable to load skills</p>
            <p className="mt-2 text-sm text-slate-400">{error}</p>
            <button
              type="button"
              onClick={fetchSkills}
              className="mt-5 inline-flex items-center rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && skills.length === 0 && (
          <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-950 p-8 text-center">
            <p className="text-lg font-medium text-slate-300">No skills available</p>
            <p className="mt-2 text-sm text-slate-500">Skills list is currently empty.</p>
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
                  className="group rounded-2xl border border-white/10 bg-slate-950 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{skill.name}</h3>

                      {skill.category && (
                        <p className="mt-1 text-sm text-slate-400">
                          {skill.category}
                        </p>
                      )}
                    </div>

                    {skill.level && (
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-400">
                        {skill.level}
                      </span>
                    )}
                  </div>

                  {/* Progress indicator */}
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-cyan-400 transition-all duration-500"
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