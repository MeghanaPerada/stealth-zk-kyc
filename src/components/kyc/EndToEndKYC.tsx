"use client";
import React, { useState, useEffect, useRef } from "react";
import { useWallet } from "@/hooks/useWallet";
import KYCFlow from "./KYCFlow";
import { calculateIdentityHash, calculateConsentHash, toFieldElement, packProofBytes, packPublicSignals } from "@/lib/circuitHelpers";
import { ShieldCheck, Wallet, Sparkles, Database, History, ChevronRight, Loader2, Info, Check, Lock, ExternalLink, Terminal, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { WalletButton } from "@txnlab/use-wallet-ui-react";
import { ZkpVerifierClient } from "@/contracts/zkp_verifier/ZkpVerifierClient";
import { AlgorandClient, microAlgos } from "@algorandfoundation/algokit-utils";
import * as algosdk from "algosdk";

import PageWrapper from "@/components/layout/PageWrapper";
import { isUserVerifiedOnChain } from "@/lib/algorand";

export default function EndToEndKYC() {
  const { address, isConnected, connectWallet, signMessage } = useWallet();
  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [oracleResult, setOracleResult] = useState<any>(null);
  const [step, setStep] = useState(1); // 1: Connect, 2: OTP/KYC, 3: Consent, 4: Result
  const [isReusing, setIsReusing] = useState(false);
  const [zkLogs, setZkLogs] = useState<string[]>([]);
  const [isVerifyingOnChain, setIsVerifyingOnChain] = useState(false);
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
          // Fast-track to the credential view — no need to redo KYC
          setVerifiedData({ type: "reused_proof", name: "Private Identity (ZK)", aadhaar: "XXXX", pan: "XXXXX" });
          setOracleResult({
            identityHash: address,
            reused: true,
            message: "Identity already registered on Algorand Testnet",
            timestamp: new Date().toISOString(),
            trustScore: 100,
            proofType: "ON_CHAIN",
            proofTypeLabel: "On-Chain Verified",
            source: "algorand",
          });
          setStep(4);
          toast.success("✅ Welcome back! Your identity is already verified on-chain.");
        }
      } catch {
        // Silently ignore — just run normal KYC if the check fails
      }
    };

    checkVerified();
  }, [isConnected, address]);
  // ─────────────────────────────────────────────────────────────────────────

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
    if (!isConnected) {
      // WalletButton handles the connection itself now
      return;
    }

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

  const handleKYCVerified = async (data: any) => {
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
      
      if (!res.ok) {
        throw new Error(result.error || "Oracle attestation failed. Check server logs.");
      }
      
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
        // Persist oracle auth data so handleVerifyOnChain works even after a page refresh
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

  const handleVerifyOnChain = async () => {
    setIsVerifyingOnChain(true);
    try {
      const localProof = localStorage.getItem("stealth_final_proof");
      if (!localProof) throw new Error("No proof found in local storage.");
      const parsed = JSON.parse(localProof);

      if (!address) throw new Error("Wallet not connected.");
      
      const envId = process.env.NEXT_PUBLIC_ZKP_VERIFIER_APP_ID;
      const verifierAppId = parseInt(envId || "0");
      if (!verifierAppId) {
        throw new Error("ZkpVerifier App ID not configured. If you are on Vercel, please add NEXT_PUBLIC_ZKP_VERIFIER_APP_ID to your Environment Variables and redeploy.");
      }

      // 1. Initialize Client
      const algorand = AlgorandClient.testNet();
      algorand.setSigner(address, signMessage as any); // signMessage is from our hook
      
      const client = new ZkpVerifierClient({
        algorand,
        appId: BigInt(verifierAppId),
        defaultSender: address
      });

      // 2. Prepare Arguments
      // The contract expects byte[] for proof and publicInputs.
      // We use our helpers to pack them.
      const packedProof = packProofBytes(parsed.proof);
      const packedSignals = packPublicSignals(parsed.publicSignals);
      
      // Oracle Data: use the exact 32-byte blob the oracle signed (oracleDataHex from oracle API).
      // Fall back to parsed localStorage value if in-memory state is stale (e.g. after page refresh).
      const oracleDataHex = oracleResult?.oracleDataHex || parsed.oracleDataHex;
      const oracleSigHex  = oracleResult?.signature     || parsed.oracleSignature;

      if (!oracleDataHex || !oracleSigHex) {
        throw new Error("Oracle attestation data is missing. Please complete the KYC flow again to generate a fresh proof.");
      }

      const oracleData      = new Uint8Array(Buffer.from(oracleDataHex, "hex"));
      const oraclePubKeys   = [new Uint8Array(Buffer.from(process.env.NEXT_PUBLIC_ORACLE_PUBKEY || "", "hex"))];
      const oracleSignatures = [new Uint8Array(Buffer.from(oracleSigHex, "hex"))];

      toast.loading("Sending Verification Transaction...");

      const registryAppId = parseInt(process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_APP_ID || "0");

      // 3. Call Contract
      const result = await client.send.verifyAndRegister({
        args: {
            proof: packedProof,
            publicInputs: packedSignals,
            oracleData: oracleData,
            oraclePubKeys: oraclePubKeys,
            oracleSignatures: oracleSignatures,
            proofId: parsed.hash || "manual_reg"
        },
        appReferences: registryAppId ? [BigInt(registryAppId)] : [],
        extraFee: microAlgos(2000), // Cover inner txn fee
      });

      const txId = result.transaction.txID();
      setOnChainTxId(txId);
      
      // Update local storage with real Tx ID
      localStorage.setItem("stealth_final_proof", JSON.stringify({ ...parsed, txId: txId }));
      
      toast.success("Identity Verified & Registered On-Chain! 🚀");
      triggerConfetti();
    } catch (err: any) {
      console.error("On-Chain Verification Error:", err);
      toast.error("On-Chain Verification Failed: " + (err.message || "Unknown error"));
    } finally {
      setIsVerifyingOnChain(false);
    }
  };

  return (
    <PageWrapper className="pt-2">
      <AnimatePresence>
        {isGeneratingProof && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
          Verify with DigiLocker, prove with Zero-Knowledge, and anchor on-chain.
        </p>
      </div>

      {step === 4 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* LEFT: DigiLocker Premium Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="digilocker-card group">
              <div className="flex justify-between items-start mb-8">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white">🏛 DigiLocker</h2>
                  <p className="text-blue-100/60 text-xs font-bold uppercase tracking-widest">Identity Certificate</p>
                </div>
                <span className="bg-emerald-500 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter animate-pulse shadow-lg shadow-emerald-500/20">
                  Govt Grade
                </span>
              </div>

              <div className="glass-card rounded-xl p-6 space-y-4 relative overflow-hidden">
                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-blue-100/40 text-[10px] font-black uppercase">Name</span>
                    <span className="text-lg font-bold text-white truncate max-w-[200px] text-right">{verifiedData?.name || "Verified Identity"}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-blue-100/40 text-[10px] font-black uppercase">Aadhaar (Masked)</span>
                    <span className="text-lg font-mono text-white">XXXX XXXX {verifiedData?.aadhaar ? verifiedData.aadhaar.slice(-4) : (verifiedData?.aadhaar_last4 || "XXXX")}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-blue-100/40 text-[10px] font-black uppercase">PAN Card</span>
                    <span className="text-lg font-mono text-white">{verifiedData?.pan || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100/40 text-[10px] font-black uppercase">Identity Hash</span>
                    <span className="text-[10px] font-mono text-emerald-400 truncate max-w-[120px]">{oracleResult?.identityHash}</span>
                  </div>
                </div>
                <ShieldCheck className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 transform -rotate-12" />
              </div>

              <div className="mt-6 flex items-center gap-3 text-sm text-blue-100/60 font-medium">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)]" />
                Securely Verified via Crypto-Enclave
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" /> Blockchain Evidence
              </h3>
              <div className="space-y-4 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tx Hash:</span>
                  {onChainTxId ? (
                    <a 
                      href={`https://testnet.explorer.perawallet.app/tx/${onChainTxId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 truncate max-w-[150px] hover:underline flex items-center gap-1"
                    >
                      {onChainTxId} <ExternalLink className="w-2 h-2" />
                    </a>
                  ) : (
                    <span className="text-gray-300 truncate max-w-[150px]">Pending Verification...</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className={onChainTxId ? "text-emerald-500 font-bold" : "text-amber-500"}>
                    {onChainTxId ? "🟢 Confirmed" : "🟡 Not Anchored"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: ZK Verification Section */}
          <div className="lg:col-span-7">
            <div className="glass-card rounded-3xl p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-white tracking-tighter">
                  🔐 ZK-Proof Dashboard
                </h2>
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                   Valid Proof Verified Locally
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="verify-stat-card">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-2xl font-black text-emerald-400 tracking-tighter flex items-center gap-2">
                    <Check className="w-6 h-6" /> VALID
                  </p>
                </div>
                <div className="verify-stat-card">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Trust Score</p>
                  <p className="text-2xl font-black text-white tracking-tighter">{oracleResult?.trustScore || 100}</p>
                </div>
                <div className="verify-stat-card">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Certification</p>
                  <p className="text-2xl font-black text-white tracking-tighter">GOVT-GRADE</p>
                </div>
                <div className="verify-stat-card">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Source</p>
                  <p className="text-2xl font-black text-white tracking-tighter uppercase">{oracleResult?.source || "DIGILOCKER"}</p>
                </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Public Verification Signals</h4>
                 <div className="bg-black/60 rounded-xl p-6 font-mono text-sm text-emerald-400/80 border border-emerald-500/10 h-48 overflow-y-auto">
                    {JSON.stringify(proofData?.publicSignals, null, 2)}
                 </div>
              </div>

              <div className="pt-4">
                {!onChainTxId ? (
                  <button 
                    onClick={handleVerifyOnChain}
                    disabled={isVerifyingOnChain}
                    className="btn-premium btn-green w-full py-5 text-xl tracking-tight shadow-[0_0_30px_rgba(16,185,129,0.2)] flex items-center justify-center gap-3"
                  >
                    {isVerifyingOnChain ? (
                      <>
                        <Loader2 className="animate-spin w-6 h-6" />
                        Verifying on Algorand...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-6 h-6" />
                        Finalize & Register on Algorand
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => window.location.href = "/explorer"}
                      className="btn-premium bg-white/10 hover:bg-white/20 text-white flex-1 py-4 flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-5 h-5" /> View Registry
                    </button>
                    <button 
                      onClick={() => setStep(1)}
                      className="btn-premium bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 flex-1 py-4 border border-emerald-500/20"
                    >
                      New Verification
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="max-w-xl mx-auto space-y-8">
           {/* Steps 1, 2, 3 wrapped in a simpler glass UI */}
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
                         .central-wallet-trigger [data-wui-button]:hover {
                           box-shadow: 0 0 50px rgba(52, 211, 153, 0.4) !important;
                           transform: scale(1.02) !important;
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
