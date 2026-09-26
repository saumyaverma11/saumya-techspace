import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import analyticsService from '../services/analyticsService';

const SECTIONS = [
  'hero',
  'about',
  'skills',
  'projects',
  'experience',
  'education',
  'certifications',
  'contact'
];

const SCROLL_MILESTONES = [25, 50, 75, 90, 100];

/**
 * useAnalytics Hook
 * Automatically handles:
 * - SPA page_view tracking on route changes without duplicate re-render triggers
 * - Section visibility (section_view) via IntersectionObserver (once per section per session/page)
 * - Scroll depth milestones (25%, 50%, 75%, 90%, 100%) (once per milestone per session/page)
 */
export function useAnalytics() {
  const location = useLocation();
  const lastTrackedPathRef = useRef(null);
  const trackedSectionsRef = useRef(new Set());
  const trackedMilestonesRef = useRef(new Set());

  // 1. Page View Tracking
  useEffect(() => {
    const currentPath = location.pathname;

    // Exclude internal admin console routes from public telemetry
    if (currentPath.startsWith('/admin')) {
      return;
    }

    // Avoid duplicate page_view events on component re-renders for the same route
    if (lastTrackedPathRef.current !== currentPath) {
      lastTrackedPathRef.current = currentPath;
      analyticsService.trackPageView(currentPath);

      // Reset section and scroll tracking for each new route navigation
      trackedSectionsRef.current.clear();
      trackedMilestonesRef.current.clear();
    }
  }, [location.pathname]);

  // 2. Section Visibility Tracking via IntersectionObserver
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
            const sectionId = entry.target.id;
            if (sectionId && !trackedSectionsRef.current.has(sectionId)) {
              trackedSectionsRef.current.add(sectionId);
              analyticsService.trackSectionView(sectionId);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: [0.2, 0.5]
      }
    );

    // Observe all major portfolio sections that exist in the DOM
    const observedElements = [];
    SECTIONS.forEach((sectionId) => {
      // Elements can have id="hero" or id="home"
      const el =
        document.getElementById(sectionId) ||
        (sectionId === 'hero' ? document.getElementById('home') : null);
      if (el) {
        observer.observe(el);
        observedElements.push(el);
      }
    });

    return () => {
      observedElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [location.pathname]);

  // 3. Scroll Depth Milestone Tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (docHeight <= 0) {
            ticking = false;
            return;
          }

          const currentScroll = window.scrollY || window.pageYOffset;
          const scrollPercent = Math.round((currentScroll / docHeight) * 100);

          SCROLL_MILESTONES.forEach((milestone) => {
            if (
              scrollPercent >= milestone &&
              !trackedMilestonesRef.current.has(milestone)
            ) {
              trackedMilestonesRef.current.add(milestone);
              analyticsService.trackScrollDepth(milestone);
            }
          });

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount in case already scrolled or short page
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);
}

export default useAnalytics;
