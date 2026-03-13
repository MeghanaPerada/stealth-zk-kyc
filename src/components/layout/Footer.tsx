import { ShieldCheck, Zap } from "lucide-react"

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-black/60 py-10 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/5 rounded-[100%] blur-[100px] -z-10 pointer-events-none" />
      
      <div className="container px-4 mx-auto max-w-screen-xl relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-primary">
                AlgoPlonk <span className="text-zinc-500 font-medium text-xs tracking-widest uppercase ml-1">ZK-KYC</span>
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Privacy-Preserving Identity Verification on Algorand
              </p>
            </div>
          </div>

          {/* Center: Tech badges */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/15 text-[9px] font-bold uppercase tracking-widest text-primary/60">
              <Zap className="w-3 h-3" /> Algorand
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/15 text-[9px] font-bold uppercase tracking-widest text-primary/60">
              <ShieldCheck className="w-3 h-3" /> Zero Knowledge
            </span>
          </div>
          
          {/* Right: Copyright */}
          <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest text-center md:text-right">
            <p>© 2025 AlgoPlonk ZK-KYC</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

