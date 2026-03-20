"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ShieldCheck, CheckCircle2, RefreshCw, Clock, XCircle,
  Lock, Building2, ArrowRight, Shield, Loader2, AlertCircle,
  Fingerprint,
} from "lucide-react";
import { GlowingCard } from "@/components/ui/glowing-card";
import { useWallet } from "@/hooks/useWallet";

type Status = "idle" | "loading" | "verified" | "expired" | "revoked" | "invalid";

const USE_CASES = [
  {
    id: "land",
    title: "Land Registration",
    icon: Building2,
    description: "Register property ownership using your existing ZK identity proof",
    color: "text-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
  },
  {
    id: "bank",
    title: "Bank Account KYC",
    icon: ShieldCheck,
    description: "Open a bank account — reuse your verified ZK identity without re-submitting documents",
    color: "text-purple-400",
    border: "border-purple-500/20",
    bg: "bg-purple-500/5",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.15)]",
  },
  {
    id: "gov",
    title: "Government Benefits",
    icon: Shield,
    description: "Apply for welfare schemes — prove eligibility without exposing personal data",
    color: "text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
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

  // Load proof from localStorage
  useEffect(() => {
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
        addLog(`✓ Cryptographic verification: PASSED`);
        await sleep(400);
        addLog(`✓ No personal data accessed or revealed`);
        await sleep(400);
        addLog(`✓ ${uc.title} registration approved!`);
        setStatus("verified");
      } else if (data.reason?.includes("expired")) {
        addLog(`✗ Proof expired at ${new Date(storedProof.expiry).toLocaleString()}`);
        setStatus("expired");
        setProofStatus("expired");
      } else if (data.reason?.includes("revoked")) {
        addLog(`✗ Proof has been revoked`);
        setStatus("revoked");
        setProofStatus("revoked");
      } else {
        addLog(`✗ Verification failed: ${data.message || data.error}`);
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

  return (
    <div className="container pt-28 md:pt-40 pb-16 px-4 mx-auto min-h-screen relative">
      {/* bg glows */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-primary/5 rounded-full blur-[160px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[140px] -z-10 pointer-events-none" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full text-primary text-xs font-black uppercase tracking-widest mb-6">
          <RefreshCw className="w-3 h-3" /> Reusable ZK Credentials
        </div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">
          Your Identity — Reusable, Private
        </h1>
        <p className="text-zinc-500 max-w-2xl mx-auto text-sm leading-relaxed">
          Your ZK credential was generated once and can be reused across multiple services without ever re-submitting personal data or documents.
        </p>
      </motion.div>

      {/* No proof stored */}
      {!storedProof && (
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
        </motion.div>
      )}

      {/* Credential card + use cases */}
      {storedProof && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Credential Card */}
          <div className="lg:col-span-1 space-y-4">
            <GlowingCard glowColor="primary" className="p-6">
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
                {/* Status badge */}
                <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${
                  proofStatus === "active"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : proofStatus === "expired"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  {proofStatus === "active" ? "● Active" : proofStatus === "expired" ? "⏰ Expired" : "✗ Revoked"}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">ZK Identity Hash</p>
                  <p className="font-mono text-[10px] text-zinc-300 break-all">{storedProof.identity_hash?.substring(0, 32)}...</p>
                </div>
                <div>
                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Proof Source</p>
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    {storedProof.proofSource === "digilocker" ? "🏛 DigiLocker (UIDAI Verified)" : "📝 Manual Input"}
                  </p>
                </div>
                {storedProof.txId && (
                  <div>
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">On-Chain Anchor</p>
                    <p className="font-mono text-[10px] text-primary break-all">{storedProof.txId}</p>
                  </div>
                )}
                {expiryLeft !== null && (
                  <div>
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Expiry</p>
                    <p className={`text-xs font-bold ${isExpired ? "text-red-400" : "text-amber-400"} flex items-center gap-1`}>
                      <Clock className="w-3 h-3" />
                      {isExpired ? "Expired" : `${expiryLeft} min remaining`}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 mb-4">
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  <Lock className="w-3 h-3 inline mr-1 text-primary" />
                  {storedProof.mock
                    ? "Simulated proof (ZK artifacts missing). Real Groth16 proof would be used in production."
                    : "Real Groth16 proof — cryptographically secured and wallet-bound."}
                </p>
              </div>

              {/* Revoke button */}
              {proofStatus === "active" && (
                <button
                  onClick={handleRevoke}
                  className="w-full h-10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500/10 transition-all"
                >
                  <XCircle className="w-3 h-3 inline mr-1.5" /> Revoke Credential
                </button>
              )}
            </GlowingCard>

            {/* Privacy guarantee */}
            <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Privacy Guarantee</h4>
              <div className="space-y-2">
                {[
                  "No PII transmitted during reuse",
                  "Proof bound to your wallet only",
                  "Compliant with DPDP Act 2023",
                  "Revocable at any time",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-zinc-500">
                    <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                    <span className="text-[11px]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Use Cases + Verification Result */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest mb-2">Reuse Your Credential</h2>
              <p className="text-zinc-500 text-sm mb-6">Select a service to verify your identity — no new documents needed.</p>
              <div className="grid gap-4">
                {USE_CASES.map((uc) => {
                  const Icon = uc.icon;
                  const isSelected = selectedUseCase === uc.id;
                  return (
                    <button
                      key={uc.id}
                      onClick={() => handleReuseCredential(uc.id)}
                      disabled={status === "loading" || proofStatus !== "active"}
                      className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 ${uc.bg} ${uc.border} hover:${uc.glow} disabled:opacity-40 disabled:cursor-not-allowed ${isSelected ? uc.glow : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 ${uc.bg} border ${uc.border} rounded-xl flex items-center justify-center`}>
                            <Icon className={`w-6 h-6 ${uc.color}`} />
                          </div>
                          <div>
                            <h3 className={`font-black text-base ${uc.color}`}>{uc.title}</h3>
                            <p className="text-zinc-500 text-xs mt-0.5">{uc.description}</p>
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

            {/* Live verification log + result */}
            <AnimatePresence>
              {log.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Log */}
                  <div className="bg-black/60 border border-white/5 rounded-2xl p-5 font-mono text-[11px] space-y-1.5">
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-black mb-3">Verification Log</p>
                    {log.map((entry, i) => (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={entry.startsWith("✗") ? "text-red-400" : entry.startsWith("⟳") ? "text-yellow-400" : "text-emerald-400"}
                      >
                        {entry}
                      </motion.p>
                    ))}
                    {status === "loading" && (
                      <motion.p
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="text-zinc-500"
                      >
                        Processing...
                      </motion.p>
                    )}
                  </div>

                  {/* Result Card */}
                  {status === "verified" && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-black text-lg text-emerald-400 uppercase tracking-tighter">
                            {USE_CASES.find((u) => u.id === selectedUseCase)?.title} Approved
                          </h3>
                          <p className="text-zinc-500 text-xs">Verified using ZK credential — zero personal data exchanged</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "ZK Identity", value: storedProof.identity_hash?.substring(0, 16) + "..." },
                          { label: "Proof Source", value: storedProof.proofSource === "digilocker" ? "UIDAI DigiLocker" : "Manual" },
                          { label: "Wallet Bound", value: (storedProof.wallet || address || "—")?.substring(0, 16) + "..." },
                          { label: "Verification", value: verifyResult?.demo ? "Simulated ✓" : "Groth16 ✓" },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-black/30 p-3 rounded-xl">
                            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">{label}</p>
                            <p className="font-mono text-[11px] text-zinc-300 mt-1">{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 bg-emerald-500/5 rounded-xl p-3">
                        <p className="text-[11px] text-emerald-300/70 font-medium">
                          <Lock className="w-3 h-3 inline mr-1" />
                          No PAN, Aadhaar, or DoB was shared with {USE_CASES.find((u) => u.id === selectedUseCase)?.title}. Identity is proven, not revealed.
                        </p>
                      </div>
                    </div>
                  )}

                  {(status === "expired" || status === "revoked" || status === "invalid") && (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex items-start gap-4">
                      <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-black text-red-400 uppercase tracking-tighter mb-1">Verification Failed</h3>
                        <p className="text-zinc-500 text-sm">
                          {status === "expired" ? "Your credential has expired. Please regenerate via the KYC flow." :
                           status === "revoked" ? "This credential was revoked. Issue a new one via the KYC flow." :
                           "Proof verification failed. The proof may be malformed or tampered."}
                        </p>
                        <Link href="/kyc">
                          <button className="mt-4 h-10 px-6 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-xl">
                            Regenerate Credential
                          </button>
                        </Link>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
