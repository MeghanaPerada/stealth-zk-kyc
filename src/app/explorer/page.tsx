"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Layers, Clock, ShieldCheck, Cpu, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlowingCard } from "@/components/ui/glowing-card";

export default function Explorer() {
  const [blocks, setBlocks] = useState([
    {
      number: 1420984,
      proofId: "prf_0x7b2a9u...4e2d",
      timestamp: new Date(Date.now() - 30000).toISOString(),
      status: "Valid",
      verifier: "0x89A2...2D4B"
    },
    {
      number: 1420983,
      proofId: "prf_0x2c4e1f...9b5a",
      timestamp: new Date(Date.now() - 150000).toISOString(),
      status: "Valid",
      verifier: "0x3F2B...E91C"
    },
    {
      number: 1420982,
      proofId: "prf_0x9d3b5a...7c1f",
      timestamp: new Date(Date.now() - 420000).toISOString(),
      status: "Valid",
      verifier: "0x5E8A...1B2D"
    }
  ]);

  const [copied, setCopied] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } }
  };

  return (
    <div className="container max-w-5xl py-16 px-4 mx-auto min-h-[calc(100vh-4rem-200px)] relative">
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[150px] -z-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
      >
        <div>
           <h1 className="text-4xl md:text-5xl font-black mb-4 flex items-center gap-4 tracking-tight">
             <div className="p-3 bg-primary/20 rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.3)]">
               <Layers className="h-8 w-8 text-primary" />
             </div> 
             Network Explorer
           </h1>
           <p className="text-muted-foreground text-lg max-w-xl">
             Live feed of cryptographic ZK Proofs mathematically verified by network nodes.
           </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
             <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">Total Verified</p>
             <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-primary drop-shadow-sm">14,209</p>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
             <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">Avg Block Time</p>
             <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-secondary drop-shadow-sm">0.42s</p>
          </div>
        </div>
      </motion.div>

      <div className="relative">
        <div className="absolute left-6 md:left-[3.25rem] top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-transparent rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)] z-0" />

        <motion.div 
          className="space-y-10 pl-16 md:pl-28"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {blocks.map((block, index) => (
            <motion.div key={block.number} variants={itemVariants} className="relative">
              {/* Connector Node */}
              <div className="absolute -left-16 md:-left-28 top-6 w-14 border-t-2 border-dashed border-primary/50 z-0" />
              <div className="absolute -left-16 md:-left-28 top-4 flex justify-center items-center h-4 w-4 bg-background z-10 rounded-full border-4 border-primary shadow-[0_0_15px_rgba(52,211,153,0.8)] ml-[0.35rem] md:ml-[3.1rem]" />

              <GlowingCard glowColor="primary" className="p-1">
                <div className="bg-background/80 backdrop-blur-xl rounded-lg p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-primary/5 to-transparent pointer-events-none" />
                  
                  {/* Block Title/Icon */}
                  <div className="flex items-center gap-5 lg:w-1/4">
                    <div className="h-14 w-14 rounded-2xl bg-black/60 flex items-center justify-center border border-white/10 shrink-0 text-primary shadow-[inset_0_0_15px_rgba(52,211,153,0.1)]">
                      <Cpu className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Block</p>
                      <p className="font-mono font-bold text-xl text-zinc-200">#{block.number}</p>
                    </div>
                  </div>

                  {/* Details Data */}
                  <div className="flex flex-col sm:flex-row gap-6 lg:w-2/4 bg-black/40 p-4 rounded-xl border border-white/5 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
                    <div className="space-y-3 flex-1">
                      <div className="flex justify-between items-center sm:block">
                         <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Proof Identifier</p>
                         <div className="flex items-center gap-2">
                            <span className="font-mono text-sm bg-primary/10 px-2.5 py-1 rounded text-primary border border-primary/20">
                              {block.proofId}
                            </span>
                            <Button variant="ghost" size="sm" className="h-6 px-2 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors" onClick={() => copyToClipboard(block.proofId, block.number.toString())}>
                               {copied === block.number.toString() ? <span className="text-[10px] font-bold text-primary">Copied!</span> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                         </div>
                      </div>
                      <div className="flex justify-between items-center sm:block">
                         <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Verified Node</p>
                         <span className="font-mono text-sm text-zinc-400">
                           {block.verifier}
                         </span>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-3 sm:border-l border-white/10 sm:pl-6 pl-0 border-t sm:border-t-0 pt-4 sm:pt-0 shrink-0">
                       <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold px-3 py-1 uppercase tracking-widest shadow-[0_0_10px_rgba(52,211,153,0.2)]">
                         <ShieldCheck className="w-4 h-4 mr-1.5" /> {block.status}
                       </Badge>
                       <p className="text-xs font-semibold text-zinc-400 flex items-center">
                         <Clock className="w-3.5 h-3.5 mr-1.5 opacity-70" /> {isMounted ? new Date(block.timestamp).toLocaleTimeString() : "--:--:--"}
                       </p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="lg:w-1/4 flex justify-end">
                     <Link href={`/verify?id=${block.proofId}`} className="w-full sm:w-auto">
                       <Button variant="outline" className="w-full border-primary/30 bg-primary/5 hover:bg-primary text-primary hover:text-primary-foreground font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(52,211,153,0.1)] hover:shadow-[0_0_30px_rgba(52,211,153,0.4)]">
                         Inspect Proof <ArrowDown className="ml-2 h-4 w-4 -rotate-90" />
                       </Button>
                     </Link>
                  </div>
                </div>
              </GlowingCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-16 flex justify-center pl-16 md:pl-28 relative z-10"
      >
        <Button variant="outline" className="border-white/10 bg-black/40 backdrop-blur-xl w-full max-w-sm h-14 text-base font-bold tracking-widest uppercase hover:bg-white/5 hover:text-white transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <ArrowDown className="mr-2 h-5 w-5 animate-bounce" /> Load Older Blocks
        </Button>
      </motion.div>

    </div>
  );
}
