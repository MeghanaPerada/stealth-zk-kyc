"use client";

import React, { useState, useEffect } from "react";
import EndToEndKYC from "@/components/kyc/EndToEndKYC";
import { motion } from "framer-motion";
import { Shield, Lock, Fingerprint, Database } from "lucide-react";
import PageWrapper from "@/components/layout/PageWrapper";

export default function KYCPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <PageWrapper>
      <div className="relative z-10 container mx-auto px-4 py-12">
        <EndToEndKYC />

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard 
            icon={<Lock className="w-5 h-5 text-emerald-400" />}
            title="Privacy Guard"
            desc="Your PII never touches the blockchain. Only cryptographic hashes and proofs are stored."
          />
           <FeatureCard 
            icon={<Fingerprint className="w-5 h-5 text-emerald-400" />}
            title="Biometric Binding"
            desc="KYC proofs are bound to your wallet via cryptographic signatures for maximum security."
          />
           <FeatureCard 
            icon={<Database className="w-5 h-5 text-emerald-400" />}
            title="Reusable ID"
            desc="Generate once, verify everywhere. Your ZK proof is a portable credential for Web3."
          />
        </div>
      </div>
    </PageWrapper>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl space-y-3 backdrop-blur-sm"
    >
      <div className="w-10 h-10 bg-slate-950 rounded-lg flex items-center justify-center border border-slate-800">
        {icon}
      </div>
      <h4 className="font-bold text-white tracking-wide uppercase text-xs">{title}</h4>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}
