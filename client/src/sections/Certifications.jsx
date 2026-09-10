import { useState, useEffect } from 'react';
import portfolioService from '../services/portfolioService';

function formatIssueDate(item) {
  if (item.year) return item.year;
  if (!item.issueDate) return '';
  try {
    const d = new Date(item.issueDate);
    if (!isNaN(d.getTime())) {
      return d.getFullYear().toString();
    }
  } catch {
    // fallback to string representation
  }
  return String(item.issueDate);
}

function Certifications() {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCertifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portfolioService.getCertifications();
      setCertifications(data || []);
    } catch (err) {
      setError(err.message || 'Unable to load certifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertifications();
  }, []);

  return (
    <section
      id="certifications"
      className="bg-slate-900 px-5 py-20 text-white sm:py-24 md:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Credentials
          </p>

          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            Certifications
          </h2>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-cyan-400" />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((skeletonId) => (
              <div
                key={skeletonId}
                className="animate-pulse rounded-2xl border border-white/10 bg-slate-950 p-6"
              >
                <div className="mb-5 h-12 w-12 rounded-xl bg-slate-800" />
                <div className="h-5 w-3/4 rounded bg-slate-800" />
                <div className="mt-3 h-4 w-1/2 rounded bg-slate-800" />
                <div className="mt-2 h-3 w-1/4 rounded bg-slate-800" />
                <div className="mt-5 h-4 w-28 rounded bg-slate-800" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-500/20 bg-red-950/30 p-8 text-center">
            <p className="text-base font-medium text-red-400">
              Unable to load certifications
            </p>
            <p className="mt-2 text-sm text-slate-400">{error}</p>
            <button
              type="button"
              onClick={fetchCertifications}
              className="mt-5 inline-flex items-center rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && certifications.length === 0 && (
          <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-950 p-8 text-center">
            <p className="text-lg font-medium text-slate-300">No certifications available</p>
            <p className="mt-2 text-sm text-slate-500">Certifications will appear here once added.</p>
          </div>
        )}

        {/* Certification Grid */}
        {!loading && !error && certifications.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {certifications.map((certification, index) => {
              const certId =
                certification._id ||
                `${certification.name || certification.title}-${certification.issuer}-${index}`;
              const year = formatIssueDate(certification);
              const credentialUrl =
                certification.credentialUrl || certification.credential || '#';
              const name = certification.name || certification.title;

              return (
                <article
                  key={certId}
                  className="group flex flex-col rounded-2xl border border-white/10 bg-slate-950 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40"
                >
                  {/* Icon */}
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-xl text-cyan-400">
                    ✓
                  </div>

                  <h3 className="text-lg font-semibold">{name}</h3>

                  <p className="mt-2 text-sm text-cyan-400">
                    {certification.issuer}
                  </p>

                  {year && (
                    <p className="mt-1 text-xs text-slate-500">{year}</p>
                  )}

                  {certification.credentialId && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      ID: {certification.credentialId}
                    </p>
                  )}

                  {certification.description && (
                    <p className="mt-3 flex-1 text-xs leading-5 text-slate-400">
                      {certification.description}
                    </p>
                  )}

                  <div className="mt-auto pt-4">
                    <a
                      href={credentialUrl}
                      target={credentialUrl !== '#' ? '_blank' : undefined}
                      rel="noreferrer"
                      className="inline-block text-sm text-slate-300 transition hover:text-cyan-400"
                    >
                      View Credential →
                    </a>
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

export default Certifications;