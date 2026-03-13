"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShieldCheck, LogOut, ChevronDown, Wallet } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Submit KYC", path: "/kyc" },
    { name: "Verify Proof", path: "/verify" },
    { name: "Explorer", path: "/explorer" }
  ];

  const { isConnected, address, shortAddress, connectWallet, disconnectWallet } = useWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
          {!isConnected ? (
            <Button 
              onClick={connectWallet}
              variant="outline" 
              className="hidden sm:flex border-primary/20 bg-primary/5 hover:bg-primary/20 text-primary font-bold tracking-wide shadow-[0_0_15px_rgba(52,211,153,0.1)] transition-all h-10 px-5 rounded-full items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </Button>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <Button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                variant="outline"
                className="flex border-primary/20 bg-primary/10 hover:bg-primary/20 text-white font-medium tracking-wide shadow-[0_0_15px_rgba(52,211,153,0.1)] transition-all h-10 px-4 rounded-full items-center gap-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="text-sm font-mono">{shortAddress}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </Button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 py-2 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[60] animate-in fade-in zoom-in-95 duration-200">
                  {/* 
                     The wallet represents the user's decentralized identity in the ZK-KYC system 
                     and will later be used to link generated zero-knowledge proofs.
                  */}
                  <div className="px-4 py-2 border-b border-white/5 mb-1">
                    <p className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      Digital Identity
                    </p>
                    <p className="text-xs text-zinc-300 truncate font-mono mt-1">{address}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (address) {
                        navigator.clipboard.writeText(address);
                        setIsDropdownOpen(false);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </div>
                    Copy Address
                  </button>

                  <button
                    onClick={() => {
                      disconnectWallet();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
