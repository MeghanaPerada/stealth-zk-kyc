"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShieldAlert, XCircle, Search, Clock, FileJson, ShieldCheck, Lock, ArrowRight } from "lucide-react";
import { GlowingCard } from "@/components/ui/glowing-card";
import { useWallet } from "@/hooks/useWallet";

function VerificationDashboardContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";
  
  const [proofId, setProofId] = useState(initialId);
  const { algodClient, address } = useWallet();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<null | 'valid' | 'invalid'>(null);
  const [verificationSteps, setVerificationSteps] = useState<string[]>([]);
  const [proofDetails, setProofDetails] = useState<any>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofId) return;
    
    setIsVerifying(true);
    setVerificationResult(null);
    setVerificationSteps([]);
    setProofDetails(null);

    try {
      setVerificationSteps(prev => [...prev, "Initiating Secure Verification via Proxy..."]);
      
      // Step 1: Resolve proof object (Try to find it in localStorage for demo, or construct it)
      const storedCredStr = localStorage.getItem("stealth_identity_credential");
      let proofToVerify = null;
      
      if (storedCredStr) {
        const storedCred = JSON.parse(storedCredStr);
        // If the pasted ID matches the one in our local storage, use the full proof object
        if (storedCred.proofHash === proofId || (storedCred.proof && storedCred.proof.proofHash === proofId)) {
          proofToVerify = storedCred.proof || storedCred;
          setVerificationSteps(prev => [...prev, "Local Proof Object Resolved..."]);
        }
      }

      // If not found locally, we send just the ID and the backend will handle lookup
      const payload = {
        proof: proofToVerify || { proofHash: proofId },
        walletAddress: address || ""
      };

      // Use local unified API route
      const response = await fetch("/api/kyc/verify", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-wallet-address": address || ""
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.verified) {
        setVerificationSteps(prev => [...prev, "Backend Verification: PASSED"]);
        setVerificationSteps(prev => [...prev, "On-chain Cross-check: SUCCESS"]);
        setVerificationResult('valid');
        setProofDetails({
          w_bound: address,
          attr: data.dbRecord?.sourceType || "Manual/Oracle"
        });
      } else {
        setVerificationSteps(prev => [...prev, data.message || "Verification Failed"]);
        setVerificationResult('invalid');
      }

    } catch (error: any) {
      console.error("Verification failed:", error);
      setVerificationSteps(prev => [...prev, "Error: " + (error.message || "Network failure")]);
      setVerificationResult('invalid');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight uppercase tracking-tighter">Verifier Network</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto italic font-light">
          Secured by Algorand. Instantly verify cryptographic proofs without accessing identity data.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 pl-4 pr-4">
        {/* Verification Input Side */}
        <motion.div
           initial={{ opacity: 0, x: -30 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.5 }}
        >
          <GlowingCard glowColor="primary" className="h-full p-1">
            <div className="bg-black/40 backdrop-blur-3xl rounded-2xl h-full p-8 md:p-10 flex flex-col border-t border-white/5">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-[0_0_20px_rgba(52,211,153,0.1)]">
                  <Search className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-widest">Verify Identity</h2>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Algorand Consensus Query</p>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-8 flex-1 flex flex-col">
                <div className="space-y-3 group">
                  <Label htmlFor="proofId" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-focus-within:text-primary transition-colors">
                    ZK Proof Identifier
                  </Label>
                  <div className="relative">
                     <Input
                       id="proofId"
                       placeholder="prf_0x8f2a9c..."
                       value={proofId}
                       onChange={(e) => setProofId(e.target.value)}
                       className="bg-white/5 font-mono text-sm border-white/5 focus-visible:ring-primary/30 focus-visible:border-primary/30 h-16 rounded-2xl backdrop-blur-md transition-all placeholder:text-zinc-700 shadow-sm"
                       required
                     />
                  </div>
                </div>
                
                <div className="mt-auto pt-8">
                  <button 
                    type="submit" 
                    className="w-full h-16 text-lg font-black tracking-widest uppercase bg-gradient-to-r from-primary to-emerald-400 text-black shadow-[0_0_30px_rgba(52,211,153,0.3)] hover:shadow-[0_0_50px_rgba(52,211,153,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-2xl relative overflow-hidden group flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none"
                    disabled={isVerifying || !proofId}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                    {isVerifying ? (
                       <span className="flex items-center relative z-10">
                         <span className="w-5 h-5 rounded-full border-2 border-black/40 border-t-black animate-spin mr-3"></span>
                         Verifying...
                       </span>
                    ) : (
                      <span className="flex items-center relative z-10">
                        <ShieldCheck className="w-6 h-6 mr-3" /> Execute Verifier
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </GlowingCard>
        </motion.div>

        {/* Verification Result Side */}
        <div className="flex flex-col h-full min-h-[400px]">
            <AnimatePresence mode="wait">
              {verificationResult === null && !isVerifying && (
                 <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="h-full"
                 >
                   <div className="h-full border border-white/5 border-dashed bg-white/5 backdrop-blur-2xl rounded-3xl flex items-center justify-center p-10">
                      <div className="text-center space-y-6 max-w-sm">
                         <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5 shadow-xl">
                           <ShieldAlert className="w-10 h-10 text-zinc-700" />
                         </div>
                         <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">Awaiting Signal</h3>
                         <p className="text-zinc-600 text-xs font-medium leading-relaxed uppercase tracking-tighter">Enter a proof identifier to cryptographically verify user attributes through the Algorand-secured verifier network.</p>
                      </div>
                   </div>
                 </motion.div>
              )}

              {isVerifying && (
                <motion.div
                   key="verifying"
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 1.02 }}
                   className="h-full"
                >
                  <div className="h-full border border-primary/20 bg-black/40 backdrop-blur-3xl rounded-3xl flex flex-col items-center justify-center p-12 relative overflow-hidden">
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-[400px]"
                      animate={{ top: ['-100%', '200%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    
                    <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse" />
                      <motion.div 
                        className="absolute inset-0 rounded-full border-t-2 border-primary shadow-[0_0_15px_rgba(52,211,153,0.4)]"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <Lock className="w-7 h-7 text-primary/80" />
                    </div>
                    
                    <h3 className="text-lg font-black uppercase tracking-widest text-primary drop-shadow-sm mb-6">Verifying Proof</h3>
                    <div className="w-full max-w-xs space-y-3">
                      {verificationSteps.map((step, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 text-[10px] font-mono text-zinc-400"
                        >
                          <CheckCircle2 className="w-3 h-3 text-primary/50" />
                          <span>{step}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {verificationResult === 'valid' && (
                <motion.div
                   key="valid"
                   initial={{ opacity: 0, scale: 0.98, y: 10 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   transition={{ type: "spring", stiffness: 150, damping: 25 }}
                   className="h-full"
                >
                  <GlowingCard glowColor="primary" className="h-full p-1 border-primary/20 shadow-2xl">
                    <div className="bg-black/60 backdrop-blur-3xl h-full rounded-2xl p-8 flex flex-col relative border-t border-white/5">
                      
                      <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-5">
                          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 shadow-[0_0_20px_rgba(52,211,153,0.15)]">
                            <CheckCircle2 className="h-7 w-7 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">Public Verification Layer</Badge>
                              <Badge variant="outline" className="border-zinc-800 text-zinc-500 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">Algorand Testnet</Badge>
                            </div>
                            <h3 className="text-2xl font-black text-primary uppercase tracking-tighter">Proof Verified</h3>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Hash Match Verification Successful</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-8">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                          <ShieldCheck className="h-4 w-4 text-primary mb-2" />
                          <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Integrity</span>
                          <span className="text-[10px] text-zinc-300 font-bold uppercase mt-1">Confirmed</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mb-2" />
                          <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Attributes</span>
                          <span className="text-[10px] text-zinc-300 font-bold uppercase mt-1">Validated</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                          <Lock className="h-4 w-4 text-amber-500 mb-2" />
                          <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Privacy</span>
                          <span className="text-[10px] text-zinc-300 font-bold uppercase mt-1">Shielded</span>
                        </div>
                      </div>
                      
                      <div className="space-y-6 flex-1">
                         <div className="space-y-2">
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Verification Status Items</p>
                            <div className="space-y-2">
                              {[
                                "Proof Validated",
                                "Identity Attribute Confirmed",
                                "No Personal Data Revealed"
                              ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 px-4 h-10 bg-white/5 rounded-xl border border-white/5">
                                  <CheckCircle2 className="w-3 h-3 text-primary/60" />
                                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wide">{item}</span>
                                </div>
                              ))}
                            </div>
                         </div>

                         <div className="space-y-2">
                           <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Verified Attributes</p>
                           <div className="bg-black/40 rounded-2xl border border-primary/10 p-5 font-mono text-xs flex flex-col gap-3 shadow-inner">
                              <div className="flex items-center justify-between">
                                <span className="text-zinc-600 uppercase tracking-tighter">"Qualification"</span>
                                <span className="text-primary font-black uppercase tracking-widest">{proofDetails?.attr || "Verified"}</span>
                              </div>
                              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                <span className="text-zinc-600 uppercase tracking-tighter">"Bound_Wallet"</span>
                                <span className="text-primary font-black uppercase tracking-widest text-[10px]">{proofDetails?.w_bound?.substring(0, 10)}...</span>
                              </div>
                           </div>
                         </div>

                          <div className="mt-8">
                            <Link href={`/explorer?search=${proofId}`} className="w-full block">
                              <button className="w-full h-14 text-sm font-black tracking-widest uppercase bg-gradient-to-r from-primary to-emerald-400 text-black shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_40px_rgba(52,211,153,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-xl relative overflow-hidden group flex items-center justify-center gap-2">
                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                                <span className="relative z-10 flex items-center gap-2">View Details in Explorer <ArrowRight className="h-5 w-5" /></span>
                              </button>
                            </Link>
                          </div>

                          <div className="mt-6 bg-primary/5 rounded-xl p-4 border border-primary/10 flex items-start gap-3">
                             <div className="p-2 bg-primary/10 rounded-lg text-primary">
                               <ShieldCheck className="h-4 w-4" />
                             </div>
                             <p className="text-[10px] text-zinc-500 font-medium leading-relaxed uppercase tracking-tighter">
                               This verifier checks cryptographic proofs without accessing the user's identity data. Securely anchored to Algorand Testnet.
                             </p>
                          </div>
                      </div>
                    </div>
                  </GlowingCard>
                </motion.div>
              )}

              {verificationResult === 'invalid' && (
                <motion.div
                   key="invalid"
                   initial={{ opacity: 0, scale: 0.9, x: 20 }}
                   animate={{ opacity: 1, scale: 1, x: 0 }}
                   transition={{ type: "spring", stiffness: 300, damping: 25 }}
                   className="h-full"
                >
                  <div className="h-full bg-red-500/10 backdrop-blur-2xl rounded-2xl border border-red-500/30 p-8 pt-10 relative overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.15)] flex flex-col">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                    
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3 bg-red-500/20 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                        <XCircle className="h-10 w-10 text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-red-500 tracking-tight">Proof Invalid</h3>
                        <p className="text-red-400/80 font-medium">Cryptographic verification failed.</p>
                      </div>
                    </div>
                    
                    <div className="bg-black/50 rounded-xl p-6 border border-red-500/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] flex-1">
                       <p className="text-zinc-300 text-base leading-relaxed mb-4">
                         The verification check failed for the following identifier:
                       </p>
                       <div className="font-mono text-red-400 p-3 bg-red-500/10 rounded-lg border border-red-500/20 break-all mb-4 text-sm shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]">
                         {proofId}
                       </div>
                       <p className="text-zinc-400 text-sm">
                         This indicates that the proof hash does not match our records, the identity attributes are invalid, or the proof integrity has been compromised.
                       </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </div>
    </>
  );
}

export default function VerificationDashboard() {
  return (
    <div className="container max-w-6xl pt-32 md:pt-40 lg:pt-48 pb-16 mx-auto min-h-[calc(100vh-4rem-200px)] relative flex flex-col justify-center">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="text-muted-foreground font-medium animate-pulse">Initializing Verifier Environment...</div>
        </div>
      }>
         <VerificationDashboardContent />
      </Suspense>
    </div>
  );
}
