"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Submit KYC", path: "/kyc" },
    { name: "Verify Proof", path: "/verify" },
    { name: "Explorer", path: "/explorer" }
  ];

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      <div className="container relative flex h-20 max-w-screen-2xl items-center justify-between px-4 mx-auto">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-3 group relative">
            <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors shadow-[0_0_15px_rgba(52,211,153,0.2)]">
               <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <span className="font-black text-xl tracking-tight hidden sm:inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-primary drop-shadow-sm">
              AlgoPlonk
              <span className="text-zinc-500 font-medium ml-1.5 text-sm tracking-widest uppercase">ZK-KYC</span>
            </span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 bg-black/40 px-6 py-2.5 rounded-full border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`text-sm font-semibold tracking-wide transition-all duration-300 relative ${
                  isActive ? "text-primary drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-[0_0_10px_rgba(52,211,153,1)]" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-4">
            <Button variant="outline" className="hidden sm:flex border-primary/20 bg-primary/5 hover:bg-primary/20 text-primary font-bold tracking-wide shadow-[0_0_15px_rgba(52,211,153,0.1)] transition-all h-10 px-5 rounded-full">
                Connect Wallet
            </Button>
        </div>
      </div>
    </header>
  );
}
