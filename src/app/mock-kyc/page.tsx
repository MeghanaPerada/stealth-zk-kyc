"use client";

import React from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import DigiLockerMock from "@/components/kyc/DigiLockerMock";
import { Shield, Lock, Fingerprint, Database } from "lucide-react";

/**
 * MockKycPage
 * 
 * Host page for the Mock DigiLocker identity onboarding flow.
 */
export default function MockKycPage() {
  return (
    <PageWrapper className="pt-24 md:pt-32 pb-20">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
             <Fingerprint className="w-3 h-3" /> Identity Onboarding Layer
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">
            Mock <span className="text-blue-600">DigiLocker</span> Onboarding
          </h1>
          <p className="text-zinc-500 text-lg font-medium leading-relaxed">
            Onboard your identity securely using our simulated DigiLocker flow. 
            Generate local commitments and reusable proofs that respect your privacy—no PII ever leaves your device.
          </p>
        </div>

        <div className="mb-20">
           <DigiLockerMock />
        </div>

        {/* Feature Highlights */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 space-y-4 hover:border-blue-500/20 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                 <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-white font-black uppercase tracking-tight text-sm">Zero Data Storage</h4>
              <p className="text-zinc-500 text-[11px] leading-relaxed font-medium">
                 Your personal information (Name, Email) is hashed into a commitment and is **deleted immediately** from memory.
              </p>
           </div>

           <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 space-y-4 hover:border-blue-500/20 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                 <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-white font-black uppercase tracking-tight text-sm">Reusable Identity</h4>
              <p className="text-zinc-500 text-[11px] leading-relaxed font-medium">
                 Generate an infinite number of unique, simulated ZK proofs from a single identity anchor without revealing your secret.
              </p>
           </div>

           <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 space-y-4 hover:border-blue-500/20 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                 <Database className="w-5 h-5" />
              </div>
              <h4 className="text-white font-black uppercase tracking-tight text-sm">Protocol Verification</h4>
              <p className="text-zinc-500 text-[11px] leading-relaxed font-medium">
                 Every proof is bound to a unique nullifier, ensuring that one-time proofs cannot be replayed by malicious actors.
              </p>
           </div>
        </div>
      </div>
    </PageWrapper>
  );
}

