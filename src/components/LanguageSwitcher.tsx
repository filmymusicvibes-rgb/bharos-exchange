import { useState, useEffect, useRef } from 'react'
import { LANGUAGES, getLang, setLang, type LangCode } from '../lib/i18n'
import { Globe, ChevronDown, Check } from 'lucide-react'

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<LangCode>(getLang())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setCurrent(getLang())
    window.addEventListener('langchange', handler)
    return () => window.removeEventListener('langchange', handler)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentLang = LANGUAGES.find(l => l.code === current) || LANGUAGES[0]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all text-xs group"
      >
        <Globe className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-gray-300 group-hover:text-white transition hidden sm:inline">{currentLang.native}</span>
        <span className="text-gray-300 group-hover:text-white transition sm:hidden">{currentLang.flag}</span>
        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-[#0d1117]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
          <div className="p-2 border-b border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold px-2">Select Language</p>
          </div>

          <div className="max-h-64 overflow-y-auto p-1.5">
            {/* English — Default */}
            {LANGUAGES.filter(l => l.code === 'en').map(lang => (
              <button
                key={lang.code}
                onClick={() => { setLang(lang.code); setCurrent(lang.code); setOpen(false); window.location.reload() }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                  current === lang.code
                    ? 'bg-cyan-500/10 border border-cyan-500/20'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{lang.flag}</span>
                  <div>
                    <p className={`text-xs font-medium ${current === lang.code ? 'text-cyan-400' : 'text-white'}`}>{lang.native}</p>
                    <p className="text-[10px] text-gray-500">Default</p>
                  </div>
                </div>
                {current === lang.code && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            ))}

            {/* Indian Languages */}
            <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold px-2 py-1 mt-2">🇮🇳 India</p>
            {LANGUAGES.filter(l => ['hi', 'ta', 'kn', 'ml', 'bn', 'te'].includes(l.code)).map(lang => (
              <button
                key={lang.code}
                onClick={() => { setLang(lang.code); setCurrent(lang.code); setOpen(false); window.location.reload() }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                  current === lang.code
                    ? 'bg-cyan-500/10 border border-cyan-500/20'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{lang.flag}</span>
                  <div>
                    <p className={`text-xs font-medium ${current === lang.code ? 'text-cyan-400' : 'text-white'}`}>{lang.native}</p>
                    <p className="text-[10px] text-gray-500">{lang.name}</p>
                  </div>
                </div>
                {current === lang.code && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            ))}

            {/* International */}
            <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold px-2 py-1 mt-2">🌍 International</p>
            {LANGUAGES.filter(l => ['es', 'ar', 'zh'].includes(l.code)).map(lang => (
              <button
                key={lang.code}
                onClick={() => { setLang(lang.code); setCurrent(lang.code); setOpen(false); window.location.reload() }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                  current === lang.code
                    ? 'bg-cyan-500/10 border border-cyan-500/20'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{lang.flag}</span>
                  <div>
                    <p className={`text-xs font-medium ${current === lang.code ? 'text-cyan-400' : 'text-white'}`}>{lang.native}</p>
                    <p className="text-[10px] text-gray-500">{lang.name}</p>
                  </div>
                </div>
                {current === lang.code && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
