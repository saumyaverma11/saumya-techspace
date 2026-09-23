import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import portfolioService from '../services/portfolioService';
import ResumeRequestModal from '../components/ResumeRequestModal';
import { useTheme } from '../context/ThemeContext';
import analyticsService from '../services/analyticsService';

// Configure PDF.js worker using Vite asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function ResumePage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [resumeUrl, setResumeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // PDF.js State
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [pdfRendering, setPdfRendering] = useState(false);
  const [pdfLoadError, setPdfLoadError] = useState(null);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const renderTaskRef = useRef(null);
  const isMountedRef = useRef(true);

  // Track initial view
  useEffect(() => {
    // ANALYTICS_HOOK: resume_view (Phase 27)
    analyticsService.trackResumeView();

    isMountedRef.current = true;
    let activeLoadingTask = null;

    portfolioService
      .getProfile()
      .then(async (data) => {
        if (!isMountedRef.current) return;
        const fetchedUrl = data?.resumeUrl || '';
        setResumeUrl(fetchedUrl);

        if (fetchedUrl) {
          try {
            // Fetch bytes via CORS (Cloudinary allows *)
            const res = await fetch(fetchedUrl);
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            const arrayBuffer = await res.arrayBuffer();

            if (!isMountedRef.current) return;

            // Load document in PDF.js using byte array
            activeLoadingTask = pdfjsLib.getDocument({
              data: new Uint8Array(arrayBuffer),
              cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/cmaps/',
              cMapPacked: true,
            });

            const loadedPdf = await activeLoadingTask.promise;
            if (isMountedRef.current) {
              setPdfDoc(loadedPdf);
              setNumPages(loadedPdf.numPages);
              setPageNum(1);
              setLoading(false);
            }
          } catch (err) {
            console.error('Failed to load PDF via PDF.js:', err);
            if (isMountedRef.current) {
              setPdfLoadError('Could not process PDF document.');
              setLoading(false);
            }
          }
        } else {
          if (isMountedRef.current) {
            setLoading(false);
          }
        }
      })
      .catch((err) => {
        if (isMountedRef.current) {
          setError(err.message || 'Failed to load profile.');
          setLoading(false);
        }
      });

    return () => {
      isMountedRef.current = false;
      if (activeLoadingTask) {
        try {
          activeLoadingTask.destroy();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  // Page rendering callback
  const renderPage = useCallback(
    async (pageNumber, currentScale) => {
      if (!pdfDoc || !canvasRef.current) return;

      // Cancel ongoing render if any
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }

      setPdfRendering(true);

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: currentScale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const context = canvas.getContext('2d');
        const transform = pixelRatio !== 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : null;

        const renderContext = {
          canvasContext: context,
          viewport,
          transform,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Error rendering PDF page:', err);
        }
      } finally {
        if (isMountedRef.current) {
          setPdfRendering(false);
        }
      }
    },
    [pdfDoc]
  );

  // Trigger page render when pageNum or scale changes
  useEffect(() => {
    if (pdfDoc && pageNum > 0) {
      renderPage(pageNum, scale);
    }
  }, [pdfDoc, pageNum, scale, renderPage]);

  // Initial fit width calculation on document load
  useEffect(() => {
    if (pdfDoc && containerRef.current) {
      pdfDoc
        .getPage(1)
        .then((page) => {
          const unscaledViewport = page.getViewport({ scale: 1.0 });
          const containerWidth = containerRef.current?.clientWidth || 800;
          const availableWidth = Math.max(containerWidth - 48, 280);
          const calculatedScale = Math.min(Math.max(availableWidth / unscaledViewport.width, 0.7), 1.6);
          setScale(Number(calculatedScale.toFixed(2)));
        })
        .catch(() => {});
    }
  }, [pdfDoc]);

  const handlePrevPage = () => {
    if (pageNum > 1) {
      setPageNum((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (pageNum < numPages) {
      setPageNum((prev) => prev + 1);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(Number((prev + 0.15).toFixed(2)), 2.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(Number((prev - 0.15).toFixed(2)), 0.6));
  };

  const handleFitWidth = async () => {
    if (!pdfDoc || !containerRef.current) return;
    try {
      const page = await pdfDoc.getPage(pageNum);
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const containerWidth = containerRef.current.clientWidth;
      const availableWidth = Math.max(containerWidth - 48, 280);
      const calculatedScale = Math.min(Math.max(availableWidth / unscaledViewport.width, 0.6), 2.5);
      setScale(Number(calculatedScale.toFixed(2)));
    } catch {
      setScale(1.0);
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDark ? 'bg-[#0B1220] text-white' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
    >
      {/* Top Navigation Bar */}
      <header
        className={`sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 backdrop-blur-md sm:px-6 ${
          isDark
            ? 'border-white/10 bg-[#0B1220]/90'
            : 'border-slate-200 bg-white/90'
        }`}
      >
        <button
          id="resume-back-btn"
          type="button"
          onClick={() => navigate('/')}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition hover:-translate-y-0.5 ${
            isDark
              ? 'text-slate-300 hover:bg-white/10 hover:text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Portfolio
        </button>

        <div className="flex items-center gap-2">
          <span
            className={`hidden text-xs font-semibold uppercase tracking-widest sm:inline ${
              isDark ? 'text-cyan-400' : 'text-blue-600'
            }`}
          >
            Saumya TechSpace
          </span>
          <span className={`hidden text-xs sm:inline ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>
            /
          </span>
          <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Resume
          </span>
        </div>

        <button
          id="resume-request-download-top-btn"
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
          </svg>
          Request Download
        </button>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Page Heading */}
        <div className="mb-6 text-center">
          <p
            className={`mb-1 text-xs font-bold uppercase tracking-[0.25em] ${
              isDark ? 'text-cyan-400' : 'text-blue-600'
            }`}
          >
            Professional Document
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Resume Viewer
          </h1>
          <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            You can view the resume below. To download a copy, submit a request.
          </p>
          <div
            className={`mx-auto mt-4 h-1 w-12 rounded-full ${
              isDark ? 'bg-cyan-400' : 'bg-blue-600'
            }`}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <svg
                className={`h-8 w-8 animate-spin ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Loading resume...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div
            className={`flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border p-8 text-center ${
              isDark ? 'border-white/10 bg-[#111827]' : 'border-slate-200 bg-white shadow-sm'
            }`}
          >
            <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <h2 className="mb-2 text-lg font-semibold">Unable to Load Resume</h2>
            <p className={`mb-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {error}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={`rounded-full border px-5 py-2 text-sm font-medium transition hover:-translate-y-0.5 ${
                isDark
                  ? 'border-white/10 text-slate-300 hover:border-white/20 hover:text-white'
                  : 'border-slate-300 text-slate-600 hover:border-slate-400'
              }`}
            >
              Try Again
            </button>
          </div>
        )}

        {/* No Resume State */}
        {!loading && !error && !resumeUrl && (
          <div
            className={`flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border p-8 text-center ${
              isDark ? 'border-white/10 bg-[#111827]' : 'border-slate-200 bg-white shadow-sm'
            }`}
          >
            <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 dark:bg-cyan-400/10">
              <svg
                className={`h-8 w-8 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <h2 className="mb-2 text-lg font-semibold">Resume Not Available</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              The resume has not been uploaded yet. Please check back later.
            </p>
          </div>
        )}

        {/* PDF Viewer */}
        {!loading && !error && resumeUrl && (
          <div
            className={`overflow-hidden rounded-2xl border shadow-xl ${
              isDark ? 'border-white/10' : 'border-slate-200'
            }`}
          >
            {/* Viewer Toolbar */}
            <div
              className={`flex items-center justify-between border-b px-4 py-3 ${
                isDark
                  ? 'border-white/10 bg-[#111827]'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg
                  className={`h-4 w-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  Saumya Verma — Resume
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    isDark ? 'bg-cyan-400/10 text-cyan-400' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  View Only
                </span>
                <button
                  id="resume-request-download-inline-btn"
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition hover:-translate-y-0.5 ${
                    isDark
                      ? 'bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20'
                      : 'bg-blue-600/10 text-blue-600 hover:bg-blue-600/20'
                  }`}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
                  </svg>
                  Request Download
                </button>
              </div>
            </div>

            {/* Custom View-Only Viewer Controls */}
            <div
              className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 ${
                isDark ? 'border-white/10 bg-[#0E1726]' : 'border-slate-200 bg-slate-100/70'
              }`}
            >
              {/* Page Navigation */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  id="pdf-prev-page-btn"
                  onClick={handlePrevPage}
                  disabled={pageNum <= 1 || pdfRendering}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 active:bg-white/15'
                      : 'border-slate-300 bg-white text-slate-700 shadow-xs hover:bg-slate-100 active:bg-slate-200'
                  }`}
                  title="Previous Page"
                  aria-label="Previous Page"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <span
                  id="pdf-page-indicator"
                  className={`px-2 text-xs font-medium tabular-nums ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Page <strong className={isDark ? 'text-white' : 'text-slate-900'}>{pageNum}</strong> / {numPages || 1}
                </span>

                <button
                  type="button"
                  id="pdf-next-page-btn"
                  onClick={handleNextPage}
                  disabled={pageNum >= numPages || pdfRendering}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 active:bg-white/15'
                      : 'border-slate-300 bg-white text-slate-700 shadow-xs hover:bg-slate-100 active:bg-slate-200'
                  }`}
                  title="Next Page"
                  aria-label="Next Page"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Zoom & Fit Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  id="pdf-zoom-out-btn"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.6 || pdfRendering}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 active:bg-white/15'
                      : 'border-slate-300 bg-white text-slate-700 shadow-xs hover:bg-slate-100 active:bg-slate-200'
                  }`}
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>

                <span
                  id="pdf-zoom-indicator"
                  className={`min-w-[48px] text-center text-xs font-medium tabular-nums ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  {Math.round(scale * 100)}%
                </span>

                <button
                  type="button"
                  id="pdf-zoom-in-btn"
                  onClick={handleZoomIn}
                  disabled={scale >= 2.5 || pdfRendering}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 active:bg-white/15'
                      : 'border-slate-300 bg-white text-slate-700 shadow-xs hover:bg-slate-100 active:bg-slate-200'
                  }`}
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>

                <button
                  type="button"
                  id="pdf-fit-width-btn"
                  onClick={handleFitWidth}
                  disabled={pdfRendering}
                  className={`hidden sm:inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                      : 'border-slate-300 bg-white text-slate-700 shadow-xs hover:bg-slate-100'
                  }`}
                  title="Fit to Width"
                >
                  Fit Width
                </button>
              </div>
            </div>

            {/* Error fallback within viewer if PDF processing fails */}
            {pdfLoadError ? (
              <div
                className={`flex h-[70vh] flex-col items-center justify-center gap-4 p-8 text-center ${
                  isDark ? 'bg-[#111827]' : 'bg-slate-50'
                }`}
              >
                <svg className="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    PDF document could not be rendered in the browser.
                  </p>
                  <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    You can request a download copy below.
                  </p>
                </div>
                <button
                  type="button"
                  id="resume-request-download-fallback-btn"
                  onClick={() => setModalOpen(true)}
                  className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
                >
                  Request Download
                </button>
              </div>
            ) : (
              /* Canvas Container */
              <div
                ref={containerRef}
                className={`relative flex min-h-[70vh] items-start justify-center overflow-auto p-4 select-none sm:p-6 ${
                  isDark ? 'bg-[#0B1220]/60' : 'bg-slate-100/60'
                }`}
                onContextMenu={(e) => e.preventDefault()}
              >
                {pdfRendering && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                    <div
                      className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium shadow-md ${
                        isDark ? 'border border-white/10 bg-[#111827] text-cyan-400' : 'border border-slate-200 bg-white text-blue-600'
                      }`}
                    >
                      <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Rendering page {pageNum}...
                    </div>
                  </div>
                )}

                {/* PDF Canvas */}
                <canvas
                  ref={canvasRef}
                  id="resume-pdf-canvas"
                  className="max-w-full rounded-sm bg-white shadow-2xl transition-all duration-150"
                />
              </div>
            )}
          </div>
        )}

        {/* Bottom CTA Banner */}
        {!loading && !error && resumeUrl && (
          <div
            className={`mt-6 rounded-2xl border px-6 py-5 ${
              isDark ? 'border-white/10 bg-[#111827]' : 'border-slate-200 bg-white shadow-sm'
            }`}
          >
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Want a copy of this resume?
                </h3>
                <p className={`mt-0.5 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Submit a download request and you'll receive a secure link via email after review.
                </p>
              </div>
              <button
                id="resume-request-download-bottom-btn"
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex shrink-0 items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-blue-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                Request Download Access
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Request Modal */}
      <ResumeRequestModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

export default ResumePage;
