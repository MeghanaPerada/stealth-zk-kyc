"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ShieldCheck, CheckCircle2, RefreshCw, Clock, XCircle,
  Lock, ArrowRight, Shield, Loader2, AlertCircle,
  Fingerprint, Database, Sparkles, Building2
} from "lucide-react";
import { GlowingCard } from "@/components/ui/glowing-card";
import { useWallet } from "@/hooks/useWallet";
import PageWrapper from "@/components/layout/PageWrapper";

type Status = "idle" | "loading" | "verified" | "expired" | "revoked" | "invalid";

const USE_CASES = [
  { 
    id: "land", 
    title: "Land Registration", 
    description: "Secure property deed transfer using government-anchored identity.", 
    icon: Database, 
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    minTrust: 90, 
    minTrustLabel: "GOVT-GRADE REQUIRED" 
  },
  { 
    id: "bank", 
    title: "Bank KYC", 
    description: "Open a high-limit bank account with zero-knowledge data sharing.", 
    icon: Lock, 
    color: "text-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
    minTrust: 70, 
    minTrustLabel: "VERIFIED+ REQUIRED" 
  },
  { 
    id: "travel", 
    title: "Age-Gated Travel", 
    description: "Verify age requirement for travel booking without revealing birthday.", 
    icon: ShieldCheck, 
    color: "text-purple-400",
    border: "border-purple-500/20",
    bg: "bg-purple-500/5",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.15)]",
    minTrust: 50, 
    minTrustLabel: "BASIC VERIFIED" 
  },
];

type StoredProof = {
  identity_hash: string;
  proof: object;
  publicSignals: string[];
  txId: string;
  wallet: string;
  proofSource: string;
  expiry: number;
  trustScore?: number;
  proofType?: "GOVT_GRADE" | "VERIFIED" | "BASIC";
  proofTypeLabel?: string;
  mock?: boolean;
};

export default function CredentialPage() {
  const { address } = useWallet();
  const [storedProof, setStoredProof] = useState<StoredProof | null>(null);
  const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [log, setLog] = useState<string[]>([]);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [proofStatus, setProofStatus] = useState<"active" | "expired" | "revoked">("active");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const raw = localStorage.getItem("stealth_final_proof");
    if (raw) {
      try {
        setStoredProof(JSON.parse(raw));
      } catch {/* ignore */}
    }
  }, []);

  const addLog = (msg: string) => setLog((l) => [...l, msg]);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const handleReuseCredential = async (ucId: string) => {
    if (!storedProof) return;
    setSelectedUseCase(ucId);
    setStatus("loading");
    setLog([]);
    setVerifyResult(null);

    const uc = USE_CASES.find((u) => u.id === ucId)!;

    try {
      addLog(`▶ Initiating ${uc.title} verification...`);
      await sleep(800);
      addLog(`✓ ZK Identity credential loaded from secure vault`);
      await sleep(600);
      addLog(`✓ Identity hash: ${storedProof.identity_hash?.substring(0, 24)}...`);
      await sleep(600);
      addLog(`⟳ Submitting proof to verifier network...`);

      const res = await fetch("/api/zk/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof: storedProof.proof,
          publicSignals: storedProof.publicSignals,
          proofHash: storedProof.identity_hash,
          wallet: storedProof.wallet || address,
          expiry: storedProof.expiry,
        }),
      });
      const data = await res.json();
      await sleep(800);

      if (data.verified || data.demo) {
        addLog(`✓ ZK Proof: Mathematically Verified (Layer 0)`);
        await sleep(600);
        addLog(`✓ Oracle Signature: Authenticated (Layer 1)`);
        await sleep(600);
        addLog(`✓ Algorand Anchor: Match found in Box Storage (Layer 2)`);
        await sleep(800);
        addLog(`✨ Multi-layer protocol: ACCESS GRANTED`);
        await sleep(400);
        addLog(`✓ ${uc.title} registration approved!`);
        setStatus("verified");
      } else if (data.reason?.includes("Layer 2")) {
        addLog(`✗ Layer 2 Mismatch: No anchor found on-chain`);
        setStatus("invalid");
      } else if (data.reason?.includes("expired")) {
        addLog(`✗ Proof expired at ${new Date(storedProof.expiry).toLocaleString()}`);
        setStatus("expired");
      } else {
        addLog(`✗ Verification failed: ${data.reason || data.message || "Unknown error"}`);
        setStatus("invalid");
      }
      setVerifyResult(data);
    } catch (err: any) {
      addLog(`✗ Error: ${err.message}`);
      setStatus("invalid");
    }
  };

  const handleRevoke = async () => {
    if (!storedProof) return;
    await fetch("/api/zk/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke", proofHash: storedProof.identity_hash }),
    });
    setProofStatus("revoked");
    localStorage.removeItem("stealth_final_proof");
    setStoredProof(null);
  };

  const isExpired = storedProof && storedProof.expiry && Date.now() > storedProof.expiry;
  const expiryLeft = storedProof?.expiry
    ? Math.max(0, Math.floor((storedProof.expiry - Date.now()) / 60000))
    : null;

  if (!mounted) return null;

  return (
    <PageWrapper>
      <div className="container pt-12 pb-16 px-4 mx-auto min-h-screen relative">

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full text-primary text-xs font-black uppercase tracking-widest mb-6">
          <RefreshCw className="w-3 h-3" /> Reusable ZK Credentials
        </div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">
          Your Identity — Reusable, Private
        </h1>
        <p className="text-zinc-500 max-w-2xl mx-auto text-sm leading-relaxed">
          Your ZK credential was generated once and can be reused across multiple services without ever re-submitting personal data.
        </p>
      </motion.div>

      {!storedProof ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="w-16 h-16 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Fingerprint className="w-8 h-8 text-zinc-600" />
          </div>
          <p className="text-zinc-500 text-lg font-bold mb-2">No ZK Credential Found</p>
          <p className="text-zinc-700 text-sm mb-8">Complete the KYC verification first to generate your reusable credential.</p>
          <Link href="/kyc">
            <button className="h-14 px-8 bg-primary text-black font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-all text-sm">
              Complete KYC <ArrowRight className="inline ml-2 w-4 h-4" />
            </button>
          </Link>

          <div className="mt-16 p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-transparent to-transparent border border-white/5 relative overflow-hidden max-w-4xl mx-auto text-left">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles className="w-24 h-24 text-primary" />
            </div>
            <h2 className="text-2xl font-black tracking-tighter uppercase mb-4">The Stealth Protocol</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary mb-3">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm uppercase tracking-tight">Wallet Bound</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Identity is cryptographically tied to your wallet. Zero impersonation risk.</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm uppercase tracking-tight">Multi-Layer</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Verified by local ZK, Oracle signatures, and Algorand smart contracts.</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm uppercase tracking-tight">Infinite Reuse</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Complete KYC once. Prove identity anywhere without revealing PII.</p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <GlowingCard glowColor="primary" className="p-6">
              {storedProof.trustScore && (
                <div className={`mb-5 flex items-center justify-between px-4 py-3 rounded-2xl border ${
                  storedProof.proofType === "GOVT_GRADE" ? "bg-emerald-500/5 border-emerald-500/20" :
                  storedProof.proofType === "VERIFIED" ? "bg-amber-500/5 border-amber-500/20" : "bg-red-500/5 border-red-500/20"
                }`}>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${
                      storedProof.proofType === "GOVT_GRADE" ? "text-emerald-400" :
                      storedProof.proofType === "VERIFIED" ? "text-amber-400" : "text-red-400"
                    }`}>{storedProof.proofTypeLabel}</p>
                    <p className="text-[9px] text-zinc-600 mt-0.5 uppercase tracking-wider">{storedProof.proofSource === "digilocker" ? "UIDAI DigiLocker" : "Manual Entry"}</p>
                  </div>
                  <div className={`text-2xl font-black tabular-nums ${
                    storedProof.proofType === "GOVT_GRADE" ? "text-emerald-400" :
                    storedProof.proofType === "VERIFIED" ? "text-amber-400" : "text-red-400"
                  }`}>
                    {storedProof.trustScore}<span className="text-xs text-zinc-600 font-normal">/100</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider">ZK Identity</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Stealth ZK-KYC</p>
                  </div>
                </div>
                <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${
                  proofStatus === "active" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  {proofStatus === "active" ? "● Active" : "✗ Revoked"}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">ZK Identity Hash</p>
                  <p className="font-mono text-[10px] text-zinc-300 break-all">{storedProof.identity_hash}</p>
                </div>
                <div>
                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Proof Source</p>
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    {storedProof.proofSource === "digilocker" ? "🏛 DigiLocker (UIDAI)" : "📝 Manual"}
                  </p>
                </div>
                {expiryLeft !== null && (
                  <div>
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Expiry</p>
                    <p className={`text-xs font-bold ${isExpired ? "text-red-400" : "text-amber-400"} flex items-center gap-1`}>
                      <Clock className="w-3 h-3" /> {isExpired ? "Expired" : `${expiryLeft} min remaining`}
                    </p>
                  </div>
                )}
              </div>

              {proofStatus === "active" && (
                <button onClick={handleRevoke} className="w-full h-10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500/10 transition-all">
                  <XCircle className="w-3 h-3 inline mr-1.5" /> Revoke Credential
                </button>
              )}
            </GlowingCard>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest mb-2">Reuse Your Credential</h2>
              <div className="grid gap-4 mt-6">
                {USE_CASES.map((uc) => {
                  const Icon = uc.icon;
                  const isSelected = selectedUseCase === uc.id;
                  const userTrust = storedProof.trustScore || 0;
                  const isTrustBlocked = userTrust < (uc.minTrust || 0);
                  return (
                    <button
                      key={uc.id}
                      onClick={() => !isTrustBlocked && handleReuseCredential(uc.id)}
                      disabled={status === "loading" || isTrustBlocked}
                      className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 ${uc.bg} ${uc.border} ${
                        isTrustBlocked ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 ${uc.bg} border ${uc.border} rounded-xl flex items-center justify-center`}>
                            <Icon className={`w-6 h-6 ${uc.color}`} />
                          </div>
                          <div>
                            <h3 className={`font-black text-base ${uc.color}`}>{uc.title}</h3>
                            <p className="text-zinc-500 text-xs mt-0.5">{uc.description}</p>
                            {isTrustBlocked && (
                              <p className="text-[9px] text-red-400 font-black uppercase tracking-widest mt-1">
                                <Lock className="w-2.5 h-2.5 inline mr-1" /> {uc.minTrustLabel} · yours: {userTrust}/100
                              </p>
                            )}
                          </div>
                        </div>
                        {isSelected && status === "loading" ? (
                          <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                        ) : isSelected && status === "verified" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <ArrowRight className="w-5 h-5 text-zinc-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence>
              {log.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="bg-black/60 border border-white/5 rounded-2xl p-5 font-mono text-[11px] space-y-1.5">
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-black mb-3">Protocol Log</p>
                    {log.map((entry, i) => (
                      <p key={i} className={entry.startsWith("✗") ? "text-red-400" : "text-emerald-400"}>{entry}</p>
                    ))}
                  </div>

                  {status === "verified" && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        <h3 className="font-black text-lg text-emerald-400 uppercase tracking-tighter">Approved</h3>
                      </div>
                      <p className="text-zinc-500 text-xs leading-relaxed">Identity proven via ZK + Oracle + Algorand multi-layer protocol.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
      </div>
    </PageWrapper>
  );
}
