"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShieldAlert, XCircle, Search, Clock, FileJson, ShieldCheck, Lock } from "lucide-react";
import { GlowingCard } from "@/components/ui/glowing-card";

function VerificationDashboardContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";
  
  const [proofId, setProofId] = useState(initialId);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<null | 'valid' | 'invalid'>(null);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofId) return;
    
    setIsVerifying(true);
    setVerificationResult(null);

    // Simulate blockchain/contract verification delay
    setTimeout(() => {
      if (proofId.startsWith("prf_")) {
        setVerificationResult('valid');
      } else {
        setVerificationResult('invalid');
      }
      setIsVerifying(false);
    }, 2000);
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
        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Verification Dashboard</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Verify cryptographic zero-knowledge proofs instantly without exposing underlying user data.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 pl-4 pr-4">
        {/* Verification Input Side */}
        <motion.div
           initial={{ opacity: 0, x: -30 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.5 }}
        >
          <GlowingCard glowColor="primary" className="h-full p-1 border-white/10">
            <div className="bg-background/80 backdrop-blur-2xl rounded-lg h-full p-8 md:p-10 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-primary/20 rounded-2xl text-primary shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                  <Search className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Verify Proof</h2>
                  <p className="text-muted-foreground text-sm">Query network for ZK proof validity</p>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-6 flex-1 flex flex-col">
                <div className="space-y-3 group">
                  <Label htmlFor="proofId" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
                    Proof Identifier (hash)
                  </Label>
                  <div className="relative">
                     <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                     <Input
                       id="proofId"
                       placeholder="e.g. prf_0x..."
                       value={proofId}
                       onChange={(e) => setProofId(e.target.value)}
                       className="bg-black/40 font-mono text-base border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 h-14 backdrop-blur-md transition-all placeholder:text-zinc-600 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]"
                       required
                     />
                  </div>
                </div>
                
                <div className="mt-auto pt-8">
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-bold tracking-wide bg-primary hover:bg-primary/90 text-black shadow-[0_0_30px_rgba(52,211,153,0.3)] hover:shadow-[0_0_50px_rgba(52,211,153,0.5)] transition-all relative overflow-hidden group"
                    disabled={isVerifying || !proofId}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
                    
                    {isVerifying ? (
                       <span className="flex items-center">
                         <span className="w-5 h-5 rounded-full border-2 border-white/80 border-t-transparent animate-spin mr-3"></span>
                         Validating Constraints...
                       </span>
                    ) : (
                      <span className="flex items-center">
                        <ShieldCheck className="w-5 h-5 mr-2" /> Verify Cryptography
                      </span>
                    )}
                  </Button>
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
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-full"
                 >
                   <div className="h-full border border-white/5 border-dashed bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center p-8">
                      <div className="text-center space-y-5 max-w-sm">
                         <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
                           <ShieldAlert className="w-10 h-10 text-zinc-500 opacity-80" />
                         </div>
                         <h3 className="text-xl font-medium text-zinc-300">Awaiting Verification</h3>
                         <p className="text-zinc-500 text-sm">Enter a proof identifier on the left to cryptographically verify user attributes against the smart contract constraints.</p>
                      </div>
                   </div>
                 </motion.div>
              )}

              {isVerifying && (
                <motion.div
                   key="verifying"
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 1.05 }}
                   className="h-full"
                >
                  <div className="h-full border border-primary/20 bg-primary/5 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center p-10 relative overflow-hidden">
                    {/* Scanning line effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent h-[500px]"
                      animate={{ top: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    
                    <div className="relative w-24 h-24 mb-8">
                      <motion.div 
                        className="absolute inset-0 rounded-xl border-2 border-primary/30 shadow-[0_0_20px_rgba(52,211,153,0.4)]"
                        animate={{ rotate: [0, 90, 180, 270, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <motion.div 
                        className="absolute inset-2 rounded-full border-2 border-dashed border-primary/50 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-white/80" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-primary/80 to-primary drop-shadow-sm">Executing Verifier Circuit</h3>
                    <div className="space-y-2 text-center w-full">
                      <p className="text-muted-foreground text-sm font-mono bg-black/40 py-2 px-4 rounded-md border border-white/5 mx-auto max-w-[90%] truncate">Checking pairing equations...</p>
                      <p className="text-zinc-600 text-xs font-mono">e(A,B) == e(α,β) * e(C,δ)</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {verificationResult === 'valid' && (
                <motion.div
                   key="valid"
                   initial={{ opacity: 0, scale: 0.9, x: 20 }}
                   animate={{ opacity: 1, scale: 1, x: 0 }}
                   transition={{ type: "spring", stiffness: 200, damping: 20 }}
                   className="h-full"
                >
                  <GlowingCard glowColor="primary" className="h-full p-0 overflow-hidden border-primary/30">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
                    <div className="bg-primary/5 backdrop-blur-2xl h-full p-8 flex flex-col pt-10 relative">
                      
                      {/* Success background effect */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10" />

                      <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/20 rounded-full shadow-[0_0_30px_rgba(52,211,153,0.5)]">
                            <CheckCircle2 className="h-10 w-10 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-3xl font-bold text-primary tracking-tight">Proof Valid</h3>
                            <p className="text-zinc-400 font-medium">Mathematical criteria met.</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 uppercase tracking-widest text-xs py-1 px-3 shadow-[0_0_10px_rgba(52,211,153,0.2)]">ZK-SNARK</Badge>
                      </div>
                      
                      <div className="space-y-8 flex-1">
                         <div className="grid grid-cols-2 gap-6 p-5 bg-black/40 rounded-xl border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                            <div className="space-y-1.5">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Verification Status</p>
                              <p className="text-base font-bold flex items-center text-primary"><ShieldCheck className="w-5 h-5 mr-2"/> Cryptographically Sound</p>
                            </div>
                            <div className="space-y-1.5">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Network Timestamp</p>
                              <p className="text-base font-medium flex items-center text-zinc-300"><Clock className="w-5 h-5 mr-2 text-zinc-400"/> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                            </div>
                         </div>

                         <div className="space-y-3">
                           <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold ml-1">Verified Private Data Attributes</p>
                           <div className="bg-gradient-to-br from-black/60 to-black/80 rounded-xl border border-primary/20 p-5 font-mono text-sm text-zinc-300 flex items-start gap-4 shadow-[inset_0_0_30px_rgba(52,211,153,0.05)] relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                             <FileJson className="w-5 h-5 mt-0.5 text-primary shrink-0 opacity-80" />
                             <div className="space-y-2 leading-relaxed">
                                <div><span className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]">"Age"</span> <span className="text-zinc-500 mx-2">&gt;=</span> <span className="text-amber-400 font-bold">18</span></div>
                                <div><span className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]">"Country_Risk"</span> <span className="text-zinc-500 mx-2">==</span> <span className="text-amber-400 font-bold">"LOW"</span></div>
                                <div className="text-xs text-zinc-500 pt-2 mt-2 border-t border-white/10">Zero Knowledge: Original values remain hidden.</div>
                             </div>
                           </div>
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
                         The pairing equation check failed. The provided proof identifier:
                       </p>
                       <div className="font-mono text-red-400 p-3 bg-red-500/10 rounded-lg border border-red-500/20 break-all mb-4 text-sm shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]">
                         {proofId}
                       </div>
                       <p className="text-zinc-400 text-sm">
                         This indicates that the proof does not mathematically map to a valid set of attributes, the public inputs are incorrect, or the proof signature has been tampered with.
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
    <div className="container max-w-6xl py-16 mx-auto min-h-[calc(100vh-4rem-200px)] relative flex flex-col justify-center">
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
