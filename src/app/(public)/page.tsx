import Link from "next/link";

// ─── Shared layout shell ──────────────────────────────────────────────────

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Find a trusted cleaner{" "}
            <span className="text-gray-400">near you</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-500 sm:text-lg">
            Browse verified local cleaners, post a job, and book in minutes.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/cleaners"
              className="w-full rounded-xl bg-gray-900 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 sm:w-auto"
            >
              Find a cleaner
            </Link>
            <Link
              href="/register"
              className="w-full rounded-xl border-2 border-gray-200 px-7 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:w-auto"
            >
              Become a cleaner
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "1",
      title: "Post your job",
      body: "Describe what you need — location, size, preferred date. It takes under two minutes.",
    },
    {
      n: "2",
      title: "Get matched",
      body: "We surface verified cleaners in your area. Browse profiles, ratings, and pricing.",
    },
    {
      n: "3",
      title: "Job done",
      body: "Confirm your booking, pay securely, and leave a review when the work is complete.",
    },
  ];

  return (
    <section className="bg-neutral-50 py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            How it works
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Booking a cleaner has never been easier
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n} className="flex flex-col">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                {step.n}
              </div>
              <h3 className="mt-5 text-base font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{step.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function TrustBar() {
  const stats = [
    { value: "500+", label: "Verified cleaners" },
    { value: "10,000+", label: "Jobs completed" },
    { value: "4,200+", label: "5-star reviews" },
  ];

  return (
    <section className="bg-white py-16">
      <Container>
        <dl className="mx-auto grid max-w-3xl grid-cols-1 gap-10 text-center sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-sm text-gray-500">{stat.label}</dt>
              <dd className="mt-1 text-4xl font-bold tracking-tight text-gray-900">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="bg-gray-900 py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-400">
            Join hundreds of clients and cleaners already using Ameza to get
            the job done.
          </p>
          <Link
            href="/register"
            className="mt-10 inline-block rounded-xl bg-white px-7 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100"
          >
            Register now
          </Link>
        </div>
      </Container>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <TrustBar />
      <CtaBanner />
    </>
  );
}
