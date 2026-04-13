"use client";
import React, { useState, useEffect, useRef } from "react";
import { useWallet } from "@/hooks/useWallet";
import KYCFlow from "./KYCFlow";
import { ShieldCheck, Wallet, Sparkles, Database, History, ChevronRight, Loader2, Info, Check, Lock, ExternalLink, Terminal, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { WalletButton } from "@txnlab/use-wallet-ui-react";
import Link from "next/link";
import PageWrapper from "@/components/layout/PageWrapper";
import { isUserVerifiedOnChain } from "@/lib/algorand";

export default function EndToEndKYC() {
  const { address, isConnected, signMessage } = useWallet();
  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [oracleResult, setOracleResult] = useState<any>(null);
  const [step, setStep] = useState(1); // 1: Connect, 2: OTP/KYC, 3: Consent, 4: Result
  const [isReusing, setIsReusing] = useState(false);
  const [zkLogs, setZkLogs] = useState<string[]>([]);
  const [onChainTxId, setOnChainTxId] = useState<string | null>(null);
  const zkLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (zkLogRef.current) zkLogRef.current.scrollTop = zkLogRef.current.scrollHeight;
  }, [zkLogs]);

  const addZkLog = (msg: string) => setZkLogs(p => [...p, msg]);

  // ─── On-Chain Check: Skip KYC if already verified ──────────────────────────
  useEffect(() => {
    if (!isConnected || !address) return;

    const checkVerified = async () => {
      try {
        const alreadyVerified = await isUserVerifiedOnChain(address);
        if (alreadyVerified) {
          setVerifiedData({ type: "reused_proof", name: "Private Identity (ZK)", aadhaar: "XXXX", pan: "XXXXX" });
          setOracleResult({
            identityHash: alreadyVerified,
            reused: true,
            message: "Identity already registered on Algorand Testnet",
            timestamp: new Date().toISOString(),
            trustScore: 100,
            proofType: "ON_CHAIN",
            proofTypeLabel: "On-Chain Verified",
            source: "algorand",
          });
          setOnChainTxId("already_verified_skip");
          setStep(4);
          toast.success("✅ Welcome back! Your identity is already verified on-chain.");
        }
      } catch {
        // Silently ignore
      }
    };

    checkVerified();
  }, [isConnected, address]);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#10b981", "#34d399", "#ffffff"]
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#10b981", "#34d399", "#ffffff"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const [proofData, setProofData] = useState<any>(null);

  const handleWalletAuth = async () => {
    if (!isConnected) return;

    setIsAuthenticating(true);
    try {
      const challengeRes = await fetch("/api/wallet/challenge", {
        method: "POST",
        body: JSON.stringify({ address }),
        headers: { "Content-Type": "application/json" },
      });
      const { message } = await challengeRes.json();
      const signature = await signMessage(message);
      const verifyRes = await fetch("/api/wallet/verify", {
        method: "POST",
        body: JSON.stringify({ address, signature, message }),
        headers: { "Content-Type": "application/json" },
      });

      const verifyData = await verifyRes.json();
      if (verifyRes.ok && (verifyData.success || verifyData.verified)) {
        setStep(2);
      } else {
        throw new Error(verifyData.error || "Wallet verification failed.");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleReuseProof = async () => {
    setIsReusing(true);
    try {
      const res = await fetch("/api/zk/reuse", {
        method: "POST",
        body: JSON.stringify({ address }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to reuse proof");
      }
      
      setOracleResult({
        identityHash: data.proofHash,
        reused: true,
        message: "Proof Reused Successfully from On-Chain Box",
        timestamp: new Date().toISOString(),
        trustScore: 95,
        proofType: "GOVT_GRADE",
        proofTypeLabel: "Govt-Grade Verified",
        source: "digilocker"
      });
      setVerifiedData({ type: "reused_proof", name: "Private Identity (ZK)", aadhaar: "XXXX", pan: "XXXXX" });
      setStep(4);
      triggerConfetti();
    } catch (err: any) {
      toast.error("Error reusing proof: " + err.message);
    } finally {
      setIsReusing(false);
    }
  };

  const handleKYCVerified = (data: any) => {
    setVerifiedData(data);
    setStep(3);
  };

  const handleGrantConsent = async () => {
    setIsAuthenticating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsAuthenticating(false);
      setIsGeneratingProof(true);
      setZkLogs([]);
      addZkLog("> Consent anchored. Initializing ZK pipeline...");
      await new Promise(resolve => setTimeout(resolve, 400));

      const key = verifiedData.email || verifiedData.phone || verifiedData.pan;
      const res = await fetch("/api/oracle/fetch", {
        method: "POST",
        body: JSON.stringify({ key, wallet: address, data: verifiedData }),
        headers: { "Content-Type": "application/json" },
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Oracle attestation failed.");
      
      addZkLog(`> Oracle: Fetched attestation (source: ${result.source || "manual"})`);  

      const zkRes = await fetch("/api/zk/generate", {
        method: "POST",
        body: JSON.stringify({ wallet: address, oracleResult: result }),
        headers: { "Content-Type": "application/json" },
      });
      const zkInputData = await zkRes.json();
      if (!zkRes.ok) throw new Error(zkInputData.error || "Failed to prepare ZK inputs");

      // @ts-ignore
      if (!window.snarkjs) throw new Error("SnarkJS library not loaded.");

      addZkLog("> snarkjs.groth16.fullProve() — generating locally in browser...");

      // @ts-ignore
      const { proof: generatedProof, publicSignals: generatedSignals } = await window.snarkjs.groth16.fullProve(
        zkInputData.circuitInput,
        "/zk/kycMain.wasm",
        "/zk/kyc.zkey"
      );

      addZkLog("> Proof generated! πA, πB, πC computed.");
      setProofData({ proof: generatedProof, publicSignals: generatedSignals });
      
      localStorage.setItem("stealth_final_proof", JSON.stringify({
        hash: zkInputData.proofIdentifier,
        identity_hash: zkInputData.zkIdentity,
        proof: generatedProof, 
        publicSignals: generatedSignals, 
        wallet: address,
        proofSource: result.source,
        trustScore: result.trustScore,
        proofType: result.proofType,
        proofTypeLabel: result.proofTypeLabel,
        oracleSignature: result.signature,
        oracleDataHex: result.oracleDataHex,
        identityHash: result.identityHash,
      }));

      setOracleResult({ ...result, ...zkInputData });
      setStep(4);
      triggerConfetti();
    } catch (err: any) {
      toast.error("Error generating ZK proof: " + err.message);
      setIsAuthenticating(false);
    } finally {
      setIsGeneratingProof(false);
    }
  };

  return (
    <PageWrapper className="pt-2">
      <AnimatePresence>
        {isGeneratingProof && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="relative mb-6"
            >
              <div className="w-24 h-24 rounded-full border-4 border-emerald-500/20 flex items-center justify-center">
                <Lock className="w-10 h-10 text-emerald-500 animate-pulse" />
              </div>
              <div className="absolute inset-0 w-24 h-24 rounded-full border-t-4 border-emerald-500 animate-spin" />
            </motion.div>
            
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2">
              GENERATING <span className="text-emerald-500">ZK-PROOF</span>
            </h2>
            <div className="w-full max-w-lg bg-black/80 border border-emerald-500/20 rounded-2xl text-left overflow-hidden shadow-[0_0_40px_rgba(52,211,153,0.1)]">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
                <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">ZK Proof Terminal</span>
              </div>
              <div 
                ref={zkLogRef}
                className="h-36 overflow-y-auto p-4 font-mono text-xs space-y-1"
                style={{ scrollbarWidth: "none" }}
              >
                {zkLogs.map((log, i) => (
                  <motion.p key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="text-emerald-400/80">
                    {log}
                  </motion.p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-4 mb-12">
        <h1 className="text-5xl font-black text-white tracking-tighter">
          STEALTH <span className="text-emerald-500">ZK-KYC</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          Privacy-preserving identity standard for the Algorand Ecosystem. 
        </p>
      </div>

      {step === 4 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="glass-card rounded-3xl p-8 space-y-8 text-center border border-emerald-500/20 shadow-[0_0_40px_rgba(52,211,153,0.08)]">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20">
                <Check className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4">
                ✓ ZK Proof Generated
              </div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-3">
                Proof <span className="text-emerald-500">Ready</span>
              </h2>
              <p className="text-zinc-400 max-w-md mx-auto font-bold uppercase tracking-tight mb-8 text-sm">
                Your identity has been cryptographically verified off-chain.{" "}
                Now anchor the commitment hash on Algorand to make it immutable and publicly verifiable.
              </p>
              
              <div className="grid grid-cols-3 gap-3 w-full max-w-lg mb-8">
                 <div className="verify-stat-card">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Method</p>
                    <p className="text-sm font-black text-white tracking-tighter">ZK-SNARK</p>
                 </div>
                 <div className="verify-stat-card">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Trust Score</p>
                    <p className="text-sm font-black text-emerald-400 tracking-tighter">{oracleResult?.trustScore || 100}</p>
                 </div>
                 <div className="verify-stat-card">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Network</p>
                    <p className="text-sm font-black text-white tracking-tighter">ALGORAND</p>
                 </div>
              </div>

              {/* Primary CTA — anchor on Algorand */}
              <div className="flex flex-col gap-3 w-full max-w-md">
                 <Link href="/register" className="w-full">
                    <button className="btn-premium btn-green w-full h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(52,211,153,0.3)] hover:shadow-[0_0_50px_rgba(52,211,153,0.5)] transition-all">
                      <ShieldCheck className="w-6 h-6" /> Anchor on Algorand →
                    </button>
                 </Link>
                 <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                   Verify proof off-chain · Create commitment · Sign with wallet · Record on-chain
                 </p>
                 <Link href="/explorer" className="w-full">
                    <button className="w-full h-12 rounded-2xl border border-zinc-800 flex items-center justify-center font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 transition-all text-xs">
                      View Log Explorer
                    </button>
                 </Link>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="max-w-xl mx-auto space-y-8">
           <div className="glass-card rounded-[40px] p-8 md:p-12 shadow-inner border-white/5">
              {step === 1 && (
                <div className="space-y-8 text-center py-4">
                   <div className="w-24 h-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto ring-1 ring-emerald-500/20">
                     <Wallet className="w-12 h-12 text-emerald-400" />
                   </div>
                   <div className="space-y-2">
                     <h2 className="text-3xl font-black text-white">Connect Web3 Wallet</h2>
                     <p className="text-gray-400 px-4">Secure your identity on the Algorand blockchain.</p>
                   </div>
                   {!isConnected ? (
                     <div className="w-full central-wallet-trigger">
                       <WalletButton />
                       <style jsx global>{`
                         .central-wallet-trigger [data-wui-button] {
                           width: 100% !important;
                           height: 64px !important;
                           font-size: 18px !important;
                           background: linear-gradient(to right, #34d399, #10b981) !important;
                           color: black !important;
                           border-radius: 1rem !important;
                           font-weight: 900 !important;
                           text-transform: uppercase !important;
                           letter-spacing: 0.1em !important;
                           box-shadow: 0 0 30px rgba(52, 211, 153, 0.2) !important;
                           border: none !important;
                           transition: all 0.3s ease !important;
                           cursor: pointer !important;
                           display: flex !important;
                           align-items: center !important;
                           justify-content: center !important;
                         }
                       `}</style>
                     </div>
                   ) : (
                     <button 
                       onClick={handleWalletAuth}
                       disabled={isAuthenticating}
                       className="btn-premium btn-green w-full py-4 text-lg flex items-center justify-center gap-2"
                     >
                       Verify Authenticity
                     </button>
                   )}
                   {isConnected && (
                     <button 
                       onClick={handleReuseProof}
                       disabled={isReusing}
                       className="w-full text-slate-500 hover:text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 py-2"
                     >
                       <History className="w-3 h-3" /> or reuse existing credential
                     </button>
                   )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <KYCFlow onVerified={handleKYCVerified} walletAddress={address} />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8 text-center pt-4">
                   <div className="w-24 h-24 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto ring-1 ring-blue-500/20">
                     <Database className="w-12 h-12 text-blue-400" />
                   </div>
                   <div className="space-y-2">
                     <h2 className="text-3xl font-black text-white px-2">Consent & Sign</h2>
                     <p className="text-gray-400 px-6">Anchor your identity into Algorand Box storage securely.</p>
                   </div>
                   <button 
                    onClick={handleGrantConsent}
                    disabled={isGeneratingProof}
                    className="btn-premium btn-green w-full py-5 text-xl flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-6 h-6" /> Grant Consent & Generate
                  </button>
                </div>
              )}
           </div>
        </div>
      )}
    </PageWrapper>
  );
}
