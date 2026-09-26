import crypto from 'crypto';
import mongoose from 'mongoose';
import ResumeDownloadRequest from '../models/ResumeDownloadRequest.js';
import Profile from '../models/Profile.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import {
  sendResumeRequestNotification
} from '../services/emailService.js';
import {
  executeApproveRequest,
  executeRejectRequest,
  renderConfirmationPage,
  renderInteractiveConfirmation
} from '../services/resumeRequestService.js';

// Validate email format
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// ANALYTICS_HOOK: resume_download_request (Phase 27 can track here)
export const createRequest = async (req, res) => {
  try {
    const { name, email, message, sessionId } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required.'
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (name.trim().length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Name must not exceed 120 characters.'
      });
    }

    if (message && message.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message must not exceed 1000 characters.'
      });
    }

    // Strict Environment Isolation:
    // Production automatically approves the request, dispatches Resend notification, and returns resumeUrl for immediate download.
    // Localhost strictly preserves the manual approval workflow with Gmail SMTP.
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      const profile = await Profile.findOne({}).select('resumeUrl');
      const resumeUrl = profile?.resumeUrl || null;

      const savedRequest = await ResumeDownloadRequest.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message ? message.trim() : '',
        sessionId: (sessionId && typeof sessionId === 'string') ? sessionId.trim().slice(0, 128) : null,
        status: 'approved',
        requestedAt: new Date(),
        reviewedAt: new Date(),
        reviewedBy: 'system_auto_approve',
        reviewSource: null
      });

      // Record resume_download_approved event so the Resume Funnel accurately reflects auto-approvals in production
      if (savedRequest.sessionId) {
        try {
          await AnalyticsEvent.create({
            sessionId: savedRequest.sessionId,
            eventType: 'resume_download_approved',
            page: '/resume',
            section: 'resume',
            metadata: {
              requestId: savedRequest._id.toString(),
              source: 'production_auto_approve'
            }
          });
        } catch (analyticsErr) {
          console.warn('Resume download auto-approval analytics notice:', analyticsErr.message);
        }
      }

      // Send notification email to admin via Resend HTTPS API — non-blocking
      try {
        await sendResumeRequestNotification({
          requestId: savedRequest._id.toString(),
          visitorName: savedRequest.name,
          visitorEmail: savedRequest.email,
          message: savedRequest.message,
          requestedAt: savedRequest.requestedAt,
          autoApproved: true
        });
      } catch (emailError) {
        console.error(
          'Resume request notification email failed (request still saved):',
          emailError.message
        );
      }

      return res.status(201).json({
        success: true,
        autoApproved: true,
        resumeUrl,
        message: 'Your request has been submitted successfully. Your resume download will start shortly.',
        data: {
          _id: savedRequest._id,
          status: 'approved',
          requestedAt: savedRequest.requestedAt
        }
      });
    }

    // LOCALHOST FLOW: Keep existing manual approval workflow and Gmail SMTP completely unchanged
    const rawApproveToken = crypto.randomBytes(32).toString('hex');
    const rawRejectToken = crypto.randomBytes(32).toString('hex');

    const hashedApproveToken = crypto
      .createHash('sha256')
      .update(rawApproveToken)
      .digest('hex');

    const hashedRejectToken = crypto
      .createHash('sha256')
      .update(rawRejectToken)
      .digest('hex');

    const expireDays = parseInt(process.env.RESUME_TOKEN_EXPIRE_DAYS || '7', 10);
    const emailActionTokenExpire = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000);

    // Save request to MongoDB with hashed capability tokens
    const savedRequest = await ResumeDownloadRequest.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message ? message.trim() : '',
      sessionId: (sessionId && typeof sessionId === 'string') ? sessionId.trim().slice(0, 128) : null,
      requestedAt: new Date(),
      emailApproveToken: hashedApproveToken,
      emailRejectToken: hashedRejectToken,
      emailActionTokenExpire: emailActionTokenExpire
    });

    // Send notification email to admin with raw action tokens via Gmail SMTP on localhost
    try {
      await sendResumeRequestNotification({
        requestId: savedRequest._id.toString(),
        visitorName: savedRequest.name,
        visitorEmail: savedRequest.email,
        message: savedRequest.message,
        requestedAt: savedRequest.requestedAt,
        rawApproveToken,
        rawRejectToken
      });
    } catch (emailError) {
      console.error(
        'Resume request notification email failed (request still saved):',
        emailError.message
      );
    }

    return res.status(201).json({
      success: true,
      autoApproved: false,
      message:
        'Your request has been submitted and will be reviewed. The download link will be provided after approval.',
      data: {
        _id: savedRequest._id,
        status: savedRequest.status,
        requestedAt: savedRequest.requestedAt
      }
    });
  } catch (error) {
    console.error('createRequest error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit request. Please try again.'
    });
  }
};

// Admin: GET all resume requests
export const getRequests = async (req, res) => {
  try {
    const requests = await ResumeDownloadRequest.find()
      .sort({ requestedAt: -1 })
      .select('-approvalToken -emailApproveToken -emailRejectToken'); // never expose hashed tokens in list

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Admin: GET single resume request by ID
export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format.'
      });
    }

    const request = await ResumeDownloadRequest.findById(id).select(
      '-approvalToken -emailApproveToken -emailRejectToken'
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Resume download request not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Admin Dashboard: Approve request
export const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format.'
      });
    }

    const request = await ResumeDownloadRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Resume download request not found.'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request has already been reviewed (status: ${request.status}).`
      });
    }

    const { request: updatedRequest, rawDownloadToken } = await executeApproveRequest({
      request,
      source: 'admin_dashboard',
      reviewedBy: req.admin?.username || req.admin?.email || 'admin'
    });

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
    const downloadUrl = rawDownloadToken ? `${clientUrl}/resume/download/${rawDownloadToken}` : null;

    return res.status(200).json({
      success: true,
      message: 'Request approved and email sent to visitor.',
      data: {
        _id: updatedRequest._id,
        status: updatedRequest.status,
        reviewedAt: updatedRequest.reviewedAt,
        reviewedBy: updatedRequest.reviewedBy,
        approvalTokenExpire: updatedRequest.approvalTokenExpire,
        downloadUrl
      }
    });
  } catch (error) {
    console.error('approveRequest error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Admin Dashboard: Reject request
export const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionNote } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format.'
      });
    }

    const request = await ResumeDownloadRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Resume download request not found.'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request has already been reviewed (status: ${request.status}).`
      });
    }

    const { request: updatedRequest } = await executeRejectRequest({
      request,
      source: 'admin_dashboard',
      reviewedBy: req.admin?.username || req.admin?.email || 'admin',
      rejectionNote
    });

    return res.status(200).json({
      success: true,
      message: 'Request rejected.',
      data: {
        _id: updatedRequest._id,
        status: updatedRequest.status,
        reviewedAt: updatedRequest.reviewedAt,
        reviewedBy: updatedRequest.reviewedBy
      }
    });
  } catch (error) {
    console.error('rejectRequest error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 1-Click Email Action: GET Approve Confirmation (SAFE: Does NOT mutate state)
export const emailActionApprove = async (req, res) => {
  const wantsJson = req.headers['accept']?.includes('application/json') || req.query.format === 'json';
  const respond = (httpStatus, type, title, message, success = false) => {
    if (wantsJson) {
      return res.status(httpStatus).json({ success, message, title });
    }
    return res.status(httpStatus).send(renderConfirmationPage({ type, title, message }));
  };

  try {
    const token = req.query.token;

    if (!token || typeof token !== 'string' || token.length < 20) {
      return respond(400, 'invalid', 'Invalid Link', 'This approval link is invalid.');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const request = await ResumeDownloadRequest.findOne({
      emailApproveToken: hashedToken
    }).select('+emailApproveToken +emailRejectToken');

    if (!request) {
      return respond(404, 'invalid', 'Invalid Link', 'This approval link is invalid.');
    }

    // Check expiry
    if (!request.emailActionTokenExpire || request.emailActionTokenExpire < new Date()) {
      return respond(410, 'expired', 'Link Expired', 'This approval link has expired.');
    }

    // Check if already processed
    if (request.status !== 'pending') {
      return respond(400, 'already_reviewed', 'Request Already Reviewed', 'This request has already been reviewed.');
    }

    // SAFE GET: Render interactive confirmation without mutating state
    if (wantsJson) {
      return res.status(200).json({
        success: true,
        message: 'Confirmation required',
        action: 'approve',
        name: request.name,
        requestedAt: request.requestedAt
      });
    }

    return res.status(200).send(
      renderInteractiveConfirmation({
        action: 'approve',
        title: 'Approve Resume Download Request?',
        name: request.name,
        requestedAt: request.requestedAt,
        token
      })
    );
  } catch (error) {
    console.error('emailActionApprove error:', error.message);
    return respond(500, 'invalid', 'Action Error', 'Unable to load confirmation. Please try again or use the Admin Panel.');
  }
};

// 1-Click Email Action: POST Approve Execution (MUTATES state)
export const emailActionApproveConfirm = async (req, res) => {
  const wantsJson = req.headers['accept']?.includes('application/json') || req.query.format === 'json';
  const respond = (httpStatus, type, title, message, success = false, downloadUrl = null) => {
    if (wantsJson) {
      return res.status(httpStatus).json({ success, message, title, downloadUrl });
    }
    return res.status(httpStatus).send(renderConfirmationPage({ type, title, message, downloadUrl }));
  };

  try {
    const token = req.body?.token || req.query?.token;

    if (!token || typeof token !== 'string' || token.length < 20) {
      return respond(400, 'invalid', 'Invalid Link', 'This approval link is invalid.');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const request = await ResumeDownloadRequest.findOne({
      emailApproveToken: hashedToken
    }).select('+emailApproveToken +emailRejectToken');

    if (!request) {
      return respond(404, 'invalid', 'Invalid Link', 'This approval link is invalid.');
    }

    // Check expiry
    if (!request.emailActionTokenExpire || request.emailActionTokenExpire < new Date()) {
      return respond(410, 'expired', 'Link Expired', 'This approval link has expired.');
    }

    // Check if already processed
    if (request.status !== 'pending') {
      return respond(400, 'already_reviewed', 'Request Already Reviewed', 'This request has already been reviewed.');
    }

    // Execute shared approval logic on POST
    const { rawDownloadToken } = await executeApproveRequest({
      request,
      source: 'email',
      reviewedBy: 'email_action'
    });

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
    const downloadUrl = rawDownloadToken ? `${clientUrl}/resume/download/${rawDownloadToken}` : null;

    return respond(200, 'approved', 'Resume Request Approved', 'The resume download request has been approved.', true, downloadUrl);
  } catch (error) {
    console.error('emailActionApproveConfirm error:', error.message);
    return respond(500, 'invalid', 'Action Error', 'Unable to complete approval. Please try again or use the Admin Panel.');
  }
};

// 1-Click Email Action: GET Reject Confirmation (SAFE: Does NOT mutate state)
export const emailActionReject = async (req, res) => {
  const wantsJson = req.headers['accept']?.includes('application/json') || req.query.format === 'json';
  const respond = (httpStatus, type, title, message, success = false) => {
    if (wantsJson) {
      return res.status(httpStatus).json({ success, message, title });
    }
    return res.status(httpStatus).send(renderConfirmationPage({ type, title, message }));
  };

  try {
    const token = req.query.token;

    if (!token || typeof token !== 'string' || token.length < 20) {
      return respond(400, 'invalid', 'Invalid Link', 'This approval link is invalid.');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const request = await ResumeDownloadRequest.findOne({
      emailRejectToken: hashedToken
    }).select('+emailApproveToken +emailRejectToken');

    if (!request) {
      return respond(404, 'invalid', 'Invalid Link', 'This approval link is invalid.');
    }

    // Check expiry
    if (!request.emailActionTokenExpire || request.emailActionTokenExpire < new Date()) {
      return respond(410, 'expired', 'Link Expired', 'This approval link has expired.');
    }

    // Check if already processed
    if (request.status !== 'pending') {
      return respond(400, 'already_reviewed', 'Request Already Reviewed', 'This request has already been reviewed.');
    }

    // SAFE GET: Render interactive confirmation without mutating state
    if (wantsJson) {
      return res.status(200).json({
        success: true,
        message: 'Confirmation required',
        action: 'reject',
        name: request.name,
        requestedAt: request.requestedAt
      });
    }

    return res.status(200).send(
      renderInteractiveConfirmation({
        action: 'reject',
        title: 'Reject Resume Download Request?',
        name: request.name,
        requestedAt: request.requestedAt,
        token
      })
    );
  } catch (error) {
    console.error('emailActionReject error:', error.message);
    return respond(500, 'invalid', 'Action Error', 'Unable to load confirmation. Please try again or use the Admin Panel.');
  }
};

// 1-Click Email Action: POST Reject Execution (MUTATES state)
export const emailActionRejectConfirm = async (req, res) => {
  const wantsJson = req.headers['accept']?.includes('application/json') || req.query.format === 'json';
  const respond = (httpStatus, type, title, message, success = false) => {
    if (wantsJson) {
      return res.status(httpStatus).json({ success, message, title });
    }
    return res.status(httpStatus).send(renderConfirmationPage({ type, title, message }));
  };

  try {
    const token = req.body?.token || req.query?.token;

    if (!token || typeof token !== 'string' || token.length < 20) {
      return respond(400, 'invalid', 'Invalid Link', 'This approval link is invalid.');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const request = await ResumeDownloadRequest.findOne({
      emailRejectToken: hashedToken
    }).select('+emailApproveToken +emailRejectToken');

    if (!request) {
      return respond(404, 'invalid', 'Invalid Link', 'This approval link is invalid.');
    }

    // Check expiry
    if (!request.emailActionTokenExpire || request.emailActionTokenExpire < new Date()) {
      return respond(410, 'expired', 'Link Expired', 'This approval link has expired.');
    }

    // Check if already processed
    if (request.status !== 'pending') {
      return respond(400, 'already_reviewed', 'Request Already Reviewed', 'This request has already been reviewed.');
    }

    // Execute shared rejection logic on POST
    await executeRejectRequest({
      request,
      source: 'email',
      reviewedBy: 'email_action',
      rejectionNote: 'Rejected via email action'
    });

    return respond(200, 'rejected', 'Resume Request Rejected', 'A notification has been sent to the requester.', true);
  } catch (error) {
    console.error('emailActionRejectConfirm error:', error.message);
    return respond(500, 'invalid', 'Action Error', 'Unable to complete rejection. Please try again or use the Admin Panel.');
  }
};

// Public: Visitor checks their resume request status via trackingToken
export const getRequestStatus = async (req, res) => {
  try {
    const token = req.params.token || req.query.token;

    if (!token || typeof token !== 'string' || token.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing tracking token.'
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const request = await ResumeDownloadRequest.findOne({
      trackingToken: hashedToken
    }).select('+trackingToken');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Resume request not found or invalid token.'
      });
    }

    // Check expiration
    const isExpired = request.status === 'approved'
      ? (request.approvalTokenExpire && request.approvalTokenExpire < new Date())
      : (request.emailActionTokenExpire && request.emailActionTokenExpire < new Date());

    if (isExpired) {
      return res.status(200).json({
        success: true,
        status: 'expired',
        message: 'Your resume request link has expired. Please submit a new request.',
        requestedAt: request.requestedAt
      });
    }

    // Prepare safe public response without exposing PII, visitor email, or admin tokens
    const responseData = {
      success: true,
      status: request.status,
      requestedAt: request.requestedAt,
      reviewedAt: request.reviewedAt || null
    };

    if (request.status === 'approved') {
      responseData.approvalTokenExpire = request.approvalTokenExpire;
      responseData.canDownload = true;
    } else if (request.status === 'rejected') {
      responseData.rejectionNote = request.rejectionNote || null;
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('getRequestStatus error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve request status.'
    });
  }
};

// ANALYTICS_HOOK: resume_download_completed (Phase 27 can track here)
export const downloadResume = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || typeof token !== 'string' || token.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Invalid download token.'
      });
    }

    // Hash the incoming raw token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find request with matching approvalToken OR trackingToken
    const request = await ResumeDownloadRequest.findOne({
      $or: [
        { approvalToken: hashedToken },
        { trackingToken: hashedToken }
      ]
    }).select('+trackingToken');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or unrecognized download token.'
      });
    }

    // Check status
    if (request.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message:
          request.status === 'pending'
            ? 'Your request is still pending review.'
            : 'This download request has been declined.'
      });
    }

    // Check expiry
    if (!request.approvalTokenExpire || request.approvalTokenExpire < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'This download link has expired. Please submit a new request.'
      });
    }

    // Fetch resume URL from profile (single source of truth)
    const profile = await Profile.findOne({}).select('resumeUrl');

    if (!profile || !profile.resumeUrl) {
      return res.status(503).json({
        success: false,
        message: 'Resume is currently unavailable. Please try again later.'
      });
    }

    // Return the resume URL for the frontend to use
    // Using JSON response so the client can open it (avoids CORS issues with direct redirect)
    return res.status(200).json({
      success: true,
      resumeUrl: profile.resumeUrl,
      visitorName: request.name
    });
  } catch (error) {
    console.error('downloadResume error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Download validation failed. Please try again.'
    });
  }
};
