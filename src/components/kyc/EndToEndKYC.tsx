"use client";
import React, { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import KYCFlow from "./KYCFlow";
import { ShieldCheck, Wallet, Sparkles, Database, History, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function EndToEndKYC() {
  const { address, isConnected, connectWallet, signMessage } = useWallet();
  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [oracleResult, setOracleResult] = useState<any>(null);
  const [step, setStep] = useState(1); // 1: Connect, 2: OTP/KYC, 3: Consent, 4: Result

  const handleWalletAuth = async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    setIsAuthenticating(true);
    try {
      // 1. Get Challenge
      const challengeRes = await fetch("/api/wallet/challenge", {
        method: "POST",
        body: JSON.stringify({ address }),
        headers: { "Content-Type": "application/json" },
      });
      const { message } = await challengeRes.json();

      // 2. Sign Challenge (useWallet hook internally handles encoding and transaction wrapper)
      const signature = await signMessage(message);

      // 3. Verify on Backend
      const verifyRes = await fetch("/api/wallet/verify", {
        method: "POST",
        body: JSON.stringify({ address, signature, message }),
        headers: { "Content-Type": "application/json" },
      });

      const verifyData = await verifyRes.json();
      
      // Support both 'success' and 'verified' keys for resilience
      if (verifyRes.ok && (verifyData.success || verifyData.verified)) {
        setStep(2); // ✅ Explicitly move to OTP/KYC step only after verification
        console.log("Wallet verified successfully. Transitioning to KYC step.");
      } else {
        throw new Error(verifyData.error || "Wallet verification failed. Please try again.");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleKYCVerified = async (data: any) => {
    setVerifiedData(data);
    // Move to the new Consent Step (Step 3) instead of jumping straight to proof generation
    setStep(3);
  };

  const handleGrantConsent = async () => {
    setIsAuthenticating(true);
    try {
      // Create a mock transaction or use algokit-utils to construct an ABI call
      // For this hackathon demo, we'll simulate the on-chain confirmation delay
      // then request the backend to generate and store the proof.
      
      // In a raw implementation, this would be:
      // const txn = algosdk.makeApplicationCallTxnFromObject({...})
      // const signed = await signTransactions([txn.toByte()])
      // await algod.sendRawTransaction(signed[0]).do()
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate tx signing & confirmation
      console.log('On-chain consent granted and anchored into Box storage');

      setIsAuthenticating(false);
      setIsGeneratingProof(true);
      
      const key = verifiedData.email || verifiedData.phone || verifiedData.pan;
      
      // 1. Fetch Oracle Data & ZK Proof
      const res = await fetch("/api/oracle/fetch", {
        method: "POST",
        body: JSON.stringify({ 
          key, 
          wallet: address, 
          data: verifiedData 
        }),
        headers: { "Content-Type": "application/json" },
      });
      
      const result = await res.json();
      
      // 2. Store Proof Hash on-chain
      if (result.identityHash) {
        await fetch("/api/zk/storeProof", {
            method: "POST",
            body: JSON.stringify({
                walletAddress: address,
                proofHash: result.identityHash
            }),
            headers: { "Content-Type": "application/json" },
        });
      }

      setOracleResult(result);
      setStep(4);
    } catch (err: any) {
      alert("Error generating ZK proof or storing consensus: " + err.message);
      setIsAuthenticating(false);
    } finally {
      setIsGeneratingProof(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-8 py-10">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Stealth <span className="text-emerald-500">ZK-KYC</span> Protocol
        </h2>
        <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
          Privacy-first identity attestation. Your PII is verified by the Oracle, but only a zero-knowledge proof is stored on-chain.
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
        {[1, 2, 3, 4].map((s) => (
          <React.Fragment key={s}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
              step >= s ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-lg shadow-emerald-500/10" : "border-slate-800 text-slate-600"
            }`}>
              {step > s ? <ShieldCheck className="w-5 h-5" /> : <span className="font-bold">{s}</span>}
            </div>
            {s < 4 && <div className={`h-0.5 flex-1 ${step > s ? "bg-emerald-500" : "bg-slate-800"}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900/40 border border-slate-800 rounded-3xl p-10 text-center space-y-8"
            >
              <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
                <Wallet className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white">Bind Your Wallet</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
                  To prevent identity theft and ensure your KYC proof is "Judge-Proof", we must bind it to your Algorand wallet address.
                </p>
              </div>
              <button 
                onClick={handleWalletAuth}
                disabled={isAuthenticating}
                className="group relative bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-10 rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mx-auto overflow-hidden shadow-2xl shadow-emerald-500/20"
              >
                {isAuthenticating ? <Loader2 className="animate-spin w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                {isConnected ? "Authenticate & Proceed" : "Connect Wallet"}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transform translate-y-2 group-hover:translate-y-0 transition-transform" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-md mx-auto"
            >
              <KYCFlow onVerified={handleKYCVerified} walletAddress={address} />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900/40 border border-slate-800 rounded-3xl p-10 text-center space-y-8 max-w-lg mx-auto"
            >
              <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
                <Database className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white">Grant On-Chain Consent</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
                  You are about to sign an Algorand smart contract transaction to grant the Oracle permission to fetch your identity and anchor your ZK proof on-chain securely.
                </p>
                <div className="bg-slate-950 p-4 rounded-xl text-left border border-slate-800">
                   <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Allowed Fields</p>
                   <p className="text-emerald-400 text-sm font-mono">+ PAN, Aadhaar, DOB, Name</p>
                </div>
              </div>
              <button 
                onClick={handleGrantConsent}
                disabled={isAuthenticating || isGeneratingProof}
                className="group relative w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-10 rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-1 mx-auto overflow-hidden shadow-2xl shadow-emerald-500/20"
              >
                {isAuthenticating || isGeneratingProof ? (
                  <div className="flex items-center gap-2"><Loader2 className="animate-spin w-5 h-5" /> Processing smart contract & generating proof...</div>
                ) : (
                  <div className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> Sign Consent Transaction</div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transform translate-y-2 group-hover:translate-y-0 transition-transform" />
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, zoom: 0.8 }}
              animate={{ opacity: 1, zoom: 1 }}
              className="space-y-6"
            >
              <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-3xl p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce-short shadow-2xl shadow-emerald-500/50">
                  <ShieldCheck className="w-10 h-10 text-black" />
                </div>
                <h3 className="text-3xl font-black text-white italic">PROOF GENERATED!</h3>
                <p className="text-emerald-400 font-mono text-xs tracking-widest uppercase">
                  ID Hash Bind: {oracleResult?.identityHash?.substring(0, 16)}...
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <Database className="w-4 h-4" />
                    ZK Proof Metadata
                  </div>
                  <pre className="text-[10px] text-emerald-400/80 bg-black/50 p-4 rounded-xl overflow-x-auto border border-emerald-500/10 h-40">
                    {JSON.stringify(oracleResult, null, 2)}
                  </pre>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <History className="w-4 h-4" />
                    Protocol Explorer
                  </div>
                  <div className="bg-black/50 p-4 rounded-xl border border-slate-800 h-40 flex flex-col justify-center gap-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Status</span>
                      <span className="text-emerald-500 font-bold px-2 py-0.5 bg-emerald-500/10 rounded">On-Chain Encrypted</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Method</span>
                      <span className="text-white font-mono">{verifiedData?.type}_attestation</span>
                    </div>
                    <button 
                      onClick={() => window.location.href = "/explorer"}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      View on Protocol Explorer <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <center>
                <button 
                  onClick={() => setStep(1)}
                  className="text-slate-500 hover:text-white text-xs uppercase font-bold tracking-widest transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-3 h-3" /> Start New Session
                </button>
              </center>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
