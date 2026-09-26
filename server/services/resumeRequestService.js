import crypto from 'crypto';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import {
  sendResumeApprovalEmail,
  sendResumeRejectionEmail
} from './emailService.js';

/**
 * Shared business logic: Execute approval for a resume request
 * Can be called from Admin Dashboard or 1-Click Email Action
 *
 * @param {Object} params
 * @param {import('../models/ResumeDownloadRequest.js').default} params.request - Mongoose document
 * @param {'admin_dashboard'|'email'} params.source - Origin of approval
 * @param {string} [params.reviewedBy] - Identifier of reviewer
 * @returns {Promise<{ success: boolean, request: Object, rawDownloadToken?: string }>}
 */
export const executeApproveRequest = async ({
  request,
  source = 'admin_dashboard',
  reviewedBy = null
}) => {
  if (request.status !== 'pending') {
    const error = new Error('This request has already been reviewed.');
    error.name = 'AlreadyReviewedError';
    error.status = request.status;
    throw error;
  }

  // Generate cryptographically secure visitor download token (raw — only sent in email)
  const rawToken = crypto.randomBytes(40).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const expireDays = parseInt(process.env.RESUME_TOKEN_EXPIRE_DAYS || '7', 10);
  const expireDate = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000);

  // Update request state
  request.status = 'approved';
  request.reviewedAt = new Date();
  request.reviewedBy = reviewedBy || (source === 'email' ? 'email_action' : 'admin');
  request.reviewSource = source;
  request.approvalToken = hashedToken;
  request.approvalTokenExpire = expireDate;
  request.rejectionNote = null;

  await request.save();

  // ANALYTICS_HOOK: resume_download_approved (Phase 27)
  // Preserves existing sessionId and records source metadata
  try {
    if (request.sessionId) {
      await AnalyticsEvent.create({
        sessionId: request.sessionId,
        eventType: 'resume_download_approved',
        page: source === 'email' ? '/email-action' : '/admin/resume-requests',
        section: 'admin',
        metadata: {
          requestId: request._id.toString(),
          source: source === 'email' ? 'email' : 'admin_dashboard'
        }
      });
    }
  } catch (analyticsErr) {
    console.warn('Resume download approval analytics error:', analyticsErr.message);
  }

  // Construct authorized download URL
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')[0]
    .trim();
  const downloadUrl = `${clientUrl}/resume/download/${rawToken}`;

  // Send visitor approval email — non-blocking
  try {
    await sendResumeApprovalEmail({
      visitorName: request.name,
      visitorEmail: request.email,
      downloadUrl,
      expireDays
    });
  } catch (emailError) {
    console.error(
      'Resume approval email failed (request still approved):',
      emailError.message
    );
  }

  return {
    success: true,
    request,
    rawDownloadToken: rawToken
  };
};

/**
 * Shared business logic: Execute rejection for a resume request
 * Can be called from Admin Dashboard or 1-Click Email Action
 *
 * @param {Object} params
 * @param {import('../models/ResumeDownloadRequest.js').default} params.request - Mongoose document
 * @param {'admin_dashboard'|'email'} params.source - Origin of rejection
 * @param {string} [params.reviewedBy] - Identifier of reviewer
 * @param {string} [params.rejectionNote] - Optional rejection note
 * @returns {Promise<{ success: boolean, request: Object }>}
 */
export const executeRejectRequest = async ({
  request,
  source = 'admin_dashboard',
  reviewedBy = null,
  rejectionNote = null
}) => {
  if (request.status !== 'pending') {
    const error = new Error('This request has already been reviewed.');
    error.name = 'AlreadyReviewedError';
    error.status = request.status;
    throw error;
  }

  request.status = 'rejected';
  request.reviewedAt = new Date();
  request.reviewedBy = reviewedBy || (source === 'email' ? 'email_action' : 'admin');
  request.reviewSource = source;
  request.rejectionNote = rejectionNote ? rejectionNote.trim() : (source === 'email' ? 'Reviewed via email' : null);

  // Invalidate any download token
  request.approvalToken = null;
  request.approvalTokenExpire = null;

  await request.save();

  // Send visitor rejection email — non-blocking
  try {
    await sendResumeRejectionEmail({
      visitorName: request.name,
      visitorEmail: request.email,
      rejectionNote: request.rejectionNote
    });
  } catch (emailError) {
    console.error(
      'Resume rejection email failed (request still rejected):',
      emailError.message
    );
  }

  return {
    success: true,
    request
  };
};

/**
 * Render clean HTML confirmation page for email actions
 *
 * @param {Object} params
 * @param {'approved'|'rejected'|'already_reviewed'|'expired'|'invalid'} params.type
 * @param {string} params.title
 * @param {string} params.message
 * @returns {string} HTML string
 */
export const renderConfirmationPage = ({ type, title, message, downloadUrl = null }) => {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')[0]
    .trim();
  const adminUrl = `${clientUrl}/admin/resume-requests`;

  let badgeColor = '#06b6d4';
  let badgeBg = 'rgba(6, 182, 212, 0.1)';
  let iconSvg = '';

  if (type === 'approved') {
    badgeColor = '#10b981';
    badgeBg = 'rgba(16, 185, 129, 0.12)';
    iconSvg = `<svg style="width: 48px; height: 48px; color: #10b981;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>`;
  } else if (type === 'rejected') {
    badgeColor = '#ef4444';
    badgeBg = 'rgba(239, 68, 68, 0.12)';
    iconSvg = `<svg style="width: 48px; height: 48px; color: #ef4444;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>`;
  } else if (type === 'already_reviewed') {
    badgeColor = '#3b82f6';
    badgeBg = 'rgba(59, 130, 246, 0.12)';
    iconSvg = `<svg style="width: 48px; height: 48px; color: #3b82f6;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>`;
  } else if (type === 'expired') {
    badgeColor = '#f59e0b';
    badgeBg = 'rgba(245, 158, 11, 0.12)';
    iconSvg = `<svg style="width: 48px; height: 48px; color: #f59e0b;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>`;
  } else {
    // invalid
    badgeColor = '#ef4444';
    badgeBg = 'rgba(239, 68, 68, 0.12)';
    iconSvg = `<svg style="width: 48px; height: 48px; color: #ef4444;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>`;
  }

  const downloadCardHtml = downloadUrl
    ? `
      <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px; margin: 20px 0 24px 0; text-align: left;">
        <p style="font-size: 11px; color: #94a3b8; margin: 0 0 6px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">Authorized Download Link:</p>
        <p style="margin: 0 0 10px 0; font-size: 13px; word-break: break-all;">
          <a href="${downloadUrl}" target="_blank" rel="noopener noreferrer" style="color: #06b6d4; text-decoration: underline; font-weight: 500;">${downloadUrl}</a>
        </p>
        <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.4;">
          This secure, time-limited link is active. You can copy it to reply to the visitor's notification email in Gmail directly.
        </p>
      </div>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Saumya TechSpace</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b1220;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 40px 32px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .icon-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: ${badgeBg};
      margin-bottom: 24px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
      letter-spacing: -0.01em;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-block;
      background-color: #06b6d4;
      color: #0b1220;
      font-weight: 600;
      font-size: 14px;
      padding: 12px 28px;
      border-radius: 9999px;
      text-decoration: none;
      transition: background-color 0.2s, transform 0.1s;
    }
    .btn:hover {
      background-color: #22d3ee;
      transform: translateY(-1px);
    }
    .footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-container">
      ${iconSvg}
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
    ${downloadCardHtml}
    <a href="${adminUrl}" class="btn">Go to Admin Panel</a>
    <div class="footer">
      Saumya TechSpace Portfolio &bull; Secure Email Action
    </div>
  </div>
</body>
</html>`;
};

/**
 * Render interactive GET confirmation page for approve/reject actions
 * Protects against automatic email security link scanners
 *
 * @param {Object} params
 * @param {'approve'|'reject'} params.action
 * @param {string} params.title
 * @param {string} params.name
 * @param {Date|string} params.requestedAt
 * @param {string} params.token
 * @returns {string} HTML string
 */
export const renderInteractiveConfirmation = ({
  action,
  title,
  name,
  requestedAt,
  token
}) => {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')[0]
    .trim();
  const adminUrl = `${clientUrl}/admin/resume-requests`;
  const isApprove = action === 'approve';

  const actionBg = isApprove ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';
  const actionBtnColor = isApprove ? '#059669' : '#dc2626';
  const actionBtnHover = isApprove ? '#047857' : '#b91c1c';
  const buttonLabel = isApprove ? 'Confirm Approval' : 'Confirm Rejection';
  const formAction = `/api/resume-requests/email-action/${action}`;

  const iconSvg = isApprove
    ? `<svg style="width: 48px; height: 48px; color: #10b981;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>`
    : `<svg style="width: 48px; height: 48px; color: #ef4444;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>`;

  const formattedDate = requestedAt
    ? new Date(requestedAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : 'Recent';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Saumya TechSpace</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b1220;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 40px 32px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .icon-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: ${actionBg};
      margin-bottom: 24px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
      letter-spacing: -0.01em;
    }
    .info-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 16px;
      margin: 20px 0 24px 0;
      text-align: left;
      font-size: 14px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .info-label {
      color: #94a3b8;
    }
    .info-value {
      font-weight: 600;
      color: #f1f5f9;
    }
    .desc {
      font-size: 14px;
      line-height: 1.5;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .btn-group {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .btn {
      display: inline-block;
      font-weight: 600;
      font-size: 14px;
      padding: 12px 24px;
      border-radius: 9999px;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;
    }
    .btn-action {
      background-color: ${actionBtnColor};
      color: #ffffff;
    }
    .btn-action:hover {
      background-color: ${actionBtnHover};
      transform: translateY(-1px);
    }
    .btn-cancel {
      background-color: rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
    }
    .btn-cancel:hover {
      background-color: rgba(255, 255, 255, 0.16);
      color: #ffffff;
    }
    .footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-container">
      ${iconSvg}
    </div>
    <h1>${title}</h1>
    <p class="desc">
      ${isApprove
        ? 'Please confirm that you want to approve this resume download request. The requester will receive an authorized download link.'
        : 'Please confirm that you want to reject this resume download request. The requester will be notified.'}
    </p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Requester:</span>
        <span class="info-value">${name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Requested At:</span>
        <span class="info-value">${formattedDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status:</span>
        <span class="info-value" style="color: #f59e0b;">Pending Review</span>
      </div>
    </div>

    <form method="POST" action="${formAction}">
      <input type="hidden" name="token" value="${token}" />
      <div class="btn-group">
        <button type="submit" class="btn btn-action">${buttonLabel}</button>
        <a href="${adminUrl}" class="btn btn-cancel">Cancel</a>
      </div>
    </form>

    <div class="footer">
      Saumya TechSpace Portfolio &bull; Security Confirmation
    </div>
  </div>
</body>
</html>`;
};
