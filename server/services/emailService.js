import nodemailer from 'nodemailer';

export const sendContactEmail = async ({ name, email, subject, message }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email credentials not configured. Skipping email dispatch.');
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

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

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

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

