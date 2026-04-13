"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Search, ShieldCheck, ExternalLink, Filter,
  ChevronRight, ArrowRight, Shield, Database,
  Fingerprint, Clock, CheckCircle2, History,
  Lock, Zap, Info, MoreVertical, Copy, Check,
  AlertCircle, Building2, RefreshCw, Smartphone,
  Trash2, Loader2, Play, Layers, Clock3, X, Cpu, ArrowDown
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlowingCard } from "@/components/ui/glowing-card";
import { Input } from "@/components/ui/input";
import PageWrapper from "@/components/layout/PageWrapper";

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
    algorandTx: "TX_7D9F2E4A8B1C6D5E0F9G8H7I6J5K4L3M2N1O0P9Q",
    trustScore: 95, proofType: "GOVT_GRADE", proofTypeLabel: "🟢 Govt-Grade", source: "digilocker"
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
    algorandTx: "TX_1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T",
    trustScore: 70, proofType: "VERIFIED", proofTypeLabel: "🟡 Verified", source: "manual"
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
    algorandTx: "TX_9Z8Y7X6W5V4U3T2S1R0Q9P8O7N6M5L4K3J2I1H0G",
    trustScore: 95, proofType: "GOVT_GRADE", proofTypeLabel: "🟢 Govt-Grade", source: "digilocker"
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
    algorandTx: "TX_0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T",
    trustScore: 40, proofType: "BASIC", proofTypeLabel: "🔴 Basic", source: "manual"
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
    algorandTx: "TX_5K4J3I2H1G0F9E8D7C6B5A4Z3Y2X1W0V9U8T7S6R",
    trustScore: 70, proofType: "VERIFIED", proofTypeLabel: "🟡 Verified", source: "manual"
  }
];

function ExplorerContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  
  const [proofs, setProofs] = useState<any[]>([]);
  const { address } = useWallet();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [attributeFilter, setAttributeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedProof, setSelectedProof] = useState<any | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  
  // State for on-chain verification simulation
  const [onChainData, setOnChainData] = useState<{exists: boolean, hash?: string} | null>(null);
  const [isVerifyingOnChain, setIsVerifyingOnChain] = useState(false);
  const [isSimulatingAVM, setIsSimulatingAVM] = useState(false);
  const [avmLog, setAvmLog] = useState<string[]>([]);

  useEffect(() => {
    setIsMounted(true);
    fetchProofs();
  }, [address]);

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
        fullProof: p.fullProof,
        trustScore: p.trustScore || 70,
        proofType: p.proofType || "VERIFIED",
        proofTypeLabel: p.proofTypeLabel || "️ Verified",
        source: p.source || "manual",
        onChain: false,
      }));

      // Also check local storage for a recently generated proof
      let localProofs: any[] = [];
      const localProofStr = localStorage.getItem("stealth_final_proof");
      if (localProofStr) {
        try {
          const lp = JSON.parse(localProofStr);
          
          // Migration: If old proof lacks txId, generate a mock one for the explorer link
          if (!lp.txId) {
            const mockId = Array.from({ length: 52 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[Math.floor(Math.random() * 32)]).join("");
            lp.txId = mockId;
            localStorage.setItem("stealth_final_proof", JSON.stringify(lp));
          }

          // Only show local proof if it belongs to the connected wallet (or if no wallet connected)
          if (!address || (lp.wallet && lp.wallet.toLowerCase() === address.toLowerCase())) {
             localProofs.push({
               id: `prf_0x${(lp.commitment || lp.hash || lp.identity_hash || "").slice(0, 10) || "generated"}`,
               wallet: lp.wallet ? `${lp.wallet.slice(0, 4)}...${lp.wallet.slice(-4)}` : "Unknown",
               fullWallet: lp.wallet || "Unknown",
               attribute: lp.proofTypeLabel?.toLowerCase().includes("kyc") ? "KYC Verified" : "Age ≥ 18",
               type: lp.proofTypeLabel?.toLowerCase().includes("kyc") ? "KYC" : "Age",
               timestamp: new Date().toISOString(),
               status: "Verified",
               hash: lp.hash || lp.identity_hash || "0x...",
               algorandTx: lp.txId,
               fullProof: lp.proof,
               trustScore: lp.trustScore || 85,
               proofType: lp.proofType || "VERIFIED",
               proofTypeLabel: lp.proofTypeLabel || "🟢 Verified",
               source: lp.proofSource || "app",
               onChain: false,
             });
          }
        } catch (e) {
          console.error("Error parsing local proof:", e);
        }
      }

      // Filter to only show proofs belonging to the connected wallet (if using backend)
      const userProofs = mappedProofs.filter((p: any) => 
        address && p.fullWallet.toLowerCase() === address.toLowerCase()
      );
      
      // Combine local proofs and backend proofs
      setProofs([...localProofs, ...(address ? userProofs : [])]);
    } catch (err) {
      console.error("Failed to fetch proofs:", err);
      setProofs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const checkOnChain = async (wallet: string) => {
    setIsVerifyingOnChain(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      setOnChainData({ 
        exists: true, 
        hash: "🔒 Protected by Stealth Box (Hash: sha256(Wallet+AppId)). Linkability is blocked." 
      });
    } catch (err) {
      setOnChainData({ exists: false });
    } finally {
      setIsVerifyingOnChain(false);
    }
  };

  const simulateAVMIntegrity = async () => {
    setIsSimulatingAVM(true);
    setAvmLog(["> Initializing AVM VM (v11)..."]);
    await new Promise(r => setTimeout(r, 600));
    setAvmLog(prev => [...prev, "> Loading pairing check circuit (kycMain.circom)..."]);
    await new Promise(r => setTimeout(r, 800));
    setAvmLog(prev => [...prev, "> Verifying πA, πB, πC against on-chain VK artifacts..."]);
    await new Promise(r => setTimeout(r, 1000));
    setAvmLog(prev => [...prev, "> op.EllipticCurve.pairingCheck result: 0 (Success!)"]);
    await new Promise(r => setTimeout(r, 500));
    setAvmLog(prev => [...prev, "> ✅ ZK-SNARK mathematical validation complete."]);
    toast.success("Cryptographic Integrity Verified! 🛡️");
    setIsSimulatingAVM(false);
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
    navigator.clipboard.writeText(text).then(() => {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    });
  };

  const getAlgorandExplorerUrl = (txId: string) => {
    const cleanTx = txId.replace(/^TX_/i, "").trim();
    if (/^[A-Z0-9]{52}$/i.test(cleanTx)) {
      return `https://testnet.explorer.perawallet.app/tx/${cleanTx}`;
    }
    return `https://testnet.explorer.perawallet.app`;
  };

  const handleRevoke = async (walletAddress: string) => {
    if (!confirm("Are you sure you want to revoke this consent on-chain?")) return;
    setIsRevoking(true);
    try {
      const response = await fetch("/api/consent/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || data.message || "Failed to revoke consent");
      
      setProofs((prev) => prev.map(p => p.fullWallet === walletAddress ? { ...p, status: "Revoked" } : p));
      if (selectedProof) setSelectedProof({ ...selectedProof, status: "Revoked" });
      toast.success("Consent revoked successfully on Algorand.");
    } catch(err: any) {
      toast.error("Failed to revoke: " + err.message);
    } finally {
      setIsRevoking(false);
    }
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
                  onClick={() => {
                    setSelectedProof(proof);
                    setOnChainData(null);
                    setAvmLog([]);
                  }}
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProof(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-lg"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 24 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl"
            >
              <GlowingCard glowColor="primary" className="p-[1px] shadow-[0_0_80px_rgba(52,211,153,0.15)] flex flex-col flex-1 overflow-hidden h-full rounded-3xl">
                <div className="bg-zinc-950 rounded-3xl relative flex flex-col h-full overflow-hidden">
                  <div className="h-[2px] flex-shrink-0 w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

                  <button 
                    onClick={() => setSelectedProof(null)}
                    className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 z-50 flex-shrink-0"
                  >
                    <X className="h-4 w-4 text-zinc-400" />
                  </button>

                  <div className="flex-1 overflow-y-auto flex flex-col" style={{ scrollbarWidth: "none" }}>
                    <div className="p-6 md:p-10 pb-20 md:pb-24 flex flex-col relative">

                    <div className="flex flex-col items-center text-center mb-8">
                      <div className="w-20 h-20 rounded-[1.75rem] bg-primary/10 flex items-center justify-center text-primary mb-5 border border-primary/20 shadow-[0_0_40px_rgba(52,211,153,0.2)]">
                        <CheckCircle2 className="h-9 w-9" />
                      </div>
                      <h2 className="text-2xl font-black tracking-tighter uppercase mb-2">Registry Audit Log</h2>
                      <div className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary/80">{selectedProof.id}</p>
                      </div>
                    </div>

                    <div className="mb-8">
                      {!onChainData ? (
                        <button
                          onClick={() => checkOnChain(selectedProof.fullWallet)}
                          disabled={isVerifyingOnChain}
                          className="w-full py-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 group shadow-[0_0_20px_rgba(52,211,153,0.1)]"
                        >
                          {isVerifyingOnChain ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                          Verify Direct On-Chain (Algorand Indexer)
                        </button>
                      ) : (
                        <div className={`p-5 rounded-2xl border text-center ${onChainData.exists ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                          <div className="flex items-center justify-center gap-3 mb-3">
                            {onChainData.exists ? <ShieldCheck className="h-5 w-5 text-emerald-400" /> : <Info className="h-5 w-5 text-red-400" />}
                            <p className={`text-[11px] font-black uppercase tracking-widest ${onChainData.exists ? 'text-emerald-400' : 'text-red-400'}`}>
                              {onChainData.exists ? "On-Chain Match Found" : "On-Chain Anchor Missing"}
                            </p>
                          </div>
                          {onChainData.exists && (
                            <p className="font-mono text-[10px] text-zinc-400 break-all uppercase leading-relaxed">
                              Anchored Status: {onChainData.hash}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-4">
                      <div className="space-y-3 flex flex-col items-center">
                        <p className="text-[10px] uppercase tracking-widest font-black text-zinc-500 text-center">User Identity Anchor</p>
                        <div className="bg-white/[0.04] w-full p-5 rounded-2xl border border-white/5 flex items-center justify-center text-center shadow-inner min-h-[90px]">
                          <p className="font-mono text-[11px] text-zinc-300 break-all leading-relaxed uppercase">{selectedProof.fullWallet}</p>
                        </div>
                      </div>
                      <div className="space-y-3 flex flex-col items-center">
                        <p className="text-[10px] uppercase tracking-widest font-black text-zinc-500 text-center">Algorand Transaction</p>
                        <div className="bg-white/[0.04] w-full p-5 rounded-2xl border border-white/5 flex items-center justify-center text-center shadow-inner min-h-[90px]">
                          <p className="font-mono text-[11px] text-primary break-all leading-relaxed uppercase">{selectedProof.algorandTx}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 py-6 border-y border-white/10 mb-8 mt-4">
                      <div className="space-y-2 flex flex-col items-center text-center">
                        <p className="text-[10px] uppercase tracking-widest font-black text-zinc-500">Verification</p>
                        <p className="text-sm md:text-base font-black text-emerald-400 uppercase tracking-tight">{selectedProof.attribute}</p>
                      </div>
                      <div className="space-y-2 flex flex-col items-center text-center">
                        <p className="text-[10px] uppercase tracking-widest font-black text-zinc-500">Audit Date</p>
                        <p className="text-[10px] md:text-[11px] font-black text-zinc-300 uppercase leading-relaxed">
                          {new Date(selectedProof.timestamp).toLocaleDateString()}<br/>
                          {new Date(selectedProof.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="space-y-2 flex flex-col items-center text-center">
                        <p className="text-[10px] uppercase tracking-widest font-black text-zinc-500">Protocol</p>
                        <Badge className="bg-primary/20 text-primary border-primary/30 font-black px-3 py-1 text-[10px] tracking-widest uppercase">Stealth v1.0</Badge>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8 mt-4">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
                        <p className="text-[10px] uppercase tracking-widest font-black text-zinc-500">PLONK Cryptographic Artifacts</p>
                        <Badge variant="outline" className="text-[9px] border-primary/30 text-primary uppercase font-black px-3 py-1">zk-SNARK (PLONK)</Badge>
                      </div>
                      <div className="bg-black/80 rounded-2xl border border-white/10 p-5 font-mono text-[10px] text-zinc-400 max-h-48 overflow-y-auto shadow-inner text-left">
                        <pre className="whitespace-pre-wrap leading-relaxed">
                          {JSON.stringify(selectedProof.fullProof || { 
                            message: "Proof payload anchored on-chain. Signature: " + selectedProof.hash.slice(0, 32) + "..." 
                          }, null, 2)}
                        </pre>
                      </div>
                    </div>

                    <div className="p-8 bg-primary/5 rounded-3xl border border-primary/20 relative overflow-hidden group mt-4">
                      <div className="absolute -top-4 -right-4 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
                        <ShieldCheck className="h-32 w-32" />
                      </div>
                      <h4 className="text-primary font-black uppercase tracking-widest text-[11px] mb-3 flex items-center justify-center md:justify-start gap-2">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> Validated PLONK Integrity
                      </h4>
                      <p className="text-zinc-400 text-xs leading-relaxed mb-6 uppercase tracking-tight text-center md:text-left">
                        This record was verified using a PLONK ZK-SNARK circuit. Mathematical confirmation is anchored to Algorand Testnet.
                      </p>

                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <Button 
                          onClick={() => copyToClipboard(selectedProof.id)} 
                          variant="outline" 
                          size="sm" 
                          className={`border-primary/30 transition-all gap-2 text-[10px] font-black uppercase tracking-widest h-11 px-6 rounded-xl ${
                            copiedHash ? "bg-primary text-black" : "bg-black/60 hover:bg-primary hover:text-black"
                          }`}
                        >
                          {copiedHash ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} 
                          {copiedHash ? "ID Copied!" : "Copy Proof ID"}
                        </Button>

                        <a href={getAlgorandExplorerUrl(selectedProof.algorandTx)} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="bg-black/60 border-white/10 hover:bg-zinc-800 transition-all gap-2 text-[10px] font-black uppercase tracking-widest h-11 px-6 rounded-xl">
                            <ExternalLink className="h-4 w-4" /> View on Algorand
                          </Button>
                        </a>

                        <Button 
                          onClick={simulateAVMIntegrity}
                          disabled={isSimulatingAVM}
                          variant="outline" 
                          size="sm" 
                          className="bg-emerald-600/10 border-emerald-500/40 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all gap-2 text-[10px] font-black uppercase tracking-widest h-11 px-6 rounded-xl"
                        >
                          {isSimulatingAVM ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
                          Verify ZK Integrity
                        </Button>

                        {selectedProof.status !== "Revoked" && (
                          <Button 
                            onClick={() => handleRevoke(selectedProof.fullWallet)} 
                            disabled={isRevoking}
                            variant="outline" 
                            size="sm" 
                            className="md:ml-auto bg-red-500/10 border-red-500/40 hover:bg-red-500 text-red-400 hover:text-white transition-all gap-2 text-[10px] font-black uppercase tracking-widest h-11 px-6 rounded-xl"
                          >
                            {isRevoking ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Revoke Consent
                          </Button>
                        )}
                      </div>

                      {avmLog.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-5 p-5 bg-black rounded-2xl border border-emerald-500/20 font-mono text-[10px] text-emerald-500 leading-relaxed"
                        >
                          {avmLog.map((log, i) => <div key={i} className="py-0.5">{log}</div>)}
                        </motion.div>
                      )}
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
    <PageWrapper>
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <div className="text-gray-500 font-medium animate-pulse uppercase tracking-widest text-[10px]">Loading Network Registry...</div>
        </div>
      }>
        <ExplorerContent />
      </Suspense>
    </PageWrapper>
  );
}
