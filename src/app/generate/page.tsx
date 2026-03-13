"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Terminal, CheckCircle2, ShieldAlert, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GlowingCard } from "@/components/ui/glowing-card";

export default function ProofGenerator() {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [copied, setCopied] = useState(false);

  const proofData = {
    id: "prf_0x8f2a9c...1b4e",
    hash: "0x4f128be7c93...a9b24cd51",
    timestamp: new Date().toISOString(),
    attribute: "Age > 18"
  };

  useEffect(() => {
    const generationSteps = [
      { msg: "Initializing zk-SNARK prover...", delay: 500 },
      { msg: "Loading verification key (VK)...", delay: 1200 },
      { msg: "Reading local identity attributes...", delay: 2000 },
      { msg: "Building arithmetic circuit...", delay: 3500 },
      { msg: "Computing witness generation...", delay: 5000 },
      { msg: "Executing polynomial commitments...", delay: 6500 },
      { msg: "Finalizing cryptographic proof...", delay: 8000 },
      { msg: "Proof successfully generated.", delay: 9000 }
    ];

    let timeouts: NodeJS.Timeout[] = [];

    generationSteps.forEach((step, index) => {
      const timeout = setTimeout(() => {
        setLogs((prev) => [...prev, step.msg]);
        const currentProgress = Math.min(((index + 1) / generationSteps.length) * 100, 100);
        setProgress(currentProgress);

        if (index === generationSteps.length - 1) {
          setIsComplete(true);
        }
      }, step.delay);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach((t) => clearTimeout(t));
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(proofData.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container max-w-5xl py-16 px-4 mx-auto min-h-[calc(100vh-4rem-200px)] flex flex-col items-center justify-center relative">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[150px] -z-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Zero Knowledge Prover</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Computing mathematical zero-knowledge proof locally on your device engine.
        </p>
      </motion.div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Terminal / Progress side */}
        <motion.div 
           initial={{ opacity: 0, x: -30 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.6 }}
           className="lg:col-span-3 h-full"
        >
          <div className="h-full bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl text-zinc-300 font-mono shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col">
             
             {/* Terminal Header */}
             <div className="border-b border-white/10 bg-zinc-900/50 pb-3 pt-4 px-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Terminal className="h-4 w-4" />
                  <span>Compiler Output</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                </div>
             </div>
             
             {/* Terminal Body */}
             <div className="p-5 relative flex-1 min-h-[350px] overflow-y-auto">
                <div className="space-y-3 text-sm">
                  <p className="text-zinc-500 select-none">$ algo-prover generate proof --local</p>
                  <AnimatePresence>
                    {logs.map((log, i) => (
                      <motion.p 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={i === logs.length - 1 && isComplete ? "text-primary font-bold drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "text-zinc-300"}
                      >
                        <span className="text-zinc-600 mr-3 select-none">[{new Date().toISOString().split('T')[1].slice(0, 8)}]</span>
                        {log}
                      </motion.p>
                    ))}
                  </AnimatePresence>
                  {!isComplete && (
                    <motion.p 
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                      className="text-primary w-2 h-4 bg-primary inline-block ml-1 align-middle"
                    />
                  )}
                </div>
             </div>
             
             {/* Progress Footer */}
             <div className="bg-zinc-900/50 border-t border-white/10 p-5 mt-auto">
               <div className="w-full space-y-3">
                  <div className="flex justify-between text-xs text-zinc-400 mb-1 font-sans font-medium uppercase tracking-wider">
                    <span>Synthesizing Proof</span>
                    <span className={isComplete ? "text-primary" : ""}>{Math.round(progress)}%</span>
                  </div>
                  <div className="relative h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "easeOut" }}
                    />
                    {/* Glowing head of progress bar */}
                    <motion.div 
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-[4px] opacity-50"
                      initial={{ left: 0 }}
                      animate={{ left: `${progress}%` }}
                      transition={{ ease: "easeOut" }}
                      style={{ translateX: "-50%" }}
                    />
                  </div>
               </div>
             </div>
          </div>
        </motion.div>

        {/* Output Card side */}
        <div className="lg:col-span-2 flex flex-col justify-center h-full">
            <AnimatePresence mode="wait">
              {isComplete ? (
                <motion.div
                   key="complete"
                   initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
                   animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                   transition={{ type: "spring", damping: 20, stiffness: 100 }}
                   className="h-full"
                >
                  <GlowingCard glowColor="primary" className="p-6 h-full flex flex-col pt-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-primary/20 rounded-2xl text-primary shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight">Proof Generated</h3>
                        <p className="text-muted-foreground text-sm">Valid mathematically without data disclosure.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6 flex-1">
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Verified Attribute</p>
                        <div className="px-4 py-3 bg-black/40 rounded-xl border border-white/10 text-foreground font-medium flex items-center gap-3 backdrop-blur-sm shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                           <ShieldAlert className="h-5 w-5 text-primary" />
                           <span className="tracking-wide">{proofData.attribute}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Proof Identifier</p>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-primary hover:bg-primary/20 hover:text-primary transition-colors" onClick={copyToClipboard}>
                            {copied ? <span className="text-xs font-medium">Copied!</span> : <><Copy className="h-3 w-3 mr-1.5" /> <span className="text-xs font-medium">Copy</span></>}
                          </Button>
                        </div>
                        <div className="px-4 py-3 bg-primary/5 text-primary rounded-xl border border-primary/20 font-mono text-sm break-all shadow-[inset_0_0_10px_rgba(52,211,153,0.1)]">
                           {proofData.id}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-border/50">
                      <Link href={`/verify?id=${proofData.id}`} className="w-full block">
                        <Button className="w-full h-14 text-lg font-bold tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_rgba(52,211,153,0.3)] hover:shadow-[0_0_50px_rgba(52,211,153,0.5)] transition-all">
                          Verify Proof <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </Link>
                    </div>
                  </GlowingCard>
                </motion.div>
              ) : (
                <motion.div
                   key="loading"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   className="h-full"
                >
                  <div className="border border-white/5 bg-black/20 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center p-8 h-full min-h-[400px]">
                     <div className="relative w-20 h-20 mb-8">
                       {/* Animated glowing rings */}
                       <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
                       <motion.div 
                         className="absolute inset-0 rounded-full border-t-2 border-l-2 border-primary shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                         animate={{ rotate: 360 }}
                         transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                       />
                       <motion.div 
                         className="absolute inset-2 rounded-full border-b-2 border-r-2 border-secondary shadow-[0_0_15px_rgba(124,58,237,0.5)]"
                         animate={{ rotate: -360 }}
                         transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                       />
                       <div className="absolute inset-0 flex items-center justify-center">
                         <Lock className="w-6 h-6 text-white/50" />
                       </div>
                     </div>
                     <p className="text-muted-foreground font-medium text-center text-lg max-w-[200px]">Awaiting cryptographic proof generation...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
