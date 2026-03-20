"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  ArrowRight,
  Fingerprint,
  CheckCircle2,
  Shield,
  Loader2,
  ExternalLink,
  ChevronRight,
  UserCheck,
  MapPin,
} from "lucide-react";
import { GlowingCard } from "@/components/ui/glowing-card";
import { useWallet } from "@/hooks/useWallet";

type FlowStep = "CONNECT" | "REDIRECT" | "DIGILOCKER_CONSENT" | "PROCESSING" | "RESULT";

const PROCESSING_MESSAGES = [
  "Authenticating with DigiLocker...",
  "Fetching verified documents...",
  "Oracle signing identity data...",
  "Generating zero-knowledge proof...",
  "Anchoring proof on Algorand...",
];

export default function KYCFlow() {
  const router = useRouter();
  const { isConnected, address, connectWallet } = useWallet();
  const [step, setStep] = useState<FlowStep>("CONNECT");
  const [processingMsgIndex, setProcessingMsgIndex] = useState(0);
  const [resultData, setResultData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-advance from REDIRECT to DIGILOCKER_CONSENT after short delay (simulates redirect)
  useEffect(() => {
    if (step === "REDIRECT") {
      const timer = setTimeout(() => setStep("DIGILOCKER_CONSENT"), 2200);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Cycle through processing messages
  useEffect(() => {
    if (step === "PROCESSING") {
      const interval = setInterval(() => {
        setProcessingMsgIndex((i) => Math.min(i + 1, PROCESSING_MESSAGES.length - 1));
      }, 2200);
      return () => clearInterval(interval);
    } else {
      setProcessingMsgIndex(0);
    }
  }, [step]);

  const handleApproveConsent = async () => {
    if (!isConnected || !address) return;
    setStep("PROCESSING");
    setError(null);

    try {
      // Step 1: Generate DigiLocker session token (simulates OAuth token exchange)
      const digilockerToken = `digilocker_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Small delay to let first processing message show
      await new Promise((r) => setTimeout(r, 2200));

      // Step 2: Oracle fetches from DigiLocker service using the token
      const oracleRes = await fetch("/api/oracle/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, token: digilockerToken }),
      });
      const oracleData = await oracleRes.json();
      if (!oracleRes.ok) throw new Error(oracleData.error || "Oracle fetch failed");

      await new Promise((r) => setTimeout(r, 2200));

      // Step 3: ZK backend generates proof using Oracle-signed data
      const zkRes = await fetch("/api/zk/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          oracleResult: oracleData,
          currentYear: new Date().getFullYear(),
        }),
      });
      const zkData = await zkRes.json();
      if (!zkRes.ok) throw new Error(zkData.error || "ZK generation failed");

      setResultData(zkData);
      setStep("RESULT");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Verification failed. Please try again.");
      setStep("CONNECT");
    }
  };

  const renderStep = () => {
    switch (step) {
      // ─────────────────────────────────────────────────────────────
      // STEP 1 — Connect Wallet
      // ─────────────────────────────────────────────────────────────
      case "CONNECT":
        return (
          <motion.div
            key="connect"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-xl"
          >
            <GlowingCard glowColor="primary" className="p-8 md:p-12 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-widest mb-3">Identity Protocol</h2>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-8">
                Consent-Based Verification via DigiLocker
              </p>

              <div className="bg-black/20 rounded-2xl p-6 border border-white/5 text-left mb-8 space-y-3">
                <p className="text-xs text-zinc-400 font-semibold mb-4">We request access to verify:</p>
                {["Age Verification (18+)", "City of Residence"].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">{item}</span>
                  </div>
                ))}
              </div>

              {!isConnected ? (
                <Button
                  onClick={connectWallet}
                  className="w-full h-16 bg-primary text-black font-black uppercase tracking-widest text-sm rounded-2xl hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(52,211,153,0.3)]"
                >
                  Connect Algorand Wallet
                </Button>
              ) : (
                <Button
                  onClick={() => setStep("REDIRECT")}
                  className="w-full h-16 bg-gradient-to-r from-primary to-emerald-400 text-black font-black uppercase tracking-widest text-sm rounded-2xl hover:scale-[1.02] transition-all"
                >
                  Continue to DigiLocker <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              )}
            </GlowingCard>
          </motion.div>
        );

      // ─────────────────────────────────────────────────────────────
      // STEP 2 — Redirect (simulates OAuth handshake)
      // ─────────────────────────────────────────────────────────────
      case "REDIRECT":
        return (
          <motion.div
            key="redirect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-black uppercase tracking-widest">Secure Handshake</h2>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-3">
              Establishing encrypted session with DigiLocker...
            </p>
            <div className="mt-6 flex gap-2 justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </div>
          </motion.div>
        );

      // ─────────────────────────────────────────────────────────────
      // STEP 3 — DigiLocker Consent UI (simulates government portal)
      // ─────────────────────────────────────────────────────────────
      case "DIGILOCKER_CONSENT":
        return (
          <motion.div
            key="consent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-2xl"
          >
            {/* Realistic government portal look */}
            <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-zinc-200">
              {/* DigiLocker Header */}
              <div className="bg-[#f8f9fa] px-8 py-5 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0056b3] rounded-lg flex items-center justify-center text-white font-black text-lg italic shadow">
                    D
                  </div>
                  <div>
                    <h3 className="text-zinc-900 font-bold leading-tight">DigiLocker</h3>
                    <p className="text-[10px] text-zinc-500 font-medium">Your Documents Anytime, Anywhere</p>
                  </div>
                </div>
                <div className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-tighter">
                  Secure Session Active
                </div>
              </div>

              {/* SSL + URL bar (decoration) */}
              <div className="bg-zinc-50 px-8 py-2 border-b border-zinc-100 flex items-center gap-2">
                <Shield className="w-3 h-3 text-emerald-600" />
                <span className="text-[10px] font-mono text-zinc-400">digilocker.gov.in/oauth/consent</span>
              </div>

              <div className="p-8 md:p-10">
                {/* App requesting access */}
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <ExternalLink className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <h4 className="text-zinc-900 font-bold text-lg mb-1">Stealth ZK-KYC</h4>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                      is requesting permission to access the following information from your DigiLocker account.
                    </p>
                  </div>
                </div>

                {/* Permission list */}
                <div className="space-y-3 mb-8">
                  {[
                    { icon: UserCheck, label: "Identity Attributes", sub: "DOB, PAN, Aadhaar Last 4" },
                    { icon: MapPin, label: "Address Details", sub: "Current City, State" },
                  ].map(({ icon: Icon, label, sub }) => (
                    <div key={label} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-zinc-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-[#0056b3]" />
                        </div>
                        <div>
                          <p className="text-zinc-900 font-bold text-sm">{label}</p>
                          <p className="text-zinc-400 text-[10px]">{sub}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-300" />
                    </div>
                  ))}
                </div>

                {/* Purpose note */}
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-8">
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    <strong>Purpose:</strong> Identity verification for Stealth ZK-KYC Protocol.
                    No raw personal data will be stored or shared — only a cryptographic zero-knowledge proof will be generated.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={handleApproveConsent}
                    className="flex-1 h-14 bg-[#0056b3] hover:bg-[#004494] text-white font-bold text-base rounded-xl transition-all"
                  >
                    Allow Access
                  </Button>
                  <Button
                    onClick={() => setStep("CONNECT")}
                    variant="outline"
                    className="flex-1 h-14 border-zinc-200 text-zinc-600 font-bold rounded-xl"
                  >
                    Deny
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        );

      // ─────────────────────────────────────────────────────────────
      // STEP 4 — Cryptographic Processing
      // ─────────────────────────────────────────────────────────────
      case "PROCESSING":
        return (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="relative w-28 h-28 mx-auto mb-8">
              <Loader2 className="w-28 h-28 text-primary animate-spin opacity-10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Fingerprint className="w-12 h-12 text-primary animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest mb-3">Cryptographic Pipeline</h2>
            <AnimatePresence mode="wait">
              <motion.p
                key={processingMsgIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-zinc-500 text-xs font-bold uppercase tracking-widest"
              >
                {PROCESSING_MESSAGES[processingMsgIndex]}
              </motion.p>
            </AnimatePresence>
            {/* Progress dots */}
            <div className="flex gap-2 justify-center mt-6">
              {PROCESSING_MESSAGES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-700 ${
                    i <= processingMsgIndex ? "w-6 bg-primary" : "w-1.5 bg-primary/20"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        );

      // ─────────────────────────────────────────────────────────────
      // STEP 5 — Verified Result
      // ─────────────────────────────────────────────────────────────
      case "RESULT":
        return (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl"
          >
            <GlowingCard glowColor="primary" className="p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>

              <h2 className="text-4xl font-black uppercase tracking-tighter mb-3 text-emerald-400">
                Identity Verified
              </h2>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-10">
                ZK-KYC verification successful · Anchored on Algorand
              </p>

              <div className="space-y-3 mb-10 text-left">
                <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">ZK Identity Hash</p>
                  <p className="text-xs font-mono text-zinc-300 break-all">{resultData?.zkIdentity || "N/A"}</p>
                </div>
                <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Algorand Proof Anchor</p>
                  <p className="text-xs font-mono text-primary break-all">
                    {resultData?.txId || (resultData?.mock ? "Mock proof (ZK artifacts missing)" : "local_only")}
                  </p>
                </div>
                {resultData?.mock && (
                  <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl">
                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                      ⚠ Simulated proof — Place kycMain.wasm & kyc.zkey in /public/zk for real Groth16 proofs
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl mb-8">
                <p className="text-[11px] text-emerald-300/80 leading-relaxed font-medium">
                  <Shield className="w-3 h-3 inline mr-1" />
                  No personal data (DOB, PAN, Aadhaar) was shared or stored. Privacy is mathematically guaranteed.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => router.push("/")}
                  variant="outline"
                  className="flex-1 h-14 border-white/10 font-black uppercase tracking-widest text-[10px] rounded-xl"
                >
                  Return Home
                </Button>
                <Button
                  onClick={() => router.push(`/verify?id=${resultData?.zkIdentity || ""}`)}
                  className="flex-1 h-14 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-xl"
                >
                  Verify Proof
                </Button>
              </div>
            </GlowingCard>
          </motion.div>
        );
    }
  };

  return (
    <div className="container pt-32 md:pt-48 pb-16 px-4 mx-auto min-h-screen flex flex-col items-center justify-center relative">
      {/* Background glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] -z-10 pointer-events-none" />

      {/* Error toast */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 text-white px-6 py-3 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-3 max-w-sm text-center"
        >
          <Shield className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-widest">{error}</span>
          <button onClick={() => setError(null)} className="ml-3 hover:opacity-70 text-lg leading-none">×</button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <div className="w-full flex justify-center items-center">
          {renderStep()}
        </div>
      </AnimatePresence>
    </div>
  );
}
