"use client";

import React, { useState } from "react";
import { useLightIdentity } from "@/hooks/useLightIdentity";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Mail, 
  Key, 
  Loader2, 
  ShieldCheck, 
  Lock, 
  Smartphone, 
  Fingerprint, 
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  Terminal,
  RefreshCw,
  Copy,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlowingCard } from "@/components/ui/glowing-card";

/**
 * DigiLockerMock
 * 
 * A simulated DigiLocker-style onboarding flow for generating 
 * simulated ZK identity commitments.
 */
export default function DigiLockerMock() {
  const { 
    step, 
    formData, 
    setFormData, 
    inputOtp, 
    setInputOtp, 
    generatedOtp,
    isGenerating, 
    proof, 
    hasIdentity, 
    initiateOtp, 
    verifyOtp, 
    generateNewProof,
    resetIdentity 
  } = useLightIdentity();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {/* STEP 1: Form Entry */}
        {step === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-[2rem] p-8 md:p-10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Fingerprint className="w-32 h-32 text-blue-500" />
               </div>
               
               <div className="relative z-10 space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                       <User className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-white uppercase tracking-tighter">Mock DigiLocker</h3>
                       <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Secure Identity Verification</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
                       <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                          <input 
                            type="text" 
                            className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl pl-12 pr-6 text-zinc-200 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all outline-none"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                       <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                          <input 
                            type="email" 
                            className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl pl-12 pr-6 text-zinc-200 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all outline-none"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                       </div>
                    </div>
                 </div>

                 <Button 
                   onClick={initiateOtp}
                   className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-3xl shadow-[0_0_30px_rgba(37,99,235,0.2)] transition-all flex items-center justify-center gap-3"
                 >
                   Request Verification OTP <ArrowRight className="w-5 h-5" />
                 </Button>
               </div>
            </div>

            <div className="flex items-center gap-4 px-6 py-4 bg-white/[0.02] border border-white/5 rounded-2xl">
               <Info className="w-4 h-4 text-blue-500 shrink-0" />
               <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                  Notice: This is a **simulated DigiLocker environment**. Your data is hashed locally and never sent to any actual government server.
               </p>
            </div>
          </motion.div>
        )}

        {/* STEP 2: OTP Verification */}
        {step === "otp" && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 md:p-10 text-center space-y-8">
               <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-500">
                  <Smartphone className="w-10 h-10 animate-bounce" />
               </div>

               <div className="space-y-2">
                  <h3 className="text-white text-2xl font-black uppercase tracking-tighter">Enter Verification Code</h3>
                  <p className="text-zinc-500 text-xs">An OTP has been sent to <span className="text-blue-400">{formData.email}</span></p>
               </div>

               <div className="relative max-w-[240px] mx-auto">
                  <input 
                    type="text" 
                    maxLength={6}
                    className="w-full h-20 bg-black/60 border-2 border-white/10 rounded-3xl text-center text-4xl font-black tracking-[0.5em] text-white focus:border-blue-500 transition-all outline-none"
                    placeholder="000000"
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value)}
                  />
                  <div className="absolute -bottom-10 left-0 right-0">
                     <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em]">Mock OTP: {generatedOtp}</p>
                  </div>
               </div>

               <div className="pt-8">
                 <Button 
                   onClick={verifyOtp}
                   disabled={inputOtp.length < 6}
                   className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-3xl transition-all"
                 >
                   Verify & Anchor Identity
                 </Button>
               </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Loading / Proving */}
        {step === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-96 flex flex-col items-center justify-center space-y-8"
          >
             <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-blue-500/10" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 w-32 h-32 rounded-full border-t-4 border-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.4)]"
                />
                <Lock className="absolute inset-0 m-auto w-8 h-8 text-blue-500" />
             </div>
             <div className="text-center space-y-2">
                <h4 className="text-white font-black uppercase tracking-widest text-sm">Generating Identity Vault</h4>
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Computing SHA-256 Commitments...</p>
             </div>
          </motion.div>
        )}

        {/* STEP 4: Complete / Proof Controller */}
        {step === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <GlowingCard glowColor="primary" className="p-1">
               <div className="bg-black/60 backdrop-blur-3xl rounded-2xl p-8 space-y-8">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                           <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-white uppercase tracking-tighter">Identity Anchored</h3>
                           <p className="text-emerald-500 text-[9px] font-black uppercase tracking-widest">Digital Vault Ready</p>
                        </div>
                     </div>
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       onClick={resetIdentity}
                       className="text-zinc-600 hover:text-red-400 transition-colors"
                     >
                       <RefreshCw className="w-4 h-4 mr-2" /> Reset
                     </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Commitment Hash</p>
                        <div className="font-mono text-[9px] text-zinc-400 break-all p-3 bg-black/40 rounded-xl border border-white/5">
                           {localStorage.getItem("identityCommitment")}
                        </div>
                     </div>
                     <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Secret Key</p>
                        <div className="font-mono text-[9px] text-zinc-400 break-all p-3 bg-black/40 rounded-xl border border-white/5 relative group">
                           <span className="blur-sm group-hover:blur-none transition-all">{localStorage.getItem("identitySecret")?.slice(0, 16)}...</span>
                           <Key className="absolute right-3 top-3 w-3 h-3 text-zinc-800" />
                        </div>
                     </div>
                  </div>

                  <div className="pt-4 space-y-6">
                     <Button 
                       onClick={generateNewProof}
                       disabled={isGenerating}
                       className="w-full h-16 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest rounded-3xl shadow-xl transition-all flex items-center justify-center gap-3"
                     >
                        {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                        Generate Simulated ZK Proof
                     </Button>

                     <AnimatePresence>
                        {proof && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                             <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4">
                                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                                <div className="flex items-center gap-3 text-emerald-500 mb-4">
                                   <Terminal className="w-4 h-4" />
                                   <span className="text-[10px] font-black uppercase tracking-widest">Generated Proof Payload</span>
                                </div>
                                <pre className="text-[10px] font-mono text-zinc-400 overflow-x-auto bg-black/40 p-4 rounded-xl border border-white/5 custom-scrollbar">
                                   {JSON.stringify(proof, null, 2)}
                                </pre>
                                <div className="mt-4 flex gap-3">
                                   <Button 
                                     onClick={() => copyToClipboard(JSON.stringify(proof))}
                                     className="flex-1 h-12 bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                                   >
                                      <Copy className="w-3.5 h-3.5" /> Copy Proof JSON
                                   </Button>
                                   <Button 
                                     variant="outline"
                                     className="h-12 px-6 border-white/10 bg-white/5 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                     onClick={() => window.open("/verify-light", "_blank")}
                                   >
                                      Go to Verifier
                                   </Button>
                                </div>
                             </div>
                          </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               </div>
            </GlowingCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
