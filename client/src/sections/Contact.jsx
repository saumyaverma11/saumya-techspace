function Contact() {
  return (
    <section
      id="contact"
      className="bg-slate-950 px-5 py-20 text-white sm:py-24 md:px-8"
    >
      <div className="mx-auto max-w-6xl">

        {/* Heading */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Let's connect
          </p>

          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            Get In Touch
          </h2>

          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-cyan-400" />

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Have a project, opportunity or question? Feel free to reach out.
            I'll get back to you as soon as possible.
          </p>
        </div>


        {/* Contact Layout */}
        <div className="grid gap-8 md:grid-cols-5">

          {/* Contact Information */}
          <div className="md:col-span-2">

            <div className="rounded-3xl border border-white/10 bg-slate-900 p-7">

              <h3 className="text-2xl font-semibold">
                Let's talk
              </h3>

              <p className="mt-4 text-sm leading-7 text-slate-400">
                I'm always open to discussing new opportunities,
                interesting projects and ideas.
              </p>

              <div className="mt-8 space-y-5">

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Email
                  </p>

                  <a
                    href="mailto:yourmail@example.com"
                    className="mt-1 block text-sm text-slate-300 hover:text-cyan-400"
                  >
                    yourmail@example.com
                  </a>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Location
                  </p>

                  <p className="mt-1 text-sm text-slate-300">
                    Greater Noida, India
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Available for
                  </p>

                  <p className="mt-1 text-sm text-cyan-400">
                    Full-Time Opportunities
                  </p>
                </div>

              </div>

            </div>

          </div>


          {/* Contact Form */}
          <div className="md:col-span-3">

            <form
              className="rounded-3xl border border-white/10 bg-slate-900 p-7"
            >

              <div className="grid gap-5 sm:grid-cols-2">

                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Name
                  </label>

                  <input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                  />
                </div>


                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                  />
                </div>

              </div>


              {/* Subject */}
              <div className="mt-5">
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Subject
                </label>

                <input
                  id="subject"
                  type="text"
                  placeholder="What would you like to discuss?"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                />
              </div>


              {/* Message */}
              <div className="mt-5">
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Message
                </label>

                <textarea
                  id="message"
                  rows="6"
                  placeholder="Write your message..."
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                />
              </div>


              {/* Submit */}
              <button
                type="submit"
                className="mt-6 w-full rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Send Message
              </button>

            </form>

          </div>

        </div>

      </div>
    </section>
  )
}

export default Contact