import { useState, useRef } from 'react';
import portfolioService from '../services/portfolioService';
import analyticsService from '../services/analyticsService';

function Contact({ profile }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const formStartedRef = useRef(false);

  const handleFormStart = () => {
    if (!formStartedRef.current) {
      formStartedRef.current = true;
      analyticsService.trackContactFormStart();
    }
  };

  const [status, setStatus] = useState({
    type: 'idle', // 'idle' | 'submitting' | 'success' | 'error'
    message: '',
  });

  const contactEmail = profile?.email || 'yourmail@example.com';
  const contactLocation = profile?.location || 'Greater Noida, India';

  const handleChange = (e) => {
    handleFormStart();
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (status.type === 'error') {
      setStatus({ type: 'idle', message: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.subject.trim() ||
      !formData.message.trim()
    ) {
      setStatus({
        type: 'error',
        message: 'Please fill in all fields before sending.',
      });
      return;
    }

    setStatus({ type: 'submitting', message: '' });

    try {
      await portfolioService.sendMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      // Track successful form submission (strictly no PII in analytics)
      analyticsService.trackContactFormSubmit();

      setStatus({
        type: 'success',
        message: 'Thank you! Your message has been sent successfully.',
      });

      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.message || 'Failed to send message. Please try again.',
      });
    }
  };

  const isSubmitting = status.type === 'submitting';

  return (
    <section
      id="contact"
      className="bg-[#F8FAFC] px-5 py-20 text-[#0F172A] transition-colors duration-200 dark:bg-[#0B1220] dark:text-white sm:py-24 md:px-8"
    >
      <div className="reveal-on-scroll mx-auto max-w-6xl">
        {/* Section Heading */}
        <div className="mb-14 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-cyan-400 sm:text-sm">
            Let's connect
          </p>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Get In Touch
          </h2>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-blue-600 dark:bg-cyan-400" />

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-400">
            Have a project, job opportunity, or collaboration in mind? Reach out below and I'll get back to you promptly.
          </p>
        </div>

        {/* Contact Layout */}
        <div className="grid gap-8 md:grid-cols-5">
          {/* Contact Information Card */}
          <div className="md:col-span-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-[#111827]">
              <h3 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white">
                Let's talk
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                I'm always open to discussing new engineering opportunities, product ideas, or answering questions.
              </p>

              <div className="mt-8 space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Email
                  </p>
                  <a
                    href={`mailto:${contactEmail}`}
                    onClick={() => analyticsService.trackLinkClick('email_click')}
                    className="mt-1 block text-sm font-medium text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-cyan-400"
                  >
                    {contactEmail}
                  </a>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Location
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {contactLocation}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Available for
                  </p>
                  <p className="mt-1 text-sm font-semibold text-blue-600 dark:text-cyan-400">
                    Full-Time Engineering Opportunities
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Card */}
          <div className="md:col-span-3">
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-[#111827]"
            >
              {/* Status Feedback Banners */}
              {status.type === 'success' && (
                <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold">✓</span>
                    <p className="font-medium">{status.message}</p>
                  </div>
                </div>
              )}

              {status.type === 'error' && (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold">⚠</span>
                    <p className="font-medium">{status.message}</p>
                  </div>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-[#0F172A] outline-none transition duration-200 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/20"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-[#0F172A] outline-none transition duration-200 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/20"
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="mt-5">
                <label
                  htmlFor="subject"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What would you like to discuss?"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-[#0F172A] outline-none transition duration-200 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/20"
                />
              </div>

              {/* Message */}
              <div className="mt-5">
                <label
                  htmlFor="message"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  rows="5"
                  required
                  disabled={isSubmitting}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Write your message here..."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-[#0F172A] outline-none transition duration-200 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/20"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-lg active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 dark:hover:shadow-cyan-400/20"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Sending Message...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;