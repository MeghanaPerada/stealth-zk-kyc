"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Lock, FileJson, CheckCircle2, ShieldCheck, ArrowRight, ScanLine } from "lucide-react";
import { GlowingCard } from "@/components/ui/glowing-card";

export function ZkVisualization() {
  const [step, setStep] = useState<0 | 1 | 2>(0); 
  // 0: Initial (Raw Data)
  // 1: Generating (Scanning/Hashing)
  // 2: Complete (Proof Generated)

  const handleGenerate = () => {
    setStep(1);
    setTimeout(() => setStep(2), 3000);
  }

  const handleReset = () => {
    setStep(0);
  }

  return (
    <section className="py-24 relative overflow-hidden text-left z-10 w-full">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 -z-10 pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] -translate-y-1/2 -z-10 pointer-events-none" />

      <div className="container px-4 mx-auto max-w-screen-xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 mb-6 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
             <ScanLine className="h-4 w-4" />
             <span className="text-sm font-semibold tracking-wide uppercase">Interactive Explainer</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">See Zero Knowledge in Action</h2>
          <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed">
            Experience how our protocol verifies your real-world identity attributes mathematically, isolating sensitive data entirely on your local device.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch relative z-10 w-full min-h-[450px]">
          
          {/* Step 1: User Data (Local) */}
          <GlowingCard glowColor={step === 0 ? "primary" : "none"} className="p-6 relative overflow-hidden flex flex-col h-full shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-black/40">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${step === 0 ? 'bg-primary/20 text-primary' : 'bg-white/10 text-zinc-400'}`}>
                  <FileJson className="w-6 h-6" />
                </div>
                <h3 className={`font-bold text-lg ${step === 0 ? 'text-zinc-100' : 'text-zinc-400'}`}>Local Device Data</h3>
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${step === 0 ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-500'}`}>Sensitive</span>
            </div>
            
            <div className="space-y-6 relative flex flex-col flex-1 mt-auto">
               <div className="bg-black/60 border border-white/5 rounded-xl p-5 font-mono text-sm relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] flex-1">
                  
                  {/* Overlay for hidden state */}
                  <AnimatePresence>
                    {step > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }} 
                        animate={{ opacity: 1, backdropFilter: "blur(8px)" }} 
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center rounded-xl border border-primary/20 backdrop-blur-md"
                      >
                         <Lock className="w-10 h-10 text-primary mb-3 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                         <span className="text-primary font-bold text-sm uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/30">Never Escapes Device</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="text-zinc-500 mb-4 pb-2 border-b border-white/10 break-all">// Raw identity payload</div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center"><span className="text-emerald-400 break-keep">"name":</span> <span className="text-zinc-300 font-medium break-all text-right ml-2 lg:ml-0">"Alice Doe"</span></div>
                    <div className="flex justify-between items-center"><span className="text-emerald-400 break-keep">"dob":</span> <span className="text-zinc-300 font-medium break-all text-right ml-2 lg:ml-0">"1995-08-24"</span></div>
                    <div className="flex justify-between items-center"><span className="text-emerald-400 break-keep">"country":</span> <span className="text-zinc-300 font-medium break-all text-right ml-2 lg:ml-0">"USA"</span></div>
                    <div className="flex justify-between items-center"><span className="text-emerald-400 break-keep">"ssn":</span> <span className="text-zinc-300 font-medium break-all text-right ml-2 lg:ml-0">"XXX-XX-8910"</span></div>
                  </div>
               </div>
               
               {step === 0 ? (
                 <Button onClick={handleGenerate} className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-bold tracking-wide shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_30px_rgba(52,211,153,0.5)] transition-all">
                    Generate ZK-Proof <ArrowRight className="ml-2 w-5 h-5" />
                 </Button>
               ) : (
                 <div className="h-12 flex items-center justify-center text-primary font-bold border border-primary/20 rounded-md bg-primary/5 uppercase tracking-widest text-sm shadow-[inset_0_0_15px_rgba(52,211,153,0.1)]">
                   Data Locked
                 </div>
               )}
            </div>
          </GlowingCard>

          {/* Step 2: The Prover Circuit */}
          <div className="flex flex-col relative py-0 h-full">
            <div className="hidden lg:block absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-primary/30 via-secondary/50 to-primary/30 -z-10 pointer-events-none" />
            <div className="block lg:hidden absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-primary/30 via-secondary/50 to-primary/30 -z-10 pointer-events-none" />

            <motion.div 
              animate={{ 
                scale: step === 1 ? 1.05 : 1,
                boxShadow: step === 1 ? "0 0 50px rgba(124,58,237,0.4)" : "0 0 15px rgba(0,0,0,0.5)",
                borderColor: step === 1 ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.1)"
              }}
              className="w-full h-full bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden transition-all duration-300 flex flex-col justify-center items-center"
            >
              {step === 1 && (
                 <motion.div 
                   className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent pointer-events-none"
                   animate={{ top: ['-100%', '200%'] }}
                   transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                 />
              )}
              
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-6 transition-colors duration-500 border border-t-white/10 ${step === 1 ? 'bg-secondary/20 text-secondary' : 'bg-white/5 text-zinc-500'}`}>
                 {step === 1 ? <ScanLine className="w-8 h-8 animate-pulse drop-shadow-[0_0_8px_rgba(124,58,237,0.8)]" /> : <ShieldCheck className="w-8 h-8 opacity-50" />}
              </div>
              <h3 className={`font-bold text-xl mb-4 ${step === 1 ? 'text-zinc-100' : 'text-zinc-400'}`}>ZK Circuit Evaluator</h3>
              
              <div className="space-y-3 text-sm font-mono text-left bg-black/60 p-4 rounded-xl border border-white/5 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)] w-full">
                 <div className="flex items-center justify-between">
                   <span className={step >= 1 ? "text-zinc-300" : "text-zinc-600"}>Age &ge; 18</span>
                   {step >= 1 && <motion.span initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}} className={step===2?"text-primary font-bold drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]":"text-amber-500 animate-pulse"}>{step===2?"TRUE":"Evaluating..."}</motion.span>}
                 </div>
                 <div className="flex items-center justify-between">
                   <span className={step >= 1 ? "text-zinc-300" : "text-zinc-600"}>Not Sanctioned</span>
                   {step >= 1 && <motion.span initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.5}} className={step===2?"text-primary font-bold drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]":"text-amber-500 animate-pulse"}>{step===2?"TRUE":"Evaluating..."}</motion.span>}
                 </div>
              </div>
            </motion.div>
          </div>

          {/* Step 3: Verified Output (Network Level) */}
          <GlowingCard glowColor={step === 2 ? "primary" : "none"} className={`p-6 flex flex-col h-full transition-all duration-700 bg-black/40 ${step === 2 ? 'shadow-[0_0_30px_rgba(52,211,153,0.2)]' : 'opacity-60 saturate-50'}`}>
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${step === 2 ? 'bg-primary/20 text-primary' : 'bg-white/10 text-zinc-500'}`}>
                     <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className={`font-bold text-lg ${step === 2 ? 'text-zinc-100' : 'text-zinc-500'}`}>Verifier Node</h3>
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${step === 2 ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-500'}`}>Public</span>
             </div>
            
            <div className="space-y-6 flex flex-col flex-1 mt-auto">
               <div className={`bg-black/60 border ${step === 2 ? 'border-primary/40 shadow-[inset_0_0_30px_rgba(52,211,153,0.15)]' : 'border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]'} rounded-xl p-5 flex flex-col items-center justify-center text-center flex-1 transition-all duration-500 relative overflow-hidden`}>
                  
                  {step === 2 && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px] pointer-events-none" />
                  )}

                  <AnimatePresence mode="wait">
                    {step === 2 ? (
                      <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }} className="space-y-4 w-full relative z-10">
                         <div className="w-16 h-16 rounded-full bg-primary/20 text-primary mx-auto flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(52,211,153,0.4)] border border-primary/30">
                            <ShieldCheck className="w-8 h-8 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                         </div>
                         <h4 className="font-bold text-xl text-primary drop-shadow-md">Proof Validated</h4>
                         
                         <div className="bg-black/80 rounded-lg p-3 border border-primary/20 flex flex-col items-start text-left w-full space-y-2 mt-4 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
                             <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Generated SNARK</div>
                             <div className="font-mono text-xs text-primary/80 break-all leading-relaxed">
                                prf_0x8f72c9a9b1c3d4e5f6a<br/>7b8c9d0e1f2a3b4c5d6e7f8a...
                             </div>
                         </div>
                      </motion.div>
                    ) : (
                      <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-zinc-600 space-y-4">
                         <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/10">
                           <Lock className="w-8 h-8 opacity-30" />
                         </div>
                         <p className="text-sm font-medium tracking-wide uppercase px-4">Awaiting Cryptographic Proof</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
               
               <div className="h-12 flex flex-col justify-end">
                 {step === 2 && (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                     <Button onClick={handleReset} variant="outline" className="w-full h-12 border-primary/30 bg-primary/5 hover:bg-primary/20 text-primary font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                        Reset Demo
                     </Button>
                   </motion.div>
                 )}
               </div>
            </div>
          </GlowingCard>
        </div>
      </div>
    </section>
  );
}
