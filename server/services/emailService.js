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
