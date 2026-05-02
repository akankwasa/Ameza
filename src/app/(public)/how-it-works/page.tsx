import Link from "next/link";

function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">{children}</div>;
}

const CLIENT_STEPS = [
  { n: "1", title: "Post a job",   body: "Describe what you need — service type, suburb, preferred date and time. Takes under two minutes." },
  { n: "2", title: "Get matched",  body: "Our team reviews your job and matches you with a verified local cleaner who covers your area." },
  { n: "3", title: "Job done",     body: "Confirm the booking, message your cleaner directly, and leave a review when complete." },
];

const CLEANER_STEPS = [
  { n: "1", title: "Create your profile", body: "Submit your services, hourly rate, suburbs, and availability. Upload your ID and police check for verification." },
  { n: "2", title: "Get verified",        body: "Our team reviews your documents manually. Once approved your profile is visible to clients in your area." },
  { n: "3", title: "Start earning",       body: "Receive job assignments, message clients directly, and mark jobs complete — all from your dashboard." },
];

const TRUST = [
  { title: "ID verified",   body: "Every cleaner submits a government-issued ID before their profile goes live." },
  { title: "Police checked", body: "A current police check (within 12 months) is required for all cleaners." },
  { title: "Insured",        body: "Public liability insurance is mandatory — clients are protected on every job." },
];

const FAQS = [
  { q: "How does Ameza verify cleaners?",       a: "Every cleaner submits a government-issued ID, a police check (issued within 12 months), and a public liability insurance certificate. Our team reviews each document manually before approving the profile." },
  { q: "Is there a fee to use Ameza?",          a: "Posting a job and browsing cleaners is free for clients. Cleaner payouts and platform fees will be handled via Stripe — details coming soon." },
  { q: "How quickly will I be matched?",        a: "Most jobs are matched within a few hours during business hours. You'll receive an email notification as soon as a cleaner is assigned." },
  { q: "Can I message the cleaner?",            a: "Yes. Once a cleaner is matched to your job, a direct message thread opens on the job detail page for both parties." },
  { q: "What if I need to cancel?",             a: "You can cancel a job from your dashboard before it is confirmed. Please do so as early as possible to be considerate of the cleaner's time." },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-white">

      {/* Hero */}
      <section className="bg-neutral-50 py-20 sm:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              How Ameza works
            </h1>
            <p className="mt-5 text-lg text-gray-500">
              A simple, transparent marketplace connecting clients with verified local cleaners.
            </p>
          </div>
        </Container>
      </section>

      {/* Steps — two column */}
      <section className="py-20 sm:py-24">
        <Container>
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">

            {/* For clients */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">For clients</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Book a cleaner in minutes</h2>
              <p className="mt-4 text-base text-gray-500">No searching, no chasing quotes. Describe your job and we handle the matching.</p>
              <div className="mt-10 space-y-8">
                {CLIENT_STEPS.map(s => (
                  <div key={s.n} className="flex gap-5">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">{s.n}</div>
                    <div>
                      <p className="text-base font-semibold text-gray-900">{s.title}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/register" className="mt-10 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800">
                Post your first job
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path fillRule="evenodd" d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z" clipRule="evenodd" /></svg>
              </Link>
            </div>

            {/* For cleaners */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">For cleaners</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Grow your cleaning business</h2>
              <p className="mt-4 text-base text-gray-500">Join a trusted platform, get matched with local clients, and keep more of what you earn.</p>
              <div className="mt-10 space-y-8">
                {CLEANER_STEPS.map(s => (
                  <div key={s.n} className="flex gap-5">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">{s.n}</div>
                    <div>
                      <p className="text-base font-semibold text-gray-900">{s.title}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/register" className="mt-10 inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-900">
                Apply as a cleaner
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path fillRule="evenodd" d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z" clipRule="evenodd" /></svg>
              </Link>
            </div>

          </div>
        </Container>
      </section>

      {/* Trust signals */}
      <section className="bg-neutral-50 py-16">
        <Container>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {TRUST.map(t => (
              <div key={t.title} className="rounded-2xl bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 text-emerald-600"><path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" /></svg>
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-900">{t.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{t.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-24">
        <Container>
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Frequently asked questions</h2>
            <div className="mt-10 divide-y divide-gray-100">
              {FAQS.map(faq => (
                <details key={faq.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180"><path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-gray-500">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 py-20">
        <Container>
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white">Ready to get started?</h2>
            <p className="mt-4 text-base text-gray-400">Join clients and cleaners already using Ameza.</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/register" className="w-full rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 sm:w-auto">Create an account</Link>
              <Link href="/cleaners" className="w-full rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto">Browse cleaners</Link>
            </div>
          </div>
        </Container>
      </section>

    </div>
  );
}
