import SearchWidget from './SearchWidget'

export default function HeroSection({ onSearch }) {
  return (
    <section className="relative min-h-[520px] flex items-center justify-center overflow-hidden pt-16">
      {/* Background: deep navy with subtle gradient and geometric overlay */}
      <div className="absolute inset-0 bg-deep-navy" />

      {/* Decorative radial glow */}
      <div className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 110%, #002c5f, transparent)',
        }}
      />

      {/* Subtle grid pattern for depth */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Abstract car silhouette accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-container mx-auto px-5 lg:px-10 py-14 flex flex-col items-center text-center">
        {/* Eyebrow label */}
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-label-bold text-white/70 uppercase tracking-widest mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-red" />
          UK's No. 1 Automotive Marketplace
        </span>

        {/* Headline */}
        <h1 className="font-grotesk font-bold text-white text-headline-lg-mobile md:text-headline-lg lg:text-display-lg mb-3 max-w-2xl">
          Find your perfect car
        </h1>

        {/* Sub-headline */}
        <p className="text-body-md text-white/60 mb-10 max-w-md">
          Browse over 142,000 vehicles from trusted dealers and private sellers across the UK.
        </p>

        {/* Search Widget */}
        <div className="w-full max-w-3xl">
          <SearchWidget onSearch={onSearch} />
        </div>

        {/* Trust indicators */}
        <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-body-sm text-white/50">
          <span>✓ 142,593 live listings</span>
          <span>✓ Free history checks</span>
          <span>✓ Verified sellers</span>
        </div>
      </div>
    </section>
  )
}
