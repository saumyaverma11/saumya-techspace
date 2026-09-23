import { useState, useEffect, useRef, useCallback } from 'react';
import portfolioService from '../services/portfolioService';
import analyticsService from '../services/analyticsService';

function formatIssueDate(item) {
  if (item.year) return item.year;
  if (!item.issueDate) return '';
  try {
    const d = new Date(item.issueDate);
    if (!isNaN(d.getTime())) {
      return d.getFullYear().toString();
    }
  } catch {
    // fallback
  }
  return String(item.issueDate);
}

function CertificationCard({ certification, index, onVisible }) {
  const cardRef = useRef(null);
  const certId =
    certification._id ||
    `${certification.name || certification.title}-${certification.issuer}-${index}`;
  const year = formatIssueDate(certification);
  const credentialUrl = certification.credentialUrl || certification.credential || '#';
  const name = certification.name || certification.title;

  useEffect(() => {
    if (!cardRef.current || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            onVisible(certId, name);
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
  }, [certId, name, onVisible]);

  return (
    <article
      ref={cardRef}
      id={`cert-card-${certId}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-md dark:border-white/10 dark:bg-[#111827] dark:hover:border-cyan-400/40"
    >
      {/* Certificate Image or Badge Icon */}
      {certification.image ? (
        <div className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-white/10 aspect-[16/10]">
          <img
            src={certification.image}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-50 text-xl font-bold text-blue-600 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      <h3 className="text-lg font-bold tracking-tight text-[#0F172A] dark:text-white">
        {name}
      </h3>

      <p className="mt-1.5 text-sm font-semibold text-blue-600 dark:text-cyan-400">
        {certification.issuer}
      </p>

      {year && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Issued: {year}
        </p>
      )}

      {certification.credentialId && (
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 truncate">
          ID: {certification.credentialId}
        </p>
      )}

      {certification.description && (
        <p className="mt-3 flex-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
          {certification.description}
        </p>
      )}

      <div className="mt-auto pt-4">
        <a
          href={credentialUrl}
          target={credentialUrl !== '#' ? '_blank' : undefined}
          rel="noreferrer"
          className="inline-block text-xs font-semibold text-blue-600 transition duration-200 hover:-translate-y-0.5 hover:text-blue-500 dark:text-cyan-400 dark:hover:text-cyan-300"
        >
          View Credential &rarr;
        </a>
      </div>
    </article>
  );
}

function Certifications() {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const viewedCertsRef = useRef(new Set());

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

  const handleCertVisible = useCallback((certId, certName) => {
    if (certId && !viewedCertsRef.current.has(certId)) {
      viewedCertsRef.current.add(certId);
      analyticsService.trackCertificateView(certId, certName);
    }
  }, []);

  return (
    <section
      id="certifications"
      className="bg-slate-100/80 px-5 py-20 text-[#0F172A] transition-colors duration-200 dark:bg-[#0F172A] dark:text-white sm:py-24 md:px-8"
    >
      <div className="reveal-on-scroll mx-auto max-w-7xl">
        {/* Section Heading */}
        <div className="mb-14 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-cyan-400 sm:text-sm">
            Credentials
          </p>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Certifications
          </h2>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-blue-600 dark:bg-cyan-400" />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((skeletonId) => (
              <div
                key={skeletonId}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#111827]"
              >
                <div className="mb-5 h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="mt-3 h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="mt-2 h-3 w-1/4 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-500/20 bg-red-50 p-8 text-center dark:bg-red-950/30">
            <p className="text-base font-semibold text-red-600 dark:text-red-400">
              Unable to load certifications
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <button
              type="button"
              onClick={fetchCertifications}
              className="mt-5 inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && certifications.length === 0 && (
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#111827]">
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
              No certifications available
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Certifications and verified badges will appear here once added.
            </p>
          </div>
        )}

        {/* Certification Grid */}
        {!loading && !error && certifications.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {certifications.map((certification, index) => (
              <CertificationCard
                key={
                  certification._id ||
                  `${certification.name || certification.title}-${certification.issuer}-${index}`
                }
                certification={certification}
                index={index}
                onVisible={handleCertVisible}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Certifications;