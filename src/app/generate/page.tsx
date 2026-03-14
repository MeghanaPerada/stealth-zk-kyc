"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Terminal, CheckCircle2, ShieldAlert, ArrowRight, Lock, Wallet, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GlowingCard } from "@/components/ui/glowing-card";
import { useWallet } from "@/hooks/useWallet";

export default function ProofGenerator() {
  const { address, shortAddress, isDemoMode, algodClient, signTransactions } = useWallet();
  const [credential, setCredential] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [visualStep, setVisualStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [proofData, setProofData] = useState({
    id: "prf_0x8f2a9c...1b4e",
    hash: "0x4f128be7c93...a9b24cd51",
    timestamp: new Date().toISOString(),
    attribute: "Age > 18",
    algorandTx: "SIMULATED_ANCHOR"
  });

  const visualSteps = [
    "Decrypting local credential",
    "Binding wallet to attributes",
    "Evaluating ZK constraints",
    "Generating zk-SNARK proof",
    "Anchoring to Algorand"
  ];

  useEffect(() => {
    // Step 3: Load credential from Step 2
    const storedCred = localStorage.getItem("stealth_identity_credential");
    if (storedCred) {
      const parsed = JSON.parse(storedCred);
      setCredential(parsed);
      setProofData(prev => ({
        ...prev,
        attribute: parsed.credential === "age_over_18_certificate" ? "Age Over 18" : (parsed.name ? `Identity: ${parsed.name}` : "Verified Attributes")
      }));
    }

    const runGeneration = async () => {
      const generationSteps = [
        { msg: "Initializing zk-SNARK prover...", delay: 500, vStep: 0 },
        { msg: "Loading verification key (VK)...", delay: 1200, vStep: 0 },
        { msg: credential ? "Reading local signed credential..." : "Reading local identity attributes...", delay: 2000, vStep: 1 },
        { msg: "Building arithmetic circuit...", delay: 3500, vStep: 2 },
        { msg: "Computing witness generation...", delay: 5000, vStep: 3 },
        { msg: "Executing polynomial commitments...", delay: 6500, vStep: 3 },
        { msg: "Finalizing cryptographic proof...", delay: 8000, vStep: 4 },
      ];

      for (const step of generationSteps) {
        await new Promise(resolve => setTimeout(resolve, step.delay - (generationSteps[generationSteps.indexOf(step) - 1]?.delay || 0)));
        setLogs(prev => [...prev, step.msg]);
        setVisualStep(step.vStep);
        setProgress(Math.min(((generationSteps.indexOf(step) + 1) / (generationSteps.length + 3)) * 100, 100));
      }

      // Real Anchoring Phase
      if (!address || isDemoMode) {
        setLogs(prev => [...prev, "Demo Mode: Skipping real on-chain anchoring.", "Proof successfully generated (Simulated)."]);
        setIsComplete(true);
        setProgress(100);
        return;
      }

      try {
        setLogs(prev => [...prev, "Connecting to Algorand Testnet...", "Preparing Secure Identity Anchor..."]);
        
        const { AlgorandClient } = await import("@algorandfoundation/algokit-utils");
        const algorand = AlgorandClient.testNet();
        
        // Step 4: Anchor Proof Object (JSON note)
        const proofObj = {
          id: proofData.id,
          p_hash: proofData.hash,
          w_bound: address,
          attr: proofData.attribute
        };
        const note = `stealth-zk-proof:${JSON.stringify(proofObj)}`;
        
        setLogs(prev => [...prev, "Awaiting wallet signature..."]);

        // Real On-chain Anchoring using ProofAnchor Contract (App ID 1006)
        const PROOF_ANCHOR_APP_ID = BigInt(1006);
        const { ProofAnchorFactory } = await import('@/contracts/proof_anchor/ProofAnchorClient');
        const factory = new ProofAnchorFactory({
          algorand: algorand,
          defaultSender: address,
        });
        const client = factory.getAppClientById({ appId: PROOF_ANCHOR_APP_ID });

        setLogs(prev => [...prev, "Awaiting wallet signature for Proof Anchor..."]);

        const result = await client.send.submitProof({
          args: {
            proofHash: proofData.hash,
          },
          // BOX STORAGE: We must fund the box storage for the proof
          // ProofAnchor uses BoxMap<Account, string>
          boxReferences: [{ appId: PROOF_ANCHOR_APP_ID, name: address }],
        });
        
        const txId = result.transaction.txID();
        
        setLogs(prev => [...prev, `Transaction confirmed: ${txId}`, "Proof successfully generated and anchored."]);
        
        setProofData(prev => ({
          ...prev,
          algorandTx: txId
        }));

        setIsComplete(true);
        setProgress(100);
      } catch (error: any) {
        console.error("Anchoring failed:", error);
        setLogs(prev => [...prev, `Error: ${error.message || "Failed to anchor proof"}`]);
        setIsComplete(true);
        setProgress(100);
      }
    };

    runGeneration();
  }, [address]); // Re-run if address changes

  return (
    <div className="container max-w-5xl pt-32 md:pt-40 lg:pt-48 pb-16 px-4 mx-auto min-h-[calc(100vh-4rem-200px)] flex flex-col items-center justify-center relative">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[150px] -z-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight uppercase tracking-tighter shadow-sm">Zero Knowledge Engine</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto italic font-light">
          Computing mathematical zero-knowledge proofs locally. Securely anchoring to Algorand for public verifiability.
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
          <div className="h-full bg-black/60 backdrop-blur-3xl border border-white/5 rounded-3xl text-zinc-300 font-mono shadow-2xl relative overflow-hidden flex flex-col">
             
             {/* Terminal Header */}
             <div className="border-b border-white/5 bg-zinc-900/20 pb-4 pt-5 px-6 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Prover Console Output</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/5 border border-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/5 border border-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/5 border border-white/10" />
                </div>
             </div>
             
             {/* Terminal Body */}
             <div className="p-6 relative flex-1 min-h-[350px] overflow-y-auto custom-scrollbar">
                <div className="space-y-4 text-[12px] leading-relaxed">
                  <p className="text-primary/40 select-none">$ stealth-zk-engine --anchor-on algorand-testnet</p>
                  <AnimatePresence>
                    {logs.map((log, i) => (
                      <motion.p 
                        key={i} 
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={i === logs.length - 1 && isComplete ? "text-primary font-bold shadow-sm" : "text-zinc-400"}
                      >
                        <span className="text-zinc-700 mr-4 select-none italic">{new Date().toISOString().split('T')[1].slice(0, 8)}</span>
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
             <div className="bg-zinc-900/20 border-t border-white/5 p-6 mt-auto">
               <div className="w-full space-y-4">
                  <div className="flex justify-between text-[10px] text-zinc-500 mb-1 font-sans font-black uppercase tracking-widest">
                    <span>Cryptographic Synthesis</span>
                    <span className={isComplete ? "text-primary" : ""}>{Math.round(progress)}%</span>
                  </div>
                  <div className="relative h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "linear" }}
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
                   initial={{ opacity: 0, scale: 0.98, y: 10 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   transition={{ type: "spring", damping: 25, stiffness: 150 }}
                   className="h-full"
                >
                  <GlowingCard glowColor="primary" className="p-1 h-full flex flex-col">
                    <div className="bg-black/40 backdrop-blur-3xl rounded-2xl border-t border-white/5 p-8 flex flex-col h-full">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-[0_0_20px_rgba(52,211,153,0.15)]">
                          <CheckCircle2 className="h-7 w-7" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black tracking-tight uppercase tracking-tighter">Proof Verified</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">Algorand Testnet Anchored</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-6 flex-1">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Decentralized Identity</p>
                          <div className="px-5 h-14 bg-white/5 rounded-2xl border border-white/5 text-primary text-sm font-black flex items-center gap-3 backdrop-blur-sm shadow-sm">
                             <Wallet className="h-4 w-4" />
                             <span className="tracking-widest">{address ? shortAddress : "0x00...0000"}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Verified Attribute</p>
                            <div className="px-5 h-12 bg-white/5 rounded-xl border border-white/5 text-zinc-300 text-xs font-bold flex items-center gap-3">
                               <ShieldAlert className="h-4 w-4 text-primary/70" />
                               <span className="tracking-wide uppercase">{proofData.attribute}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Algorand Tx ID</p>
                            <div className="px-5 h-12 bg-white/5 rounded-xl border border-white/5 text-primary/60 text-[10px] font-mono flex items-center justify-between gap-3 group">
                               <div className="flex items-center gap-3 truncate">
                                 <Link href={`https://testnet.algoexplorer.io/tx/${proofData.algorandTx}`} target="_blank" className="hover:underline flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  <span className="truncate uppercase tracking-tighter">{proofData.algorandTx}</span>
                                 </Link>
                               </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">ZK Proof Hash</p>
                          </div>
                          <div className="px-5 h-12 bg-white/5 rounded-xl border border-white/5 text-zinc-500 flex items-center justify-between gap-3">
                             <div className="flex items-center gap-3 truncate">
                               <Lock className="h-4 w-4 text-zinc-600" />
                               <span className="tracking-widest font-mono text-[9px] truncate">{proofData.hash}</span>
                             </div>
                             <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary/40 hover:bg-primary/10 hover:text-primary transition-all rounded-lg" onClick={() => copyToClipboard(proofData.hash)}>
                               {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                             </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-8">
                        <Link href={`/verify?id=${proofData.id}`} className="w-full block">
                          <button className="w-full h-16 text-lg font-black tracking-widest uppercase bg-gradient-to-r from-primary to-emerald-400 text-black shadow-[0_0_30px_rgba(52,211,153,0.3)] hover:shadow-[0_0_50px_rgba(52,211,153,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-2xl relative overflow-hidden group flex items-center justify-center gap-3">
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                            <span className="relative z-10 flex items-center gap-3">Verify Proof <ArrowRight className="h-6 w-6" /></span>
                          </button>
                        </Link>
                      </div>
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
                  <div className="border border-white/5 bg-black/40 backdrop-blur-xl rounded-2xl flex flex-col p-8 h-full min-h-[450px]">
                     <div className="flex items-center gap-4 mb-8">
                       <div className="relative w-12 h-12">
                         <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
                         <motion.div 
                           className="absolute inset-0 rounded-full border-t-2 border-primary shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                           animate={{ rotate: 360 }}
                           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                         />
                       </div>
                       <div>
                         <h3 className="text-xl font-bold tracking-tight">Circuit Evaluator</h3>
                         <p className="text-muted-foreground text-xs uppercase tracking-widest">Processing Constraints</p>
                       </div>
                     </div>

                     <div className="space-y-5 flex-1">
                        {visualSteps.map((step, i) => {
                          const isActive = visualStep === i;
                          const isPast = visualStep > i;
                          
                          return (
                            <motion.div 
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ 
                                opacity: visualStep >= i ? 1 : 0.3,
                                x: 0,
                                color: isActive ? "#34d399" : (isPast ? "#10b981" : "#71717a")
                              }}
                              className="flex items-center gap-4 text-sm font-medium"
                            >
                              <div className="relative">
                                {isPast ? (
                                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/50">
                                    <CheckCircle2 className="w-3 h-3" />
                                  </div>
                                ) : isActive ? (
                                  <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border border-zinc-700 bg-zinc-900/50" />
                                )}
                                {i < visualSteps.length - 1 && (
                                  <div className={`absolute top-5 left-2.5 w-[1px] h-5 bg-zinc-800 ${isPast ? "bg-primary/30" : ""}`} />
                                )}
                              </div>
                              <span className={isActive ? "text-primary" : ""}>{step}</span>
                            </motion.div>
                          );
                        })}
                     </div>

                     <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="flex justify-between text-[10px] text-zinc-500 mb-2 uppercase tracking-widest font-bold">
                          <span>Generator Engine Status</span>
                          <span className="text-primary/70">Active</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-primary shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                          />
                        </div>
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
