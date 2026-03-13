import Link from 'next/link';
import { Github, Twitter, ShieldCheck, ExternalLink, Mail } from "lucide-react"

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-black/40 pt-16 pb-8 overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 rounded-[100%] blur-[100px] -z-10 pointer-events-none" />
      
      <div className="container px-4 mx-auto max-w-screen-2xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          <div className="col-span-1 lg:col-span-6 lg:pr-12">
            <Link href="/" className="flex items-center space-x-3 mb-6 group inline-flex">
              <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <span className="font-black text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-primary drop-shadow-sm">
                AlgoPlonk
              </span>
            </Link>
            <p className="text-zinc-400 text-sm max-w-sm mb-8 leading-relaxed">
              Pioneering privacy-preserving KYC verification utilizing advanced Zero Knowledge Proofs. 
              Verify your identity seamlessly without ever revealing sensitive personal data to centralized servers.
            </p>
            <div className="flex items-center space-x-4">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-all">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-secondary/10 hover:text-secondary hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="mailto:info@algoplonk.io" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-white transition-all">
                <Mail className="h-5 w-5" />
                <span className="sr-only">Email</span>
              </a>
            </div>
          </div>
          
          <div className="col-span-1 lg:col-span-3 sm:col-span-1/2">
            <h3 className="font-bold mb-6 text-zinc-100 tracking-wide">Platform</h3>
            <ul className="space-y-4 text-sm text-zinc-400">
              <li><Link href="/kyc" className="hover:text-primary transition-colors flex items-center gap-2">Submit ZK-KYC</Link></li>
              <li><Link href="/generate" className="hover:text-primary transition-colors flex items-center gap-2">Proof Engine</Link></li>
              <li><Link href="/verify" className="hover:text-primary transition-colors flex items-center gap-2">Verification Node</Link></li>
              <li><Link href="/explorer" className="hover:text-primary transition-colors flex items-center gap-2">Network Explorer</Link></li>
            </ul>
          </div>
          
          <div className="col-span-1 lg:col-span-3 sm:col-span-1/2">
            <h3 className="font-bold mb-6 text-zinc-100 tracking-wide">Resources</h3>
            <ul className="space-y-4 text-sm text-zinc-400">
              <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2 group">Protocol Documentation <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a></li>
              <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2 group">PLONK Cryptography Paper <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a></li>
              <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2 group">Developer SDK <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a></li>
              <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2 group">Smart Contract Audits <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} AlgoPlonk Foundation. All rights reserved.</p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
