import { Globe, Mail, Share2 } from 'lucide-react'

const RESOURCES = ['Car Reviews', 'Buying Advice', 'Car Insurance', 'Sitemap']
const COMPANY   = ['About Us', 'Privacy Policy', 'Cookies', 'Terms of Use']

export default function Footer() {
  return (
    <footer className="bg-deep-navy text-white">
      {/* Main footer content */}
      <div className="max-w-container mx-auto px-5 lg:px-10 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="font-grotesk text-xl font-bold mb-4">
              <span className="text-white">CAR</span>
              <span className="text-accent-red">FEVER</span>
            </div>
            <p className="text-body-sm text-white/60 leading-relaxed mb-5 max-w-[220px]">
              The UK's largest automotive marketplace, providing transparency and trust for buyers and sellers since 2024.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              {[
                { icon: <Globe size={16} />, label: 'Website' },
                { icon: <Mail size={16} />, label: 'Email' },
                { icon: <Share2 size={16} />, label: 'Share' },
              ].map(({ icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="p-2 rounded border border-white/15 text-white/50 hover:text-white hover:border-white/30 transition-colors"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Spacer on mobile */}
          <div className="hidden md:block" />

          {/* Resources */}
          <div>
            <h4 className="text-label-bold uppercase tracking-widest text-white/50 mb-4">Resources</h4>
            <ul className="space-y-2.5">
              {RESOURCES.map(item => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-body-sm text-white/70 hover:text-white transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-label-bold uppercase tracking-widest text-white/50 mb-4">Company</h4>
            <ul className="space-y-2.5">
              {COMPANY.map(item => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-body-sm text-white/70 hover:text-white transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-container mx-auto px-5 lg:px-10 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-body-sm text-white/40">
          <span>© 2024 CarFever. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-white/70 transition-colors">Contact Us</a>
            <a href="#" className="hover:text-white/70 transition-colors">Help Center</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
