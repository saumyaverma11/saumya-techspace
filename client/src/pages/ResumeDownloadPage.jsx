import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import portfolioService from '../services/portfolioService';
import { useTheme } from '../context/ThemeContext';
import analyticsService from '../services/analyticsService';

// ANALYTICS_HOOK: resume_download_completed (Phase 27 can track here)

function ResumeDownloadPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [state, setState] = useState('validating'); // 'validating' | 'ready' | 'error'
  const [resumeUrl, setResumeUrl] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState(''); // 'expired' | 'invalid' | 'pending' | 'rejected' | 'generic'
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorType('invalid');
      setErrorMessage('No download token provided.');
      return;
    }

    let isMounted = true;
    portfolioService
      .validateDownloadToken(token)
      .then((data) => {
        if (!isMounted) return;
        setResumeUrl(data.resumeUrl);
        setVisitorName(data.visitorName || '');
        setState('ready');
      })
      .catch((err) => {
        if (!isMounted) return;
        const msg = err.message || 'An error occurred.';
        const lower = msg.toLowerCase();

        if (lower.includes('expired')) {
          setErrorType('expired');
        } else if (lower.includes('pending')) {
          setErrorType('pending');
        } else if (lower.includes('declined') || lower.includes('rejected')) {
          setErrorType('rejected');
        } else {
          setErrorType('invalid');
        }

        setErrorMessage(msg);
        setState('error');
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleDownload = async () => {
    if (resumeUrl) {
      // ANALYTICS_HOOK: resume_download_completed (Phase 27)
      // Accurately tracks when the authorized visitor clicks "Open & Download Resume"
      analyticsService.trackResumeDownloadCompleted();

      setDownloading(true);
      try {
        const response = await fetch(resumeUrl);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'Saumya_Verma_Resume.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
      } catch (err) {
        console.warn('Direct blob download notice, falling back to window.open:', err.message);
        window.open(resumeUrl, '_blank', 'noopener,noreferrer');
      } finally {
        setDownloading(false);
      }
    }
  };

  const bgClass = isDark ? 'bg-[#0B1220] text-white' : 'bg-[#F8FAFC] text-[#0F172A]';
  const cardClass = isDark
    ? 'border-white/10 bg-[#111827]'
    : 'border-slate-200 bg-white shadow-sm';

  return (
    <div className={`flex min-h-screen flex-col transition-colors duration-200 ${bgClass}`}>
      {/* Top Bar */}
      <header
        className={`sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 backdrop-blur-md sm:px-6 ${
          isDark ? 'border-white/10 bg-[#0B1220]/90' : 'border-slate-200 bg-white/90'
        }`}
      >
        <button
          id="download-back-btn"
          type="button"
          onClick={() => navigate('/')}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition hover:-translate-y-0.5 ${
            isDark ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Portfolio
        </button>

        <span
          className={`text-xs font-semibold uppercase tracking-widest ${
            isDark ? 'text-cyan-400' : 'text-blue-600'
          }`}
        >
          Saumya TechSpace
        </span>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className={`w-full max-w-md rounded-2xl border p-8 text-center ${cardClass}`}>
          {/* Validating */}
          {state === 'validating' && (
            <div className="flex flex-col items-center gap-4">
              <svg
                className={`h-10 w-10 animate-spin ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <div>
                <h1 className="text-lg font-semibold">Validating Access</h1>
                <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Verifying your download authorization...
                </p>
              </div>
            </div>
          )}

          {/* Ready — download available */}
          {state === 'ready' && (
            <div className="flex flex-col items-center gap-4">
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full ${
                  isDark ? 'bg-emerald-400/10' : 'bg-emerald-100'
                }`}
              >
                <svg
                  className="h-8 w-8 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>

              <div>
                <h1 className="text-xl font-bold">
                  Download Access Approved
                </h1>
                {visitorName && (
                  <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Welcome, <strong className={isDark ? 'text-cyan-400' : 'text-blue-600'}>{visitorName}</strong>
                  </p>
                )}
                <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Your download request has been approved. Click the button below to open and download the resume.
                </p>
              </div>

              <button
                id="resume-download-btn"
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:opacity-50 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
              >
                {downloading ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Preparing Download...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Open &amp; Download Resume
                  </>
                )}
              </button>

              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                This link has a limited validity period. After expiry, a new request is needed.
              </p>

              <div
                className={`w-full rounded-xl border px-4 py-3 text-left text-xs ${
                  isDark ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' : 'border-amber-300 bg-amber-50 text-amber-700'
                }`}
              >
                <strong>Note:</strong> This link grants you access to view and download the resume. The link is personal and intended for your use only.
              </div>
            </div>
          )}

          {/* Error */}
          {state === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full ${
                  errorType === 'expired'
                    ? isDark ? 'bg-amber-400/10' : 'bg-amber-100'
                    : errorType === 'pending'
                    ? isDark ? 'bg-blue-400/10' : 'bg-blue-100'
                    : isDark ? 'bg-red-400/10' : 'bg-red-100'
                }`}
              >
                {errorType === 'expired' ? (
                  <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : errorType === 'pending' ? (
                  <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </span>

              <div>
                <h1 className="text-xl font-bold">
                  {errorType === 'expired'
                    ? 'Link Expired'
                    : errorType === 'pending'
                    ? 'Request Pending'
                    : errorType === 'rejected'
                    ? 'Request Not Approved'
                    : 'Access Denied'}
                </h1>
                <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {errorMessage}
                </p>
              </div>

              {(errorType === 'expired' || errorType === 'invalid') && (
                <button
                  id="download-new-request-btn"
                  type="button"
                  onClick={() => navigate('/resume')}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
                >
                  Submit New Request
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('/')}
                className={`text-sm font-medium transition ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Return to Portfolio
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ResumeDownloadPage;
