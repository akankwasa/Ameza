import Image from "next/image";
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
    <section className="overflow-hidden bg-white">
      <Container>
        <div className="grid min-h-[600px] grid-cols-1 items-center gap-12 py-20 lg:grid-cols-2 lg:py-0">

          {/* Text */}
          <div className="order-2 lg:order-1">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Find a trusted cleaner{" "}
              <span className="text-gray-400">near you</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-gray-500 sm:text-lg">
              Browse verified local cleaners, post a job, and book in minutes.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/cleaners"
                className="rounded-xl bg-gray-900 px-7 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-gray-800"
              >
                Find a cleaner
              </Link>
              <Link
                href="/register"
                className="rounded-xl border-2 border-gray-200 px-7 py-3 text-center text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                Become a cleaner
              </Link>
            </div>

            {/* Inline social proof */}
            <div className="mt-10 flex items-center gap-6">
              <div>
                <p className="text-2xl font-bold text-gray-900">500+</p>
                <p className="text-xs text-gray-400">Verified cleaners</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <p className="text-2xl font-bold text-gray-900">10k+</p>
                <p className="text-xs text-gray-400">Jobs completed</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <p className="text-2xl font-bold text-gray-900">4.8★</p>
                <p className="text-xs text-gray-400">Average rating</p>
              </div>
            </div>
          </div>

          {/* Hero photo */}
          <div className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-3xl shadow-2xl lg:aspect-[3/4]">
              <Image
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80"
                alt="Sparkling clean modern kitchen"
                width={900}
                height={1200}
                className="h-72 w-full object-cover lg:h-full"
                priority
              />
              {/* Floating badge */}
              <div className="absolute bottom-5 left-5 rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
                <p className="text-xs font-semibold text-gray-900">✓ Verified &amp; insured</p>
                <p className="mt-0.5 text-xs text-gray-500">Every cleaner on Ameza</p>
              </div>
            </div>
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
      img: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=400&q=70",
      imgAlt: "Person using a smartphone to book a cleaner",
    },
    {
      n: "2",
      title: "Get matched",
      body: "We surface verified cleaners in your area. Browse profiles, ratings, and pricing.",
      img: "https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=400&q=70",
      imgAlt: "Professional cleaner reviewing a job",
    },
    {
      n: "3",
      title: "Job done",
      body: "Confirm your booking, pay securely, and leave a review when the work is complete.",
      img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=70",
      imgAlt: "Cleaner leaving a spotless home",
    },
  ];

  return (
    <section className="bg-neutral-50 py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">How it works</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Booking a cleaner has never been easier
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n} className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={step.img}
                  alt={step.imgAlt}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <span className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-900 shadow">
                  {step.n}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-base font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function PhotoStrip() {
  const photos = [
    { src: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=600&q=70", alt: "Bright clean living room" },
    { src: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=70", alt: "Spotless modern bedroom" },
    { src: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=600&q=70", alt: "Gleaming clean bathroom" },
    { src: "https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?auto=format&fit=crop&w=600&q=70", alt: "Professional cleaning equipment" },
  ];

  return (
    <section className="bg-white py-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {photos.map((p) => (
          <div key={p.src} className="relative aspect-square overflow-hidden">
            <Image src={p.src} alt={p.alt} fill className="object-cover transition-transform duration-500 hover:scale-105" />
          </div>
        ))}
      </div>
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
    <section className="bg-neutral-50 py-16">
      <Container>
        <dl className="mx-auto grid max-w-3xl grid-cols-1 gap-10 text-center sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-sm text-gray-500">{stat.label}</dt>
              <dd className="mt-1 text-4xl font-bold tracking-tight text-gray-900">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Background photo */}
      <Image
        src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1400&q=70"
        alt="Professional cleaner at work"
        fill
        className="object-cover"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gray-900/85" />

      <Container className="relative z-10">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-300">
            Join hundreds of clients and cleaners already using Ameza to get the job done.
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
      <PhotoStrip />
      <TrustBar />
      <CtaBanner />
    </>
  );
}
