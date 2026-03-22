"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, ShieldCheck, Sparkles, ArrowRight, 
  TrendingUp, Wallet, Globe, Zap, 
  BarChart3, Landmark, Cpu, CreditCard
} from "lucide-react";
import PageWrapper from "@/components/layout/PageWrapper";
import { GlowingCard } from "@/components/ui/glowing-card";
import { useWallet } from "@/hooks/useWallet";

export default function PremiumPortal() {
  const { isConnected } = useWallet();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [proofId, setProofId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUnlock = async () => {
    if (!proofId) return;
    setIsVerifying(true);
    
    // Simulate ZK-Verification for the gated portal
    await new Promise(r => setTimeout(r, 2000));
    
    // For demo purposes, any 'prf_' ID unlocks the portal
    if (proofId.startsWith("prf_") || proofId.length > 10) {
      setIsUnlocked(true);
    }
    setIsVerifying(false);
  };

  if (!mounted) return null;

  return (
    <PageWrapper>
      <div className="container pt-20 pb-16 px-4 mx-auto min-h-screen">
        {!isUnlocked ? (
          <div className="max-w-2xl mx-auto text-center py-20">
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-indigo-500/10 border border-indigo-500/20 mb-8 relative"
             >
                <Lock className="w-10 h-10 text-indigo-400" />
                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
             </motion.div>
             
             <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-white">
               Premium Portal
             </h1>
             <p className="text-zinc-500 mb-12 text-sm max-w-md mx-auto leading-relaxed">
               This institutional-grade dashboard is secured by <span className="text-emerald-400 font-bold">Stealth ZK-KYC</span>.
               Please verify your cryptographic identity to proceed.
             </p>

             <div className="relative max-w-md mx-auto">
               <input 
                 type="text"
                 placeholder="Enter ZK Proof Identity (prf_...)"
                 value={proofId}
                 onChange={(e) => setProofId(e.target.value)}
                 className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-6 text-sm font-medium focus:outline-none focus:border-indigo-500/50 transition-all mb-4 text-center tracking-widest"
               />
               <button 
                 onClick={handleUnlock}
                 disabled={isVerifying || !proofId}
                 className="w-full h-14 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 {isVerifying ? (
                   <>
                     <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                     Authenticating...
                   </>
                 ) : (
                   <>
                     Unlock Portal <ArrowRight className="w-4 h-4" />
                   </>
                 )}
               </button>
               <p className="text-[10px] text-zinc-600 mt-4 uppercase font-black tracking-widest">
                 Requires Active ZK-Proof Hash from Network Registry
               </p>
             </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4">
                  <Sparkles className="w-3 h-3" /> Institutional Access
                </div>
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
                  Alpha Dashboard
                </h1>
              </div>
              <div className="flex gap-4">
                <div className="px-4 py-2 bg-black/40 border border-white/5 rounded-xl">
                  <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest mb-0.5">Yield Multiplier</p>
                  <p className="text-xl font-black text-emerald-400">2.45x</p>
                </div>
                <div className="px-4 py-2 bg-black/40 border border-white/5 rounded-xl">
                  <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest mb-0.5">Risk Score</p>
                  <p className="text-xl font-black text-indigo-400">AA+</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Pool Depth", value: "$4.2B", icon: Landmark, color: "text-indigo-400" },
                { label: "Global Vol", value: "$128M", icon: Globe, color: "text-blue-400" },
                { label: "Active Nodes", value: "1,240", icon: Cpu, color: "text-emerald-400" },
                { label: "Yield (APY)", value: "12.4%", icon: TrendingUp, color: "text-amber-400" },
              ].map((stat, i) => (
                <GlowingCard key={i} glowColor="primary" className="p-5">
                   <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 bg-white/5 rounded-lg border border-white/10 ${stat.color}`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div className="text-[10px] font-black text-emerald-400">+4.2%</div>
                   </div>
                   <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">{stat.label}</p>
                   <p className="text-2xl font-black text-white">{stat.value}</p>
                </GlowingCard>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-8">
                  <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8">
                    <h3 className="text-lg font-black uppercase tracking-widest mb-8 flex items-center gap-2">
                       <BarChart3 className="w-5 h-5 text-indigo-400" /> Market Analytics
                    </h3>
                    <div className="aspect-video bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                       <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.1),transparent)]" />
                       <div className="text-zinc-600 font-mono text-xs text-center">
                          <Zap className="w-8 h-8 text-indigo-500/20 mx-auto mb-4" />
                          [Live Telemetry Feed Encrypted]
                       </div>
                    </div>
                  </div>
               </div>
               
               <div className="space-y-6">
                  <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-20">
                       <CreditCard className="w-24 h-24" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Alpha Line</h3>
                    <p className="text-indigo-200 text-xs mb-8">Your verified credit line based on identity trust score.</p>
                    <div className="text-3xl font-black mb-8">$250,000</div>
                    <button className="w-full h-12 bg-white text-indigo-600 font-black uppercase tracking-widest text-[11px] rounded-2xl hover:scale-[1.02] transition-all">
                       Withdraw Funds
                    </button>
                  </div>
                  
                  <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8 text-center">
                    <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
                    <h4 className="text-sm font-black uppercase tracking-widest mb-2">Authenticated</h4>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">Your ZK-Proof is actively guarding this session.</p>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
}
