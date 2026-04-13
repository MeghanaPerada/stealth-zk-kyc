"use client";

import React from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import LightVerificationUI from "@/components/kyc/LightVerificationUI";
import { Shield, Info } from "lucide-react";

/**
 * VerifyLightPage
 * 
 * Host page for the Light Verification Module.
 */
export default function VerifyLightPage() {
  return (
    <PageWrapper className="pt-24 md:pt-32 pb-20">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4">
             <Shield className="w-3 h-3" /> Simulated Logic Layer
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">
            Protocol <span className="text-emerald-500">Validation</span>
          </h1>
          <p className="text-zinc-500 text-lg font-medium leading-relaxed">
            Test the secure identity verification flow. This module uses deterministic commitments 
            and nullifiers to prevent identity fraud and replay attacks without backend storage.
          </p>
        </div>

        <div className="mb-20">
           <LightVerificationUI />
        </div>

        {/* Technical Brief */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 space-y-4">
              <div className="flex items-center gap-3 text-emerald-500 font-black uppercase tracking-widest text-xs">
                 <Info className="w-4 h-4" /> Replay Protection
              </div>
              <p className="text-zinc-500 text-xs leading-relaxed font-medium">
                 Every proof contains a unique **nullifier** (secret hash). The system tracks used nullifiers in its local vault to ensure that each proof can only be validated exactly once.
              </p>
           </div>
           <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 space-y-4">
              <div className="flex items-center gap-3 text-emerald-500 font-black uppercase tracking-widest text-xs">
                 <Info className="w-4 h-4" /> Multi-Layer Trust
              </div>
              <p className="text-zinc-500 text-xs leading-relaxed font-medium">
                 Verification combines commitment matching, timestamp validation (5-minute window), and claim integrity to simulate a real-world ZK-SNARK verification pipeline.
              </p>
           </div>
        </div>
      </div>
    </PageWrapper>
  );
}
