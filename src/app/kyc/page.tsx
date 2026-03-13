"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ArrowRight, Lock, User, Calendar, MapPin, Fingerprint } from "lucide-react";
import { GlowingCard } from "@/components/ui/glowing-card";

export default function KYCSubmission() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    country: "",
    aadhaar: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="container max-w-2xl py-16 px-4 mx-auto relative min-h-[calc(100vh-8rem)] flex flex-col justify-center">
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
        <GlowingCard glowColor="primary" className="p-1">
          <div className="bg-background/60 backdrop-blur-2xl rounded-lg border-t border-white/5 p-8 md:p-10">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Identity Details</h2>
                <p className="text-muted-foreground text-sm">Enter your details to generate a Zero Knowledge Proof</p>
              </div>
            </div>
            
            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={itemVariants} className="space-y-2 group">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors flex items-center gap-2">
                  <User className="w-4 h-4" /> Full Legal Name
                </Label>
                <div className="relative">
                  <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <Input 
                    id="name" 
                    name="name"
                    placeholder="John Doe" 
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="bg-black/20 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 h-12 text-lg backdrop-blur-sm transition-all"
                  />
                </div>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="space-y-2 group">
                  <Label htmlFor="age" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Age
                  </Label>
                  <Input 
                    id="age" 
                    name="age"
                    type="number" 
                    placeholder="e.g. 25" 
                    min="1"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    className="bg-black/20 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 h-12 text-lg backdrop-blur-sm transition-all"
                  />
                </motion.div>
                <motion.div variants={itemVariants} className="space-y-2 group">
                  <Label htmlFor="country" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Country
                  </Label>
                  <Input 
                    id="country" 
                    name="country"
                    placeholder="e.g. USA" 
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="bg-black/20 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 h-12 text-lg backdrop-blur-sm transition-all"
                  />
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="space-y-2 group pt-2">
                <Label htmlFor="aadhaar" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors flex items-center gap-2">
                  <Fingerprint className="w-4 h-4" /> Government ID Number
                </Label>
                <Input 
                  id="aadhaar" 
                  name="aadhaar"
                  type="password"
                  placeholder="Enter 12-digit number" 
                  value={formData.aadhaar}
                  onChange={handleChange}
                  required
                  className="bg-black/20 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 h-12 text-lg font-mono tracking-widest backdrop-blur-sm transition-all"
                />
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-xs font-medium text-emerald-400/80 flex items-center mt-3 bg-emerald-500/10 w-fit px-3 py-1.5 rounded-full border border-emerald-500/20"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                  Your ID is encrypted and never leaves this device.
                </motion.p>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-6">
                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-bold tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_rgba(52,211,153,0.3)] hover:shadow-[0_0_50px_rgba(52,211,153,0.5)] transition-all relative overflow-hidden group"
                  disabled={isSubmitting}
                >
                  {/* Button hover gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
                  
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/80 mr-3"></span>
                      Initiating Cryptography...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Generate ZK Proof <ArrowRight className="ml-2 h-5 w-5" />
                    </span>
                  )}
                </Button>
              </motion.div>
            </motion.form>
          </div>
        </GlowingCard>
      </motion.div>
    </div>
  );
}
