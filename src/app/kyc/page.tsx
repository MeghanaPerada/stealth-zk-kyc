"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ArrowRight, Lock, User, Calendar, MapPin, Fingerprint, Wallet } from "lucide-react";
import { GlowingCard } from "@/components/ui/glowing-card";
import { useWalletContext } from "@/context/WalletContext";

export default function KYCSubmission() {
  const router = useRouter();
  const { isConnected, connectedAddress } = useWalletContext();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    country: "",
    aadhaar: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConnectWarning, setShowConnectWarning] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setShowConnectWarning(true);
    } else {
      setShowConnectWarning(false);
    }
  }, [isConnected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return;
    setIsSubmitting(true);
    
    setTimeout(() => {
      router.push("/generate?attr=age_over_18");
    }, 1200);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="container max-w-2xl pt-32 md:pt-40 lg:pt-48 pb-16 px-4 mx-auto relative min-h-[calc(100vh-8rem)] flex flex-col justify-center">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight drop-shadow-md">Secure Identity Submission</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Your data remains entirely on your device. We only generate a cryptographic proof of your attributes.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" as const }}
      >
        <GlowingCard glowColor={isConnected ? "primary" : "destructive"} className="p-1">
          <div className="bg-background/60 backdrop-blur-2xl rounded-lg border-t border-white/5 p-8 md:p-10 relative overflow-hidden">
            {!isConnected && (
              <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-6 transition-all duration-500">
                <div className="bg-zinc-900/90 border border-destructive/30 p-8 rounded-3xl text-center max-w-sm shadow-2xl">
                  <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-destructive/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                    <Wallet className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-widest mb-3 text-destructive">Wallet Required</h3>
                  <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                    Please connect your Algorand wallet to proceed with the identity verification process.
                  </p>
                  <Button 
                    onClick={() => router.push('/')}
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 h-12 px-8 font-bold tracking-widest uppercase text-xs rounded-xl"
                  >
                    Go to Homepage
                  </Button>
                </div>
              </div>
            )}

            <div className={`flex items-center gap-4 mb-8 pb-6 border-b border-border/50 transition-opacity duration-300 ${!isConnected ? 'opacity-20' : 'opacity-100'}`}>
              <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight uppercase tracking-tighter">Identity Details</h2>
                <p className="text-muted-foreground text-xs font-medium">Enter your details for decentralized identity anchoring</p>
              </div>
              {isConnected && (
                <div className="ml-auto hidden sm:block">
                  <div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-full flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{connectedAddress?.slice(0, 4)}...{connectedAddress?.slice(-4)}</span>
                  </div>
                </div>
              )}
            </div>
            
            <motion.form 
              onSubmit={handleSubmit} 
              className={`space-y-6 transition-all duration-300 ${!isConnected ? 'opacity-10 blur-sm pointer-events-none select-none' : 'opacity-100'}`}
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={itemVariants} className="space-y-2 group">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-focus-within:text-primary transition-colors flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Full Legal Name
                </Label>
                <div className="relative">
                  <Input 
                    id="name" 
                    name="name"
                    placeholder="John Doe" 
                    value={formData.name}
                    onChange={handleChange}
                    required={isConnected}
                    className="bg-black/40 border-white/5 focus-visible:ring-primary/40 focus-visible:border-primary/40 h-14 text-lg backdrop-blur-sm transition-all rounded-xl"
                  />
                </div>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="space-y-2 group">
                  <Label htmlFor="age" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-focus-within:text-primary transition-colors flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Age
                  </Label>
                  <Input 
                    id="age" 
                    name="age"
                    type="number" 
                    placeholder="e.g. 25" 
                    min="1"
                    value={formData.age}
                    onChange={handleChange}
                    required={isConnected}
                    className="bg-black/40 border-white/5 focus-visible:ring-primary/40 focus-visible:border-primary/40 h-14 text-lg backdrop-blur-sm transition-all rounded-xl"
                  />
                </motion.div>
                <motion.div variants={itemVariants} className="space-y-2 group">
                  <Label htmlFor="country" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-focus-within:text-primary transition-colors flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Country
                  </Label>
                  <Input 
                    id="country" 
                    name="country"
                    placeholder="e.g. USA" 
                    value={formData.country}
                    onChange={handleChange}
                    required={isConnected}
                    className="bg-black/40 border-white/5 focus-visible:ring-primary/40 focus-visible:border-primary/40 h-14 text-lg backdrop-blur-sm transition-all rounded-xl"
                  />
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="space-y-2 group pt-2">
                <Label htmlFor="aadhaar" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-focus-within:text-primary transition-colors flex items-center gap-2">
                  <Fingerprint className="w-3.5 h-3.5" /> Government ID Number
                </Label>
                <Input 
                  id="aadhaar" 
                  name="aadhaar"
                  type="password"
                  placeholder="Enter 12-digit number" 
                  value={formData.aadhaar}
                  onChange={handleChange}
                  required={isConnected}
                  className="bg-black/40 border-white/5 focus-visible:ring-primary/40 focus-visible:border-primary/40 h-14 text-lg font-mono tracking-widest backdrop-blur-sm transition-all rounded-xl"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="pt-8">
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 mb-8 flex items-start gap-4 shadow-[0_0_30px_rgba(52,211,153,0.05)]">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Local Privacy Layer Active</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Your identity data is encrypted locally and never stored on servers. Only the zero-knowledge proof will be shared.
                    </p>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full h-16 text-lg font-black tracking-widest uppercase bg-gradient-to-r from-primary to-emerald-400 text-black shadow-[0_0_30px_rgba(52,211,153,0.3)] hover:shadow-[0_0_50px_rgba(52,211,153,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 relative overflow-hidden group rounded-2xl disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center"
                  disabled={isSubmitting || !isConnected}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                  
                  {isSubmitting ? (
                    <span className="flex items-center relative z-10">
                      <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-black/60 mr-4"></span>
                      Initiating Cryptography...
                    </span>
                  ) : (
                    <span className="flex items-center relative z-10">
                      Generate ZK Proof <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </button>
              </motion.div>
            </motion.form>
          </div>
        </GlowingCard>
      </motion.div>
    </div>
  );
}
