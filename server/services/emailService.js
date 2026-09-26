import nodemailer from 'nodemailer';

// Helper function to create Nodemailer transporter for Gmail SMTP
const getTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL/TLS on port 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    connectionTimeout: 10000, // 10s connection timeout
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
};

export const sendContactEmail = async ({ name, email, subject, message }) => {
  const formattedDate = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const textContent = `New Portfolio Contact Message\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}\n\nReceived:\n${formattedDate}\n\nSaumya TechSpace\nPortfolio Contact Form`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="border-bottom: 2px solid #06b6d4; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #0f172a; font-size: 22px;">New Portfolio Contact Message</h2>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Received from Saumya TechSpace Portfolio</p>
      </div>

      <div style="margin-bottom: 16px; background-color: #f8fafc; padding: 16px; border-radius: 8px;">
        <p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Name:</strong> ${name}</p>
        <p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #0284c7; text-decoration: none;">${email}</a></p>
        <p style="margin: 0; font-size: 15px;"><strong>Subject:</strong> ${subject}</p>
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #0f172a;">Message:</h3>
        <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; font-size: 15px; line-height: 1.6; white-space: pre-wrap; color: #334155;">${message}</div>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 13px; color: #94a3b8;">
        <p style="margin: 0 0 4px 0;"><strong>Received:</strong> ${formattedDate}</p>
        <p style="margin: 0;">Saumya TechSpace &bull; Portfolio Contact Form</p>
      </div>
    </div>
  `;

  // Production: If RESEND_API_KEY is configured, dispatch via Resend HTTPS API (bypasses Render SMTP port blocking)
  if (process.env.RESEND_API_KEY) {
    const toAddress = (process.env.CONTACT_RECEIVER || process.env.EMAIL_USER || '').trim();
    if (!toAddress) {
      console.warn('Neither CONTACT_RECEIVER nor EMAIL_USER is configured. Skipping email dispatch.');
      return { skipped: true };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Saumya TechSpace <onboarding@resend.dev>',
        to: [toAddress],
        reply_to: email,
        subject: `New Portfolio Contact — ${subject}`,
        text: textContent,
        html: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errMessage = errorData.message || response.statusText || 'Unknown error';
      throw new Error(`Resend API HTTP ${response.status}: ${errMessage}`);
    }

    const resendData = await response.json();
    return { success: true, messageId: resendData.id, provider: 'resend' };
  }

  // Localhost / Development: fallback to Gmail SMTP
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email credentials not configured. Skipping email dispatch.');
    return { skipped: true };
  }

  const transporter = getTransporter();

  const mailOptions = {
    from: `Saumya TechSpace <${process.env.EMAIL_USER}>`,
    to: process.env.CONTACT_RECEIVER || process.env.EMAIL_USER,
    replyTo: email,
    subject: `New Portfolio Contact — ${subject}`,
    text: textContent,
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

export const sendPasswordResetEmail = async ({ toEmail, resetToken }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email credentials not configured. Skipping email dispatch.');
    return { skipped: true };
  }

  const transporter = getTransporter();

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  const textContent = `Saumya TechSpace — Password Reset Request\n\nYou requested a password reset for your portfolio admin account.\n\nPlease reset your password using the following link:\n${resetUrl}\n\nThis link is valid for 15 minutes. If you did not request this, please ignore this email.\n\nSaumya TechSpace Admin Security`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="border-bottom: 2px solid #06b6d4; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #0f172a; font-size: 22px;">Saumya TechSpace</h2>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Password Reset Request</p>
      </div>

      <div style="margin-bottom: 20px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6;">You recently requested to reset your password for the Saumya TechSpace portfolio admin account. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #06b6d4; color: #0f172a; padding: 12px 28px; font-weight: bold; border-radius: 8px; text-decoration: none; display: inline-block; font-size: 15px;">Reset Admin Password</a>
        </div>
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">Or copy and paste this link into your browser:</p>
        <p style="margin: 0; font-size: 13px; word-break: break-all;"><a href="${resetUrl}" style="color: #0284c7; text-decoration: none;">${resetUrl}</a></p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 13px; color: #94a3b8;">
        <p style="margin: 0 0 4px 0;"><strong>Notice:</strong> This password reset link is valid for <strong>15 minutes</strong>.</p>
        <p style="margin: 0;">If you did not request a password reset, please ignore this email.</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `Saumya TechSpace <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Password Reset Request — Saumya TechSpace',
    text: textContent,
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

export const sendResumeRequestNotification = async ({
  requestId,
  visitorName,
  visitorEmail,
  message,
  requestedAt,
  rawApproveToken,
  rawRejectToken
}) => {
  const formattedDate = new Date(requestedAt).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const baseUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
  const approveUrl = rawApproveToken
    ? `${baseUrl}/api/resume-requests/email-action/approve?token=${rawApproveToken}`
    : `${clientUrl}/admin/resume-requests`;
  const rejectUrl = rawRejectToken
    ? `${baseUrl}/api/resume-requests/email-action/reject?token=${rawRejectToken}`
    : `${clientUrl}/admin/resume-requests`;
  const adminDashboardUrl = `${clientUrl}/admin/resume-requests`;

  const textContent = `New Resume Download Request\n\nName: ${visitorName}\nEmail: ${visitorEmail}\n${message ? `Message: ${message}\n` : ''}Request ID: ${requestId}\nRequested At: ${formattedDate}\nStatus: Pending\n\nActions:\n[ APPROVE REQUEST ]:\n${approveUrl}\n\n[ REJECT REQUEST ]:\n${rejectUrl}\n\nOr review this request in the Admin Panel:\n${adminDashboardUrl}\n\nSaumya TechSpace Portfolio`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="border-bottom: 2px solid #06b6d4; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #0f172a; font-size: 22px;">New Resume Download Request</h2>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Received from Saumya TechSpace Portfolio</p>
      </div>

      <div style="margin-bottom: 16px; background-color: #f8fafc; padding: 16px; border-radius: 8px;">
        <p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Name:</strong> ${visitorName}</p>
        <p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Email:</strong> <a href="mailto:${visitorEmail}" style="color: #0284c7; text-decoration: none;">${visitorEmail}</a></p>
        ${message ? `<p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Message:</strong> ${message}</p>` : ''}
        <p style="margin: 0; font-size: 13px; color: #64748b;"><strong>Request ID:</strong> ${requestId}</p>
      </div>

      <div style="margin-bottom: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; text-align: center;">
        <p style="margin: 0 0 14px 0; font-size: 14px; font-weight: bold; color: #0f172a;">Quick Actions (Direct from Email):</p>
        <div style="margin-bottom: 14px;">
          <a href="${approveUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; text-decoration: none; display: inline-block; margin-right: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">APPROVE REQUEST</a>
          <a href="${rejectUrl}" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; text-decoration: none; display: inline-block; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">REJECT REQUEST</a>
        </div>
        <p style="margin: 8px 0 0 0; font-size: 13px; color: #64748b;">
          Or review this request in the <a href="${adminDashboardUrl}" style="color: #0284c7; text-decoration: underline; font-weight: 500;">Admin Panel</a>.
        </p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 13px; color: #94a3b8;">
        <p style="margin: 0 0 4px 0;"><strong>Requested At:</strong> ${formattedDate}</p>
        <p style="margin: 0;">Saumya TechSpace &bull; Resume Download Request</p>
      </div>
    </div>
  `;

  // Production: If RESEND_API_KEY is configured, dispatch via Resend HTTPS API (bypasses Render SMTP port blocking)
  if (process.env.RESEND_API_KEY) {
    const toAddress = (process.env.CONTACT_RECEIVER || process.env.EMAIL_USER || '').trim();
    if (!toAddress) {
      console.warn('Neither CONTACT_RECEIVER nor EMAIL_USER is configured. Skipping resume request notification.');
      return { skipped: true };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Saumya TechSpace <onboarding@resend.dev>',
        to: [toAddress],
        reply_to: visitorEmail,
        subject: `New Resume Download Request — ${visitorName}`,
        text: textContent,
        html: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errMessage = errorData.message || response.statusText || 'Unknown error';
      throw new Error(`Resend API HTTP ${response.status}: ${errMessage}`);
    }

    const resendData = await response.json();
    return { success: true, messageId: resendData.id, provider: 'resend' };
  }

  // Localhost / Development: fallback to Gmail SMTP
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email credentials not configured. Skipping resume request notification.');
    return { skipped: true };
  }

  const transporter = getTransporter();

  const mailOptions = {
    from: `Saumya TechSpace <${process.env.EMAIL_USER}>`,
    to: process.env.CONTACT_RECEIVER || process.env.EMAIL_USER,
    replyTo: visitorEmail,
    subject: `New Resume Download Request — ${visitorName}`,
    text: textContent,
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

export const sendResumeApprovalEmail = async ({
  visitorName,
  visitorEmail,
  downloadUrl,
  expireDays
}) => {
  const textContent = `Your Resume Download Request Has Been Approved\n\nHi ${visitorName},\n\nYour resume download request has been approved.\n\nYou can access the authorized resume download here:\n${downloadUrl}\n\nThis link is valid for ${expireDays} days. After it expires, you will need to submit a new request.\n\nThank you for your interest.\n\nSaumya TechSpace`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="border-bottom: 2px solid #06b6d4; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #0f172a; font-size: 22px;">Resume Download Approved</h2>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Saumya TechSpace Portfolio</p>
      </div>

      <div style="margin-bottom: 20px;">
        <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.6;">Hi <strong>${visitorName}</strong>,</p>
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6;">Your resume download request has been <strong style="color: #059669;">approved</strong>. You can access the authorized resume download here:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${downloadUrl}" style="background-color: #06b6d4; color: #0f172a; padding: 12px 28px; font-weight: bold; border-radius: 8px; text-decoration: none; display: inline-block; font-size: 15px;">Open Resume</a>
        </div>
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">Or copy and paste this link into your browser:</p>
        <p style="margin: 0; font-size: 13px; word-break: break-all;"><a href="${downloadUrl}" style="color: #0284c7; text-decoration: none;">${downloadUrl}</a></p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 13px; color: #94a3b8;">
        <p style="margin: 0 0 4px 0;"><strong>Notice:</strong> This download link is valid for <strong>${expireDays} days</strong>.</p>
        <p style="margin: 0;">After it expires, you will need to submit a new download request.</p>
        <p style="margin: 8px 0 0 0;">Saumya TechSpace &bull; Resume Access</p>
      </div>
    </div>
  `;

  // Production: Try Resend HTTPS if key is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Saumya TechSpace <onboarding@resend.dev>',
          to: [visitorEmail],
          subject: 'Your Resume Download Request Has Been Approved — Saumya TechSpace',
          text: textContent,
          html: htmlContent
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`Visitor approval email via Resend skipped (${response.status}): ${errorData.message || response.statusText}`);
        return { skipped: true, reason: errorData.message };
      }

      const resendData = await response.json();
      return { success: true, messageId: resendData.id, provider: 'resend' };
    } catch (err) {
      console.warn('Visitor approval email dispatch error:', err.message);
      return { skipped: true, error: err.message };
    }
  }

  // Localhost / Development: fallback to Gmail SMTP
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email credentials not configured. Skipping resume approval email.');
    return { skipped: true };
  }

  const transporter = getTransporter();

  const mailOptions = {
    from: `Saumya TechSpace <${process.env.EMAIL_USER}>`,
    to: visitorEmail,
    subject: 'Your Resume Download Request Has Been Approved — Saumya TechSpace',
    text: textContent,
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

export const sendResumeRejectionEmail = async ({
  visitorName,
  visitorEmail,
  rejectionNote
}) => {
  const textContent = `Saumya TechSpace — Resume Download Request Update\n\nHi ${visitorName},\n\nThank you for your interest in downloading the resume.\n\nUnfortunately, your request was not approved at this time.\n${rejectionNote ? `\nNote: ${rejectionNote}\n` : ''}\nYou are welcome to reach out via the contact form if you have any questions.\n\nSaumya TechSpace`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="border-bottom: 2px solid #06b6d4; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #0f172a; font-size: 22px;">Resume Request Update</h2>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Saumya TechSpace Portfolio</p>
      </div>

      <div style="margin-bottom: 20px;">
        <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.6;">Hi <strong>${visitorName}</strong>,</p>
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6;">Thank you for your interest. Unfortunately, your resume download request was <strong style="color: #dc2626;">not approved</strong> at this time.</p>
        ${rejectionNote ? `<div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;"><p style="margin: 0; font-size: 14px; color: #334155;"><strong>Note:</strong> ${rejectionNote}</p></div>` : ''}
        <p style="margin: 0; font-size: 15px; line-height: 1.6;">You are welcome to reach out via the <a href="${(process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim()}/#contact" style="color: #0284c7; text-decoration: none;">contact form</a> if you have any questions.</p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 13px; color: #94a3b8;">
        <p style="margin: 0;">Saumya TechSpace &bull; Resume Access</p>
      </div>
    </div>
  `;

  // Production: Try Resend HTTPS if key is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Saumya TechSpace <onboarding@resend.dev>',
          to: [visitorEmail],
          subject: 'Resume Download Request Update — Saumya TechSpace',
          text: textContent,
          html: htmlContent
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`Visitor rejection email via Resend skipped (${response.status}): ${errorData.message || response.statusText}`);
        return { skipped: true, reason: errorData.message };
      }

      const resendData = await response.json();
      return { success: true, messageId: resendData.id, provider: 'resend' };
    } catch (err) {
      console.warn('Visitor rejection email dispatch error:', err.message);
      return { skipped: true, error: err.message };
    }
  }

  // Localhost / Development: fallback to Gmail SMTP
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email credentials not configured. Skipping resume rejection email.');
    return { skipped: true };
  }

  const transporter = getTransporter();

  const mailOptions = {
    from: `Saumya TechSpace <${process.env.EMAIL_USER}>`,
    to: visitorEmail,
    subject: 'Resume Download Request Update — Saumya TechSpace',
    text: textContent,
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

