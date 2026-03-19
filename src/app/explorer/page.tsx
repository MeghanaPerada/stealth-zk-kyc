"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Copy, 
  Layers, 
  Clock, 
  ShieldCheck, 
  Cpu, 
  ArrowDown, 
  Search, 
  Filter, 
  X, 
  ExternalLink, 
  FileJson, 
  Info,
  CheckCircle2,
  Clock3
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlowingCard } from "@/components/ui/glowing-card";
import { Input } from "@/components/ui/input";

// Extended mock data for the explorer
const INITIAL_PROOFS = [
  {
    id: "prf_0x7b2a9u4e2d",
    wallet: "V4K5...7J2L",
    fullWallet: "V4K5M4P9X7H2L1B0N8J5V4K5M4P9X7H2L1B0N8J5",
    attribute: "Age ≥ 18",
    type: "Age",
    timestamp: new Date(Date.now() - 30000).toISOString(),
    status: "Verified",
    hash: "0x89A2E1C4D...2D4B7F9A",
    algorandTx: "TX_7D9F2E4A8B1C6D5E0F9G8H7I6J5K4L3M2N1O0P9Q"
  },
  {
    id: "prf_0x2c4e1f9b5a",
    wallet: "AB3D...9KLM",
    fullWallet: "AB3D5G7H9J2L4M6N8P0Q1R2S3T4U5V6W7X8Y9Z0",
    attribute: "KYC Verified",
    type: "KYC",
    timestamp: new Date(Date.now() - 150000).toISOString(),
    status: "Verified",
    hash: "0x3F2B6C8D...E91C4A5D",
    algorandTx: "TX_1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T"
  },
  {
    id: "prf_0x9d3b5a7c1f",
    wallet: "R7H2...0N8J",
    fullWallet: "R7H2L1B0N8J5V4K5M4P9X7H2L1B0N8J5V4K5M4P9",
    attribute: "Sanctions Clear",
    type: "Sanctions",
    timestamp: new Date(Date.now() - 420000).toISOString(),
    status: "Verified",
    hash: "0x5E8A9B1D...1B2D3F4G",
    algorandTx: "TX_9Z8Y7X6W5V4U3T2S1R0Q9P8O7N6M5L4K3J2I1H0G"
  },
  {
    id: "prf_0x4k8m2n6p9q",
    wallet: "G6H4...P0Q1",
    fullWallet: "G6H4P0Q1R2S3T4U5V6W7X8Y9Z0AB3D5G7H9J2L4M",
    attribute: "Age ≥ 18",
    type: "Age",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    status: "Verified",
    hash: "0x7J9L2M4N...5P6Q7R8S",
    algorandTx: "TX_0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T"
  },
  {
    id: "prf_0x1z5x9c4v8b",
    wallet: "Z0Y8...M6N8",
    fullWallet: "Z0Y8X7W6V5U4T3S2R1Q0P9O8N7M6L5K4J3I2H1G0",
    attribute: "KYC Verified",
    type: "KYC",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    status: "Verified",
    hash: "0x4A5D6F7G...8H9J0K1L",
    algorandTx: "TX_5K4J3I2H1G0F9E8D7C6B5A4Z3Y2X1W0V9U8T7S6R"
  }
];

function ExplorerContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  
  const [proofs, setProofs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [attributeFilter, setAttributeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedProof, setSelectedProof] = useState<any | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    fetchProofs();
  }, []);

  const fetchProofs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/kyc/proofs");
      const data = await response.json();
      
      const mappedProofs = data.map((p: any) => ({
        id: `prf_0x${p.proofHash.slice(0, 10)}`,
        wallet: `${p.walletAddress.slice(0, 4)}...${p.walletAddress.slice(-4)}`,
        fullWallet: p.walletAddress,
        attribute: p.sourceType === "DIGILOCKER" ? "KYC Verified" : "Age ≥ 18",
        type: p.sourceType === "DIGILOCKER" ? "KYC" : "Age",
        timestamp: p.createdAt,
        status: "Verified",
        hash: p.proofHash,
        algorandTx: p.txId || "PENDING_SYNC",
        fullProof: p.fullProof // Pass the real ZK artifacts to the UI
      }));

      setProofs(mappedProofs.length > 0 ? mappedProofs : INITIAL_PROOFS);
    } catch (err) {
      console.error("Failed to fetch proofs:", err);
      if (proofs.length === 0) setProofs(INITIAL_PROOFS);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProofs = useMemo(() => {
    return proofs.filter(proof => {
      const matchesSearch = 
        proof.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        proof.fullWallet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proof.algorandTx.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAttribute = attributeFilter === "All" || proof.type === attributeFilter;
      const matchesStatus = statusFilter === "All" || proof.status === statusFilter;
      
      return matchesSearch && matchesAttribute && matchesStatus;
    });
  }, [proofs, searchQuery, attributeFilter, statusFilter]);

  const loadMore = () => {
    fetchProofs();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isMounted) return null;

  return (
    <div className="container max-w-6xl pt-32 md:pt-40 lg:pt-48 pb-16 px-4 mx-auto min-h-screen relative">
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[150px] -z-10 pointer-events-none" />

      {/* Header & Privacy Disclaimer */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <h1 className="text-4xl md:text-6xl font-black mb-4 flex items-center gap-4 tracking-tighter uppercase">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-[0_0_20px_rgba(52,211,153,0.1)]">
                <Layers className="h-8 w-8 text-primary" />
              </div> 
              Network Registry
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl font-light italic">
              Public audit log of zero-knowledge validations and anchored evidence. Secured by Algorand Testnet.
            </p>
          </div>
          
          <div className="bg-white/5 border border-white/5 rounded-2xl px-6 py-4 backdrop-blur-3xl flex items-center gap-4 shadow-xl">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Info className="h-5 w-5" />
            </div>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest leading-tight">
              Privacy First Indexing <br/>
              <span className="text-primary/70">No identity data revealed</span>
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <GlowingCard glowColor="primary" className="p-1 shadow-2xl">
          <div className="bg-black/40 backdrop-blur-3xl rounded-2xl p-8 flex flex-col lg:flex-row gap-8 border-t border-white/5">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search Proof ID, Wallet or Tx Hash..." 
                className="pl-14 h-16 bg-white/5 border-white/5 text-lg rounded-2xl focus-visible:ring-primary/30 focus-visible:border-primary/30 transition-all font-mono"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-6">
              <div className="flex flex-col gap-2.5">
                <label className="text-[10px] uppercase tracking-widest font-black text-zinc-500 ml-1">Attribute Filter</label>
                <div className="flex gap-2">
                  {["All", "Age", "KYC", "Sanctions"].map(f => (
                    <Button 
                      key={f} 
                      variant={attributeFilter === f ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setAttributeFilter(f)}
                      className={`h-10 px-5 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${
                        attributeFilter === f ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(52,211,153,0.3)]" : "border-white/5 bg-white/5 text-zinc-500 hover:text-white"
                      }`}
                    >
                      {f}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-2.5">
                <label className="text-[10px] uppercase tracking-widest font-black text-zinc-500 ml-1">Verification Status</label>
                <div className="flex gap-2">
                  {["All", "Verified", "Pending"].map(f => (
                    <Button 
                      key={f} 
                      variant={statusFilter === f ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setStatusFilter(f)}
                      className={`h-10 px-5 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${
                        statusFilter === f ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(52,211,153,0.3)]" : "border-white/5 bg-white/5 text-zinc-500 hover:text-white"
                      }`}
                    >
                      {f}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </GlowingCard>
      </motion.div>

      {/* Proof Feed */}
      <div className="space-y-5">
        <AnimatePresence mode="popLayout">
          {filteredProofs.length > 0 ? (
            filteredProofs.map((proof, idx) => (
              <motion.div
                key={proof.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div 
                  onClick={() => setSelectedProof(proof)}
                  className="group bg-black/40 backdrop-blur-3xl border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 cursor-pointer hover:border-primary/20 hover:bg-primary/5 transition-all shadow-xl border-t border-t-white/10"
                >
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-primary/50 group-hover:text-primary transition-all">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest font-black text-zinc-600 mb-1">Proof Hash ID</p>
                      <p className="font-mono text-base font-black text-zinc-200 uppercase tracking-tighter">{proof.id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1 w-full md:w-auto border-x-0 md:border-x border-white/5 md:px-8">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest font-black text-zinc-600 mb-1">User Identity Anchor</p>
                      <p className="font-mono text-xs text-zinc-400 font-bold">{proof.wallet}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest font-black text-zinc-600 mb-1">Algorand Tx</p>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                        <p className="font-mono text-xs text-primary/70 font-black">{proof.algorandTx.slice(0, 8)}...{proof.algorandTx.slice(-4)}</p>
                      </div>
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-[9px] uppercase tracking-widest font-black text-zinc-600 mb-1">Audit Timestamp</p>
                      <p className="text-xs text-zinc-500 font-bold flex items-center gap-2 uppercase">
                        <Clock3 className="h-3.5 w-3.5 opacity-40" />
                        {new Date(proof.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex flex-col items-end">
                       <Badge className="bg-primary/10 text-primary border-primary/20 font-black px-4 py-1.5 rounded-full text-[9px] tracking-widest uppercase">
                         {proof.status}
                       </Badge>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-primary group-hover:text-black transition-all">
                      <ExternalLink className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-24 text-center bg-black/20 border-2 border-white/5 border-dashed rounded-3xl">
              <Search className="h-14 w-14 text-zinc-800 mx-auto mb-6" />
              <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">No matching registry records</p>
              <Button variant="link" onClick={() => {setSearchQuery(""); setAttributeFilter("All"); setStatusFilter("All");}} className="text-primary mt-4 uppercase tracking-widest font-black text-xs">Reset All Queries</Button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedProof && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProof(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 20 }}
              className="relative w-full max-w-2xl"
            >
              <GlowingCard glowColor="primary" className="p-1 shadow-3xl">
                <div className="bg-zinc-950 rounded-2xl p-8 md:p-12 relative overflow-hidden border-t border-white/5">
                  <button 
                    onClick={() => setSelectedProof(null)}
                    className="absolute top-8 right-8 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                  >
                    <X className="h-5 w-5 text-zinc-500" />
                  </button>

                  <div className="flex flex-col items-center text-center mb-12">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary mb-8 border border-primary/20 shadow-[0_0_40px_rgba(52,211,153,0.2)]">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight mb-3 uppercase tracking-tighter">Registry Audit Log</h2>
                    <div className="flex items-center gap-3 bg-white/5 px-5 py-2 rounded-2xl border border-white/5">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary/80">{selectedProof.id}</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2.5">
                        <p className="text-[10px] uppercase tracking-widest font-black text-zinc-600">User Identity Anchor</p>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 shadow-sm">
                          <p className="font-mono text-[10px] text-zinc-300 break-all leading-relaxed uppercase">{selectedProof.fullWallet}</p>
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        <p className="text-[10px] uppercase tracking-widest font-black text-zinc-600">Algorand Transaction</p>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 shadow-sm">
                          <p className="font-mono text-[10px] text-primary break-all leading-relaxed uppercase">{selectedProof.algorandTx}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/5">
                      <div className="space-y-2">
                        <p className="text-[9px] uppercase tracking-widest font-black text-zinc-600">Verification</p>
                        <p className="text-lg font-black text-emerald-400 uppercase tracking-tighter">{selectedProof.attribute}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] uppercase tracking-widest font-black text-zinc-600">Audit Date</p>
                        <p className="text-xs font-black text-zinc-300 uppercase leading-relaxed">
                          {new Date(selectedProof.timestamp).toLocaleDateString()}<br/>
                          {new Date(selectedProof.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] uppercase tracking-widest font-black text-zinc-600">Secure Protocol</p>
                        <Badge className="bg-primary/20 text-primary border-primary/20 font-black px-3 py-1 mt-1 text-[9px] tracking-widest uppercase">Stealth v1.0</Badge>
                      </div>
                    </div>

                      <div className="space-y-6 pt-8 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] uppercase tracking-widest font-black text-zinc-600">PLONK Cryptographic Artifacts</p>
                          <Badge variant="outline" className="text-[8px] border-primary/20 text-primary uppercase font-black px-2 py-0.5">zk-SNARK (PLONK)</Badge>
                        </div>
                        
                        <div className="bg-black/60 rounded-2xl border border-white/5 p-6 font-mono text-[10px] text-zinc-400 max-h-48 overflow-y-auto shadow-inner custom-scrollbar">
                           <pre className="whitespace-pre-wrap">
                             {JSON.stringify(selectedProof.fullProof || { 
                               message: "Proof payload anchored on-chain. Signature: " + selectedProof.hash.slice(0, 32) + "..." 
                             }, null, 2)}
                           </pre>
                        </div>
                      </div>

                      <div className="mt-12 p-8 bg-primary/5 rounded-[2rem] border border-primary/20 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                           <ShieldCheck className="h-24 w-24" />
                         </div>
                         <h4 className="text-primary font-black uppercase tracking-widest text-[10px] mb-4 flex items-center gap-3">
                           <CheckCircle2 className="h-4 w-4" /> Validated PLONK Integrity
                         </h4>
                         <p className="text-zinc-300 text-base font-bold leading-relaxed mb-6 uppercase tracking-tighter text-left">
                           This record was verified using a PLONK ZK-SNARK circuit. Mathematical confirmation of 18+ age status is anchored to Algorand Testnet.
                         </p>
                         <div className="flex flex-wrap gap-4">
                           <Button onClick={() => copyToClipboard(selectedProof.hash)} variant="outline" size="sm" className="bg-black/60 border-primary/20 hover:bg-primary hover:text-black transition-all gap-2 text-[10px] font-black uppercase tracking-widest h-11 px-6 rounded-xl">
                             <Copy className="h-4 w-4" /> Copy Proof Hash
                           </Button>
                           <Link href={`https://testnet.algoexplorer.io/tx/${selectedProof.algorandTx}`} target="_blank">
                             <Button variant="outline" size="sm" className="bg-black/60 border-white/10 hover:bg-white/10 transition-all gap-2 text-[10px] font-black uppercase tracking-widest h-11 px-6 rounded-xl">
                               <ExternalLink className="h-4 w-4" /> View On Algorand
                             </Button>
                           </Link>
                         </div>
                      </div>
                  </div>
                </div>
              </GlowingCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Load More */}
      <div className="mt-16 flex justify-center">
        <Button 
          variant="outline" 
          disabled={isLoading}
          onClick={loadMore}
          className="bg-black/40 backdrop-blur-3xl border-white/5 w-full max-w-md h-16 text-xs font-black tracking-widest uppercase hover:bg-white/5 hover:text-white transition-all shadow-2xl group disabled:opacity-50 rounded-2xl"
        >
          {isLoading ? (
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-3" />
          ) : (
            <ArrowDown className="mr-3 h-5 w-5 animate-bounce group-hover:text-primary transition-colors" />
          )}
          {isLoading ? "Querying Registry..." : "Retrieve Historical Records"}
        </Button>
      </div>

    </div>
  );
}

export default function Explorer() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div className="text-muted-foreground font-medium animate-pulse uppercase tracking-widest text-[10px]">Loading Network Registry...</div>
      </div>
    }>
      <ExplorerContent />
    </Suspense>
  );
}
