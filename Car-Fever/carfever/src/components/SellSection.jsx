import { ShieldCheck, Tag, BarChart3, ChevronRight } from 'lucide-react'

const TRUST_CARDS = [
  {
    icon: <ShieldCheck size={28} strokeWidth={1.5} />,
    title: 'Buyer Protection',
    body: 'Every car on CarFever undergoes a comprehensive 5-point safety and history check.',
    link: 'Learn more',
  },
  {
    icon: <BarChart3 size={28} strokeWidth={1.5} />,
    title: 'Free Valuation',
    body: 'Instant, data-driven valuations backed by 500,000+ real UK sales every month.',
    link: 'Get a valuation',
  },
  {
    icon: <Tag size={28} strokeWidth={1.5} />,
    title: 'No Hidden Fees',
    body: 'Transparent pricing from the first click. What you see is exactly what you pay.',
    link: 'How it works',
  },
]

export default function SellSection() {
  return (
    <section className="py-14 bg-white">
      <div className="max-w-container mx-auto px-5 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Main sell CTA card */}
          <div className="lg:col-span-3 rounded-lg bg-deep-navy p-8 md:p-12 flex flex-col justify-between min-h-[280px] relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-navy-mid opacity-60" />
            <div className="absolute -right-4 bottom-0 w-32 h-32 rounded-full bg-navy-mid opacity-40" />

            <div className="relative z-10">
              <span className="inline-block text-label-bold uppercase tracking-widest text-white/50 mb-4">
                Sell with us
              </span>
              <h2 className="font-grotesk font-bold text-2xl md:text-[32px] text-white leading-tight mb-4 max-w-sm">
                Sell your car with confidence
              </h2>
              <p className="text-body-md text-white/70 max-w-sm leading-relaxed">
                Whether you're trading in or selling privately, we provide the tools to get the best value for your vehicle.
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap gap-3 mt-8">
              <a
                href="#"
                className="px-6 py-3 rounded bg-accent-red text-white font-semibold text-body-sm hover:bg-red-bright active:scale-[0.98] transition-all duration-150"
              >
                Get a free valuation
              </a>
              <a
                href="#"
                className="px-6 py-3 rounded border border-white/40 text-white font-semibold text-body-sm hover:bg-white/10 active:scale-[0.98] transition-all duration-150"
              >
                List it yourself
              </a>
            </div>
          </div>

          {/* Trust cards stack */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {TRUST_CARDS.map(({ icon, title, body, link }) => (
              <div
                key={title}
                className="flex gap-4 p-5 rounded-lg border border-outline-variant bg-white hover:shadow-card transition-shadow duration-200"
              >
                <div className="flex-shrink-0 text-deep-navy mt-0.5">
                  {icon}
                </div>
                <div>
                  <h3 className="font-grotesk font-semibold text-body-md text-deep-navy mb-1">{title}</h3>
                  <p className="text-body-sm text-on-surface-variant leading-relaxed">{body}</p>
                  <a
                    href="#"
                    className="inline-flex items-center gap-1 mt-2 text-body-sm font-semibold text-deep-navy hover:text-accent-red transition-colors"
                  >
                    {link} <ChevronRight size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
