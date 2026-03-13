"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShieldCheck, LogOut, ChevronDown, Wallet, Zap } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Submit KYC", path: "/kyc" },
    { name: "Verify Proof", path: "/verify" },
    { name: "Explorer", path: "/explorer" }
  ];

  const { isConnected, address, shortAddress, isDemoMode, connectWallet, disconnectWallet } = useWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      <div className="container relative flex h-20 max-w-screen-2xl items-center justify-between px-4 mx-auto">
        {/* Logo */}
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
        
        {/* Center: Wallet + Nav Links */}
        <nav className="hidden md:flex items-center gap-2 bg-black/40 px-2 py-2 rounded-full border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          {/* Connect Wallet — First & Prominent */}
          {!isConnected ? (
            <button
              onClick={connectWallet}
              className="relative flex items-center gap-2.5 px-6 py-2 rounded-full font-bold text-sm tracking-wide transition-all duration-300 bg-gradient-to-r from-primary to-emerald-400 text-black shadow-[0_0_25px_rgba(52,211,153,0.4)] hover:shadow-[0_0_40px_rgba(52,211,153,0.6)] hover:scale-[1.03] active:scale-[0.98] overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
              <Wallet className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Connect Wallet</span>
            </button>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 px-5 py-2 rounded-full font-bold text-sm tracking-wide transition-all duration-300 bg-primary/15 border border-primary/30 text-primary shadow-[0_0_15px_rgba(52,211,153,0.15)] hover:shadow-[0_0_25px_rgba(52,211,153,0.3)] hover:bg-primary/20"
              >
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="font-mono text-xs">{shortAddress}</span>
                {isDemoMode && <span className="text-[8px] font-black bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-widest">Demo</span>}
                <ChevronDown className={`w-3.5 h-3.5 text-primary/60 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-56 py-2 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[60] animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-white/5 mb-1">
                    <p className="text-[9px] uppercase tracking-widest text-primary font-black flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      {isDemoMode ? "Demo Identity (Testnet)" : "Connected Identity"}
                    </p>
                    <p className="text-[11px] text-zinc-300 truncate font-mono mt-1.5">{address}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (address) {
                        navigator.clipboard.writeText(address);
                        setIsDropdownOpen(false);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 transition-colors text-left rounded-lg mx-1"
                    style={{ width: 'calc(100% - 8px)' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    Copy Address
                  </button>

                  <button
                    onClick={() => {
                      disconnectWallet();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors rounded-lg mx-1"
                    style={{ width: 'calc(100% - 8px)' }}
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="w-px h-5 bg-primary/20 mx-1" />

          {/* Nav Links — same style as Connect Wallet */}
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`relative text-sm font-bold tracking-wide transition-all duration-300 px-5 py-2 rounded-full overflow-hidden group bg-gradient-to-r from-primary to-emerald-400 text-black shadow-[0_0_25px_rgba(52,211,153,0.4)] hover:shadow-[0_0_40px_rgba(52,211,153,0.6)] hover:scale-[1.03] active:scale-[0.98] ${
                  isActive ? "ring-2 ring-white/30 ring-offset-1 ring-offset-black" : ""
                }`}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                <span className="relative z-10">{link.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right side — Algorand Testnet live badge */}
        <div className="flex items-center gap-3">
          <a 
            href="https://lora.algokit.io/testnet" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/10 border border-primary/25 hover:border-primary/40 hover:bg-primary/15 hover:shadow-[0_0_20px_rgba(52,211,153,0.15)] transition-all duration-300 group cursor-pointer"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <div className="absolute w-3.5 h-3.5 rounded-full border border-primary/30 animate-ping" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-primary group-hover:text-emerald-300 transition-colors">Algorand Testnet</span>
            <Zap className="w-3 h-3 text-primary/60 group-hover:text-primary transition-colors" />
          </a>

          {/* Mobile-only Connect Button */}
          {!isConnected && (
            <button
              onClick={connectWallet}
              className="md:hidden flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs tracking-wide bg-gradient-to-r from-primary to-emerald-400 text-black shadow-[0_0_20px_rgba(52,211,153,0.3)]"
            >
              <Wallet className="w-3.5 h-3.5" />
              Connect
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
