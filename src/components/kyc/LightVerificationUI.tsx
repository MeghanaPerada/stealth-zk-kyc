"use client";

import React, { useState, useCallback } from "react";
import { useLightVerification } from "@/hooks/useLightVerification";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Loader2, 
  Lock, 
  Fingerprint, 
  Database, 
  Zap, 
  CheckCircle2, 
  Copy,
  Terminal,
  RefreshCw,
  History
} from "lucide-react";
import { GlowingCard } from "@/components/ui/glowing-card";
import { Button } from "@/components/ui/button";

/**
 * LightVerificationUI
 * 
 * A premium verification module for simulated ZK proofs.
 * Features strict nullifier tracking and timestamp validation.
 */
export default function LightVerificationUI() {
  const [proofJson, setProofJson] = useState("");
  const { isVerifying, result, status, executeVerification, resetVerification } = useLightVerification();

  const handleVerify = () => {
    try {
      const parsed = JSON.parse(proofJson);
      executeVerification(parsed);
    } catch (err) {
      alert("Invalid JSON format. Please check your proof payload.");
    }
  };

  const handleReset = () => {
    setProofJson("");
    resetVerification();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">
            Secure <span className="text-emerald-500">Light Verifier</span>
          </h2>
          <p className="text-zinc-500 text-sm font-medium max-w-md">
            Stateless protocol verification with local nullifier tracking and simulated Algorand anchoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Protocol v1.0 Valid</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Side: Input */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-1 shadow-2xl overflow-hidden group focus-within:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
               <Terminal className="w-3.5 h-3.5 text-emerald-500" />
               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Proof Payload (JSON)</span>
            </div>
            <textarea
              className="w-full h-64 bg-transparent p-6 font-mono text-xs text-emerald-500/90 outline-none resize-none placeholder:text-zinc-700"
              placeholder='{ "commitment": "...", "nullifier": "...", "claim": "verified_user", "timestamp": 1713028200000 }'
              value={proofJson}
              onChange={(e) => setProofJson(e.target.value)}
              spellCheck={false}
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleVerify}
              disabled={isVerifying || !proofJson}
              className="flex-1 h-14 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all disabled:opacity-50"
            >
              {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {isVerifying ? "Verifying..." : "Execute Verification"}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-14 h-14 border-white/5 bg-white/5 text-zinc-500 hover:text-white rounded-2xl flex items-center justify-center transition-all"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Right Side: Status */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {status === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full bg-black/20 border border-white/5 border-dashed rounded-[2rem] flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                  <Fingerprint className="w-8 h-8 text-zinc-700" />
                </div>
                <h4 className="text-zinc-400 font-bold uppercase tracking-tight mb-2">Awaiting Payload</h4>
                <p className="text-zinc-600 text-[10px] uppercase tracking-widest">Provide a cryptographic proof to begin validation.</p>
              </motion.div>
            )}

            {status === "verifying" && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="relative mb-8">
                   <div className="w-20 h-20 rounded-full border-2 border-emerald-500/10" />
                   <motion.div 
                     animate={{ rotate: 360 }}
                     transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                     className="absolute inset-0 w-20 h-20 rounded-full border-t-2 border-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                   />
                   <Lock className="absolute inset-0 m-auto w-6 h-6 text-emerald-500 animate-pulse" />
                </div>
                <h4 className="text-emerald-500 font-black uppercase tracking-widest text-xs mb-2">Analyzing Constraints</h4>
                <div className="space-y-1 text-zinc-600 text-[9px] uppercase font-black tracking-widest">
                   <p>Checking Commitment...</p>
                   <p>Validating Nullifier...</p>
                   <p>Computing Proof Hash...</p>
                </div>
              </motion.div>
            )}

            {status === "success" && result && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full glass-card border-emerald-500/20 rounded-[2rem] flex flex-col p-8 shadow-[0_0_50px_rgba(52,211,153,0.1)]"
              >
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                   </div>
                   <div>
                      <h4 className="text-white font-black uppercase tracking-tighter">Verified ✅</h4>
                      <p className="text-emerald-500/70 text-[9px] font-black uppercase tracking-widest">Math Verified & Anchored</p>
                   </div>
                </div>

                <div className="space-y-6 flex-1">
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Proof Hash (Algorand Anchor)</p>
                     <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between group">
                        <span className="font-mono text-[9px] text-zinc-400 truncate max-w-[140px]">{result.proofHash}</span>
                        <button className="p-2 hover:bg-emerald-500/10 rounded-lg text-zinc-600 hover:text-emerald-400 transition-all">
                           <Copy className="w-3.5 h-3.5" />
                        </button>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Nullifier</p>
                        <p className="text-xs font-black text-zinc-300">Active ✓</p>
                     </div>
                     <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">State</p>
                        <p className="text-xs font-black text-emerald-500">Immutable 🔗</p>
                     </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3">
                   <Database className="w-4 h-4 text-zinc-500" />
                   <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest leading-tight">
                      Simulation Complete: <br/>
                      <span className="text-zinc-500">Recorded on local stealth-vault</span>
                   </p>
                </div>
              </motion.div>
            )}

            {status === "failure" && result && (
              <motion.div
                key="failure"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full bg-red-500/5 border border-red-500/20 rounded-[2rem] flex flex-col p-8 shadow-[0_0_50px_rgba(239,68,68,0.1)]"
              >
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                      <ShieldAlert className="w-6 h-6" />
                   </div>
                   <div>
                      <h4 className="text-white font-black uppercase tracking-tighter text-red-400">Security Fault ❌</h4>
                      <p className="text-red-500/70 text-[9px] font-black uppercase tracking-widest">Verification Rejected</p>
                   </div>
                </div>

                <div className="flex-1">
                   <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                      {result.message}
                   </p>
                </div>

                <div className="mt-8 pt-6 border-t border-red-500/10 flex items-center gap-3">
                   <Zap className="w-4 h-4 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                   <p className="text-red-500 text-[10px] font-black uppercase tracking-widest leading-tight">
                      System Lockdown: <br/>
                      <span className="text-red-500/70">Anti-replay measure triggered</span>
                   </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
