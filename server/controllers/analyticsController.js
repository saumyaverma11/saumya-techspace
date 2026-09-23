import Analytics from '../models/Analytics.js';
import Message from '../models/Message.js';
import AnalyticsEvent, { ALLOWED_EVENT_TYPES } from '../models/AnalyticsEvent.js';

/**
 * Consistent date range parser for all analytics endpoints.
 * Supports: 'today', '7d' (default), '30d', 'all', and custom 'YYYY-MM-DD' bounds.
 * Prevents UTC off-by-one errors and validates start <= end.
 */
export const parseDateRange = (query) => {
  const { range, from, to } = query;
  const now = new Date();
  let startDate = null;
  let endDate = null;

  if (from || to) {
    if (!from || !to) {
      const err = new Error('Both "from" and "to" parameters are required for custom date range.');
      err.statusCode = 400;
      throw err;
    }
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoRegex.test(from) || !isoRegex.test(to)) {
      const err = new Error('Dates must be in YYYY-MM-DD format.');
      err.statusCode = 400;
      throw err;
    }
    startDate = new Date(`${from}T00:00:00.000Z`);
    endDate = new Date(`${to}T23:59:59.999Z`);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      const err = new Error('Invalid date value provided.');
      err.statusCode = 400;
      throw err;
    }
    if (startDate > endDate) {
      const err = new Error('Start date cannot be after end date.');
      err.statusCode = 400;
      throw err;
    }
  } else if (range === 'today') {
    const todayStr = now.toISOString().split('T')[0];
    startDate = new Date(`${todayStr}T00:00:00.000Z`);
    endDate = new Date(`${todayStr}T23:59:59.999Z`);
  } else if (range === '30d') {
    const startObj = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    const startStr = startObj.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];
    startDate = new Date(`${startStr}T00:00:00.000Z`);
    endDate = new Date(`${todayStr}T23:59:59.999Z`);
  } else if (range === 'all') {
    startDate = null;
    const todayStr = now.toISOString().split('T')[0];
    endDate = new Date(`${todayStr}T23:59:59.999Z`);
  } else {
    // Default: '7d' (Last 7 Days)
    const startObj = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    const startStr = startObj.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];
    startDate = new Date(`${startStr}T00:00:00.000Z`);
    endDate = new Date(`${todayStr}T23:59:59.999Z`);
  }

  const matchQuery = {};
  if (startDate && endDate) {
    matchQuery.timestamp = { $gte: startDate, $lte: endDate };
  } else if (endDate) {
    matchQuery.timestamp = { $lte: endDate };
  }

  const fromDateStr = startDate ? startDate.toISOString().split('T')[0] : null;
  const toDateStr = endDate ? endDate.toISOString().split('T')[0] : null;
  const dateMatch = {};
  if (fromDateStr && toDateStr) {
    dateMatch.date = { $gte: fromDateStr, $lte: toDateStr };
  } else if (toDateStr) {
    dateMatch.date = { $lte: toDateStr };
  }

  return { startDate, endDate, fromDateStr, toDateStr, matchQuery, dateMatch };
};

// ─── Existing basic analytics endpoints ──────────────────────────────────────

export const recordVisit = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const record = await Analytics.findOneAndUpdate(
      { date: today },
      { $inc: { visits: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const dailyVisits = await Analytics.find().sort({ date: -1 });

    const totalVisits = dailyVisits.reduce((acc, curr) => acc + curr.visits, 0);
    const totalMessages = await Message.countDocuments();
    const unreadMessages = await Message.countDocuments({ read: false });

    res.status(200).json({
      success: true,
      data: {
        totalVisits,
        dailyVisits,
        totalMessages,
        unreadMessages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAnalyticsSummary = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const allRecords = await Analytics.find();
    const totalVisits = allRecords.reduce((acc, curr) => acc + curr.visits, 0);

    const todayRecord = allRecords.find((rec) => rec.date === today);
    const todayVisits = todayRecord ? todayRecord.visits : 0;

    const totalMessages = await Message.countDocuments();
    const unreadMessages = await Message.countDocuments({ read: false });

    res.status(200).json({
      success: true,
      data: {
        totalVisits,
        todayVisits,
        totalMessages,
        unreadMessages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ─── Phase 27: Public Event Creation Endpoint ───────────────────────────────

export const createAnalyticsEvent = async (req, res) => {
  try {
    const {
      eventType,
      sessionId,
      page,
      section,
      metadata,
      deviceType,
      browser,
      operatingSystem,
      screenWidth,
      screenHeight,
      referrer,
      source
    } = req.body;

    if (!eventType || typeof eventType !== 'string' || !ALLOWED_EVENT_TYPES.includes(eventType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid or unsupported eventType. Allowed types: ${ALLOWED_EVENT_TYPES.join(', ')}`
      });
    }

    if (
      !sessionId ||
      typeof sessionId !== 'string' ||
      sessionId.trim().length < 10 ||
      sessionId.trim().length > 128
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sessionId. A valid anonymous sessionId is required.'
      });
    }

    let safeMetadata = {};
    if (metadata !== undefined && metadata !== null) {
      if (typeof metadata !== 'object' || Array.isArray(metadata)) {
        return res.status(400).json({
          success: false,
          message: 'Metadata must be an object.'
        });
      }
      try {
        const metadataString = JSON.stringify(metadata);
        if (metadataString.length > 2048) {
          return res.status(400).json({
            success: false,
            message: 'Metadata payload exceeds maximum allowed size of 2KB.'
          });
        }
        safeMetadata = JSON.parse(metadataString);
      } catch {
        return res.status(400).json({
          success: false,
          message: 'Malformed metadata payload.'
        });
      }
    }

    const safeDeviceType = ['desktop', 'mobile', 'tablet'].includes(deviceType)
      ? deviceType
      : 'unknown';
    const safeBrowser = typeof browser === 'string' ? browser.slice(0, 100) : 'unknown';
    const safeOS = typeof operatingSystem === 'string' ? operatingSystem.slice(0, 100) : 'unknown';
    const safeWidth =
      typeof screenWidth === 'number' && Number.isFinite(screenWidth)
        ? Math.round(screenWidth)
        : null;
    const safeHeight =
      typeof screenHeight === 'number' && Number.isFinite(screenHeight)
        ? Math.round(screenHeight)
        : null;
    const safeReferrer = typeof referrer === 'string' ? referrer.slice(0, 500) : '';
    const safeSource = typeof source === 'string' ? source.slice(0, 100) : 'direct';
    const safePage = typeof page === 'string' ? page.slice(0, 200) : '/';
    const safeSection = typeof section === 'string' ? section.slice(0, 100) : null;

    const event = await AnalyticsEvent.create({
      sessionId: sessionId.trim(),
      eventType,
      page: safePage,
      section: safeSection,
      metadata: safeMetadata,
      deviceType: safeDeviceType,
      browser: safeBrowser,
      operatingSystem: safeOS,
      screenWidth: safeWidth,
      screenHeight: safeHeight,
      referrer: safeReferrer,
      source: safeSource,
      timestamp: new Date()
    });

    return res.status(201).json({
      success: true,
      data: {
        id: event._id,
        eventType: event.eventType,
        timestamp: event.timestamp
      }
    });
  } catch (error) {
    console.error('createAnalyticsEvent error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to record analytics event.'
    });
  }
};

// ─── Phase 28: Admin-Protected Analytics Dashboard Endpoints ───────────────

/**
 * 1. GET /api/analytics/dashboard-summary
 * High-level aggregated summary across visits, page views, engagement, resume, and contact.
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const { matchQuery, dateMatch, startDate, endDate } = parseDateRange(req.query);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
    const todayEnd = new Date(`${todayStr}T23:59:59.999Z`);

    const [
      allTimeVisitsDoc,
      filteredVisitsDoc,
      todayVisitDoc,
      eventCounts,
      uniqueSessionsResult,
      totalEvents,
      todayPageViews
    ] = await Promise.all([
      Analytics.aggregate([{ $group: { _id: null, total: { $sum: '$visits' } } }]),
      Analytics.aggregate([{ $match: dateMatch }, { $group: { _id: null, total: { $sum: '$visits' } } }]),
      Analytics.findOne({ date: todayStr }),
      AnalyticsEvent.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$eventType', count: { $sum: 1 } } }
      ]),
      AnalyticsEvent.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$sessionId' } },
        { $count: 'count' }
      ]),
      AnalyticsEvent.countDocuments(matchQuery),
      AnalyticsEvent.countDocuments({
        eventType: 'page_view',
        timestamp: { $gte: todayStart, $lte: todayEnd }
      })
    ]);

    const eventMap = {};
    eventCounts.forEach((item) => {
      eventMap[item._id] = item.count;
    });

    const totalVisits = filteredVisitsDoc[0]?.total || 0;
    const allTimeVisits = allTimeVisitsDoc[0]?.total || 0;
    const todayVisits = todayVisitDoc?.visits || 0;
    const uniqueSessions = uniqueSessionsResult[0]?.count || 0;
    const avgEventsPerSession =
      uniqueSessions > 0 ? parseFloat((totalEvents / uniqueSessions).toFixed(1)) : 0;

    const rangeName = req.query.from && req.query.to ? 'custom' : req.query.range || '7d';

    return res.status(200).json({
      success: true,
      data: {
        totalVisits,
        allTimeVisits,
        todayVisits,
        totalPageViews: eventMap['page_view'] || 0,
        todayPageViews,
        totalEvents,
        uniqueSessions,
        avgEventsPerSession,
        resumeViews: eventMap['resume_view'] || 0,
        resumeRequests: eventMap['resume_download_request'] || 0,
        resumeApprovals: eventMap['resume_download_approved'] || 0,
        authorizedDownloadActions: eventMap['resume_download_completed'] || 0,
        authorizedDownloads: eventMap['resume_download_completed'] || 0,
        contactStarts: eventMap['contact_form_start'] || 0,
        contactSubmissions: eventMap['contact_form_submit'] || 0,
        githubClicks: (eventMap['github_click'] || 0) + (eventMap['project_github_click'] || 0),
        linkedinClicks: eventMap['linkedin_click'] || 0,
        emailClicks: eventMap['email_click'] || 0,
        dateRange: {
          range: rangeName,
          startDate,
          endDate
        }
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to retrieve dashboard summary.'
    });
  }
};

/**
 * 2. GET /api/analytics/trends
 * Multi-metric daily time-series: visits, pageViews, uniqueSessions.
 */
export const getActivityTrends = async (req, res) => {
  try {
    const { matchQuery, dateMatch, startDate, endDate } = parseDateRange(req.query);

    const [visits, pageViewsByDate, sessionsByDate] = await Promise.all([
      Analytics.find(dateMatch).sort({ date: 1 }),
      AnalyticsEvent.aggregate([
        { $match: { ...matchQuery, eventType: 'page_view' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      AnalyticsEvent.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              sessionId: '$sessionId'
            }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const visitsByDate = new Map();
    visits.forEach((v) => visitsByDate.set(v.date, v.visits));

    const pvMap = new Map();
    pageViewsByDate.forEach((p) => pvMap.set(p._id, p.count));

    const sessionMap = new Map();
    sessionsByDate.forEach((s) => sessionMap.set(s._id, s.count));

    // Construct sequential date array
    const dates = [];
    if (startDate && endDate) {
      const cur = new Date(startDate);
      const end = new Date(endDate);
      while (cur <= end) {
        dates.push(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      const allDates = new Set([
        ...visitsByDate.keys(),
        ...pvMap.keys(),
        ...sessionMap.keys()
      ]);
      dates.push(...Array.from(allDates).sort());
    }

    const trends = dates.map((d) => ({
      date: d,
      visits: visitsByDate.get(d) || 0,
      pageViews: pvMap.get(d) || 0,
      uniqueSessions: sessionMap.get(d) || 0
    }));

    return res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to retrieve activity trends.'
    });
  }
};

/**
 * 3. GET /api/analytics/engagement
 * Scroll depth milestone counts/reach and section view reach percentages.
 */
export const getEngagementAnalytics = async (req, res) => {
  try {
    const { matchQuery } = parseDateRange(req.query);

    const [totalSessionsDoc, scrollAgg, sectionAgg] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$sessionId' } },
        { $count: 'count' }
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...matchQuery, eventType: 'scroll_depth' } },
        {
          $group: {
            _id: '$metadata.percentage',
            count: { $sum: 1 }
          }
        }
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...matchQuery, eventType: 'section_view', section: { $ne: null } } },
        {
          $group: {
            _id: '$section',
            views: { $sum: 1 },
            sessions: { $addToSet: '$sessionId' }
          }
        }
      ])
    ]);

    const totalSessions = totalSessionsDoc[0]?.count || 0;

    const scrollMap = new Map();
    scrollAgg.forEach((s) => scrollMap.set(Number(s._id), s.count));

    const scrollDepth = [25, 50, 75, 90, 100].map((m) => {
      const count = scrollMap.get(m) || 0;
      const reachPercentage =
        totalSessions > 0 ? parseFloat(((count / totalSessions) * 100).toFixed(1)) : 0;
      return {
        milestone: m,
        depth: m,
        count,
        reachPercentage
      };
    });

    const sectionMap = new Map();
    sectionAgg.forEach((s) => {
      sectionMap.set(s._id, {
        views: s.views,
        uniqueSessions: s.sessions.length
      });
    });

    const standardSections = [
      'hero',
      'about',
      'skills',
      'projects',
      'experience',
      'education',
      'certifications',
      'contact'
    ];

    const sections = standardSections.map((sec) => {
      const data = sectionMap.get(sec) || { views: 0, uniqueSessions: 0 };
      const reachPercentage =
        totalSessions > 0
          ? parseFloat(((data.uniqueSessions / totalSessions) * 100).toFixed(1))
          : 0;
      return {
        section: sec,
        views: data.views,
        uniqueSessions: data.uniqueSessions,
        reachPercentage
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        totalSessions,
        totalUniqueSessions: totalSessions,
        scrollDepth,
        sections,
        sectionViews: sections
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to retrieve engagement analytics.'
    });
  }
};

/**
 * 4. GET /api/analytics/projects
 * Project views, GitHub link clicks, and live demo clicks.
 */
export const getProjectAnalytics = async (req, res) => {
  try {
    const { matchQuery } = parseDateRange(req.query);

    const projectEvents = await AnalyticsEvent.aggregate([
      {
        $match: {
          ...matchQuery,
          eventType: { $in: ['project_view', 'project_github_click', 'project_live_click'] },
          'metadata.projectId': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$metadata.projectId',
          projectTitle: { $first: '$metadata.projectTitle' },
          views: {
            $sum: { $cond: [{ $eq: ['$eventType', 'project_view'] }, 1, 0] }
          },
          githubClicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'project_github_click'] }, 1, 0] }
          },
          liveClicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'project_live_click'] }, 1, 0] }
          },
          sessions: { $addToSet: '$sessionId' }
        }
      },
      { $sort: { views: -1, githubClicks: -1, liveClicks: -1 } }
    ]);

    const projects = projectEvents.map((p) => ({
      projectId: p._id,
      projectTitle: p.projectTitle || `Project ${String(p._id).slice(-4)}`,
      views: p.views,
      githubClicks: p.githubClicks,
      liveClicks: p.liveClicks,
      uniqueSessions: p.sessions.length
    }));

    return res.status(200).json({
      success: true,
      data: projects
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to retrieve project analytics.'
    });
  }
};

/**
 * 5. GET /api/analytics/certifications
 * Credential views and unique session reach.
 */
export const getCertificationAnalytics = async (req, res) => {
  try {
    const { matchQuery } = parseDateRange(req.query);

    const certEvents = await AnalyticsEvent.aggregate([
      {
        $match: {
          ...matchQuery,
          eventType: 'certificate_view',
          'metadata.certId': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$metadata.certId',
          certName: { $first: '$metadata.certName' },
          views: { $sum: 1 },
          sessions: { $addToSet: '$sessionId' }
        }
      },
      { $sort: { views: -1 } }
    ]);

    const certifications = certEvents.map((c) => ({
      certId: c._id,
      certName: c.certName || `Certificate ${String(c._id).slice(-4)}`,
      views: c.views,
      uniqueSessions: c.sessions.length
    }));

    return res.status(200).json({
      success: true,
      data: certifications
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to retrieve certification analytics.'
    });
  }
};

/**
 * 6. GET /api/analytics/resume
 * Funnel: Resume Views → Download Requests → Approvals → Authorized Download Actions.
 */
export const getResumeFunnelAnalytics = async (req, res) => {
  try {
    const { matchQuery } = parseDateRange(req.query);

    const resumeCounts = await AnalyticsEvent.aggregate([
      {
        $match: {
          ...matchQuery,
          eventType: {
            $in: [
              'resume_view',
              'resume_download_request',
              'resume_download_approved',
              'resume_download_completed'
            ]
          }
        }
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = {};
    resumeCounts.forEach((c) => {
      countMap[c._id] = c.count;
    });

    const views = countMap['resume_view'] || 0;
    const requests = countMap['resume_download_request'] || 0;
    const approvals = countMap['resume_download_approved'] || 0;
    const authorizedDownloads = countMap['resume_download_completed'] || 0;

    const requestRate = views > 0 ? parseFloat(((requests / views) * 100).toFixed(1)) : 0;
    const approvalRate = requests > 0 ? parseFloat(((approvals / requests) * 100).toFixed(1)) : 0;
    const downloadRate =
      approvals > 0 ? parseFloat(((authorizedDownloads / approvals) * 100).toFixed(1)) : 0;

    return res.status(200).json({
      success: true,
      data: {
        views,
        requests,
        approvals,
        authorizedDownloads,
        resumeViews: views,
        resumeRequests: requests,
        resumeApprovals: approvals,
        requestRate,
        approvalRate,
        downloadRate,
        rates: {
          requestRate,
          approvalRate,
          downloadRate
        }
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to retrieve resume funnel analytics.'
    });
  }
};

/**
 * 7. GET /api/analytics/contact
 * Form starts, successful submissions, conversion rate, and email link clicks (zero PII).
 */
export const getContactAnalytics = async (req, res) => {
  try {
    const { matchQuery } = parseDateRange(req.query);

    const contactCounts = await AnalyticsEvent.aggregate([
      {
        $match: {
          ...matchQuery,
          eventType: {
            $in: ['contact_form_start', 'contact_form_submit', 'email_click']
          }
        }
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = {};
    contactCounts.forEach((c) => {
      countMap[c._id] = c.count;
    });

    const formStarts = countMap['contact_form_start'] || 0;
    const formSubmits = countMap['contact_form_submit'] || 0;
    const emailClicks = countMap['email_click'] || 0;
    const conversionRate =
      formStarts > 0 ? parseFloat(((formSubmits / formStarts) * 100).toFixed(1)) : 0;

    return res.status(200).json({
      success: true,
      data: {
        formStarts,
        formSubmits,
        contactFormStarts: formStarts,
        contactFormSubmissions: formSubmits,
        conversionRate,
        emailClicks
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to retrieve contact analytics.'
    });
  }
};

/**
 * 8. GET /api/analytics/traffic-devices
 * Breakdown by traffic source, device types, browsers, and operating systems.
 */
export const getTrafficAndDeviceAnalytics = async (req, res) => {
  try {
    const { matchQuery } = parseDateRange(req.query);

    const [sourcesAgg, devicesAgg, browsersAgg, osAgg, totalEventsCount] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      AnalyticsEvent.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$deviceType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      AnalyticsEvent.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$browser', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      AnalyticsEvent.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$operatingSystem', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      AnalyticsEvent.countDocuments(matchQuery)
    ]);

    const formatShare = (arr) =>
      arr.map((item) => ({
        name: item._id || 'Unknown',
        count: item.count,
        percentage:
          totalEventsCount > 0
            ? parseFloat(((item.count / totalEventsCount) * 100).toFixed(1))
            : 0
      }));

    return res.status(200).json({
      success: true,
      data: {
        sources: formatShare(sourcesAgg),
        devices: formatShare(devicesAgg),
        browsers: formatShare(browsersAgg),
        operatingSystems: formatShare(osAgg),
        totalEvents: totalEventsCount
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to retrieve traffic and device analytics.'
    });
  }
};

/**
 * 9. GET /api/analytics/events-list
 * Paginated list of recent events with filtering. Strictly excludes session IDs, credentials, and PII.
 */
export const getRecentEvents = async (req, res) => {
  try {
    const { matchQuery } = parseDateRange(req.query);
    const { eventType, deviceType, source, section } = req.query;

    const filter = { ...matchQuery };
    if (eventType) filter.eventType = eventType;
    if (deviceType) filter.deviceType = deviceType;
    if (source) filter.source = source;
    if (section) filter.section = section;

    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const skip = (page - 1) * limit;

    // STRICT PRIVACY: Do NOT select sessionId, tokens, names, emails, messages
    const [events, total] = await Promise.all([
      AnalyticsEvent.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          'eventType page section deviceType browser operatingSystem source timestamp metadata.percentage metadata.projectTitle metadata.certName'
        ),
      AnalyticsEvent.countDocuments(filter)
    ]);

    const safeEvents = events.map((e) => ({
      _id: e._id,
      eventType: e.eventType,
      page: e.page,
      section: e.section,
      deviceType: e.deviceType,
      browser: e.browser,
      operatingSystem: e.operatingSystem,
      source: e.source,
      timestamp: e.timestamp,
      metadata: e.metadata || {}
    }));

    return res.status(200).json({
      success: true,
      data: {
        events: safeEvents,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1
        }
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to retrieve recent events.'
    });
  }
};
