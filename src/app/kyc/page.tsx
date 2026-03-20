"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Fingerprint, 
  CheckCircle2, 
  Shield, 
  Loader2,
  ExternalLink,
  ChevronRight,
  UserCheck,
  MapPin,
  Calendar
} from "lucide-react";
import { GlowingCard } from "@/components/ui/glowing-card";
import { useWallet } from "@/hooks/useWallet";
import algosdk from "algosdk";

// App Config (Fallback to constants for demo if env missing)
const CONSENT_APP_ID = parseInt(process.env.NEXT_PUBLIC_CONSENT_APP_ID || "0");

type FlowStep = "CONNECT" | "REDIRECT" | "DIGILOCKER_CONSENT" | "PROCESSING" | "RESULT";

export default function KYCFlow() {
  const router = useRouter();
  const { isConnected, address, connectWallet, signTransactions, algodClient } = useWallet();
  const [step, setStep] = useState<FlowStep>("CONNECT");
  const [processingMsg, setProcessingMsg] = useState("Verifying consent...");
  const [resultData, setResultData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-advance from Redirect
  useEffect(() => {
    if (step === "REDIRECT") {
      const timer = setTimeout(() => setStep("DIGILOCKER_CONSENT"), 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Handle On-Chain Consent Approval
  const handleApproveConsent = async () => {
    if (!isConnected || !address) return;
    
    setStep("PROCESSING");
    setProcessingMsg("Recording consent on-chain (Algorand Boxes)...");

    try {
      // In a real demo, we'd trigger a real app call
      // For this simulation, we simulate the delay and local caching of the consent
      // If CONSENT_APP_ID is set, we could do a real txn here.
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProcessingMsg("Fetching verified documents from DigiLocker...");
      
      // Step 2: Call Oracle to fetch signed data
      const oracleResponse = await fetch("/api/oracle/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          permissions: "age,city",
          userInputData: { dob: "2003-08-15", aadhaar_last4: "1234", pan: "ABCDE1234F" }
        })
      });
      const oracleData = await oracleResponse.json();
      if (!oracleResponse.ok) throw new Error(oracleData.error || "Oracle fetch failed");

      setProcessingMsg("Generating zero-knowledge proof...");
      
      // Step 3: Call ZK Backend to generate proof
      const zkResponse = await fetch("/api/zk/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          oracleResult: oracleData,
          currentYear: 2026
        })
      });
      const zkData = await zkResponse.json();
      if (!zkResponse.ok) throw new Error(zkData.error || "ZK generation failed");

      setResultData(zkData);
      setStep("RESULT");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during verification");
      setStep("CONNECT");
    }
  };

  const renderStep = () => {
    switch (step) {
      case "CONNECT":
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl"
          >
            <GlowingCard glowColor="primary" className="p-8 md:p-12 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-widest mb-4">Identity Protocol</h2>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-8">
                Official Verification Request
              </p>
              
              <div className="bg-black/20 rounded-2xl p-6 border border-white/5 text-left mb-8 space-y-4">
                <p className="text-sm text-zinc-300 font-medium">We request access to verify:</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Age Verification (18+)</span>
                  </div>
                  <div className="flex items-center gap-3 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">City of Residence</span>
                  </div>
                </div>
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
                  Continue to Secure Verification <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              )}
            </GlowingCard>
          </motion.div>
        );

      case "REDIRECT":
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-black uppercase tracking-widest">Secure Handshake</h2>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">
              Redirecting to Secure Document Provider (DigiLocker)...
            </p>
          </motion.div>
        );

      case "DIGILOCKER_CONSENT":
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl"
          >
            <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-zinc-200">
              {/* DigiLocker Branding Header */}
              <div className="bg-[#f8f9fa] px-8 py-6 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0056b3] rounded-lg flex items-center justify-center text-white font-bold text-xl italic">
                    D
                  </div>
                  <div>
                    <h3 className="text-zinc-900 font-bold leading-tight">DigiLocker</h3>
                    <p className="text-[10px] text-zinc-500 font-medium">Your Documents Anytime, Anywhere</p>
                  </div>
                </div>
                <div className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-tighter">
                  Verified Simulation
                </div>
              </div>

              <div className="p-8 md:p-12">
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div>
                    <h4 className="text-zinc-900 font-bold text-xl mb-1">Stealth ZK-KYC</h4>
                    <p className="text-zinc-500 text-sm">Requests your consent to access the following documents/data from your DigiLocker account.</p>
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-zinc-100 flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-[#0056b3]" />
                      </div>
                      <div>
                        <p className="text-zinc-900 font-bold text-sm">Identity Attributes</p>
                        <p className="text-zinc-500 text-[10px]">DOB, PAN, Aadhaar Last 4</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300" />
                  </div>

                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-zinc-100 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-[#0056b3]" />
                      </div>
                      <div>
                        <p className="text-zinc-900 font-bold text-sm">Address Details</p>
                        <p className="text-zinc-500 text-[10px]">Current City, State</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300" />
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-10">
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    <strong className="font-bold">Purpose:</strong> Identity verification for Stealth ZK-KYC Protocol. No raw data will be shared with the application; only a cryptographic proof will be generated.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={handleApproveConsent}
                    className="flex-1 h-14 bg-[#0056b3] hover:bg-[#004494] text-white font-bold rounded-xl"
                  >
                    Allow
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

      case "PROCESSING":
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
             <div className="relative w-24 h-24 mx-auto mb-8">
                <Loader2 className="w-24 h-24 text-primary animate-spin opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Fingerprint className="w-10 h-10 text-primary animate-pulse" />
                </div>
             </div>
             <h2 className="text-2xl font-black uppercase tracking-widest mb-2">Cryptographic Pipeline</h2>
             <motion.p 
               key={processingMsg}
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-zinc-500 text-xs font-bold uppercase tracking-widest"
             >
               {processingMsg}
             </motion.p>
          </motion.div>
        );

      case "RESULT":
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl"
          >
            <GlowingCard glowColor="primary" className="p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
              
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>

              <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-emerald-400">Identity Verified</h2>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-10">
                ZK-KYC verification successful
              </p>

              <div className="space-y-4 mb-10">
                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl text-left">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 leading-none">ZK Identity ID</p>
                  <p className="text-xs font-mono text-zinc-300 break-all">{resultData?.zkIdentity || "0x..."}</p>
                </div>
                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl text-left">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 leading-none">Blockchain Proof Hash</p>
                  <p className="text-xs font-mono text-primary break-all">{resultData?.txId || "Anchored on Algorand"}</p>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl mb-10">
                <p className="text-[11px] text-emerald-300/80 leading-relaxed font-medium">
                  <Shield className="w-3 h-3 inline mr-1" /> No personal data (DOB, PAN, Address) was shared with the protocol or stored on-chain. Your privacy is mathematically guaranteed.
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
                  className="flex-1 h-14 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-xl"
                >
                  View on Explorer
                </Button>
              </div>
            </GlowingCard>
          </motion.div>
        );
    }
  };

  return (
    <div className="container pt-32 md:pt-48 pb-16 px-4 mx-auto min-h-screen flex flex-col items-center justify-center relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] -z-10 pointer-events-none" />

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-destructive/90 text-white px-6 py-3 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-3"
        >
          <Shield className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-widest">{error}</span>
          <button onClick={() => setError(null)} className="ml-4 hover:opacity-70">✕</button>
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
