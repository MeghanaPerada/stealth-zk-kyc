"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Lock, Zap, CheckCircle2, FileJson, Fingerprint, Database, EyeOff } from "lucide-react";
import { GlowingCard } from "@/components/ui/glowing-card";
import { ZkVisualization } from "@/components/ui/zk-visualization";

export default function Home() {
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="container px-4 mx-auto relative z-10 text-center max-w-5xl">
          <motion.div 
            initial="hidden"
            animate="show"
            variants={containerVars}
            className="flex flex-col items-center"
          >
            <motion.div variants={itemVars} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 mb-8 mt-8 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-semibold tracking-wide uppercase">Privacy-First Identity Verification</span>
            </motion.div>
            
            <motion.h1 variants={itemVars} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-br from-foreground via-foreground/90 to-primary/70 filter drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              Private Identity.<br/>
              <span className="text-primary filter drop-shadow-[0_0_20px_rgba(52,211,153,0.4)]">Verified Instantly.</span>
            </motion.h1>
            
            <motion.p variants={itemVars} className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Verify your identity using <strong className="text-foreground">Zero Knowledge Proofs</strong>. No sensitive personal data is ever stored on our servers.
            </motion.p>
            
            <motion.div variants={itemVars} className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
              <Link href="/kyc" className="w-full sm:w-auto">
                <Button size="lg" className="w-full text-lg h-14 px-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_rgba(52,211,153,0.4)] hover:shadow-[0_0_50px_rgba(52,211,153,0.6)] transition-all">
                  Generate Proof <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/verify" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full text-lg h-14 px-10 border-primary/30 text-foreground bg-background/50 backdrop-blur hover:bg-primary/10 hover:border-primary/50 transition-all">
                  Verify Identity
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Problem vs Solution Section */}
      <section className="py-32 relative z-10">
        <div className="container px-4 mx-auto max-w-screen-xl">
           <motion.div 
             initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={containerVars}
             className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch"
           >
              {/* Problem */}
              <GlowingCard glowColor="destructive" className="p-8 md:p-12">
                <motion.div variants={itemVars}>
                   <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20 text-red-500">
                     <Database className="h-7 w-7" />
                   </div>
                   <h3 className="text-2xl font-bold mb-4 text-red-500/90">The Problem: Centralized Honeypots</h3>
                   <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                     Traditional KYC systems require you to upload your passport, ID card, and face scan to centralized databases. This creates massive honeypots of extremely sensitive personal data waiting to be breached.
                   </p>
                   <ul className="space-y-3 text-red-400/80">
                     <li className="flex items-center gap-2"><Lock className="w-4 h-4"/> Your data is out of your control</li>
                     <li className="flex items-center gap-2"><Lock className="w-4 h-4"/> Constant risk of identity theft</li>
                     <li className="flex items-center gap-2"><Lock className="w-4 h-4"/> Redundant verification everywhere</li>
                   </ul>
                </motion.div>
              </GlowingCard>

              {/* Solution */}
              <GlowingCard glowColor="primary" className="p-8 md:p-12 relative overflow-hidden">
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
                <motion.div variants={itemVars} className="relative z-10">
                   <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 text-primary">
                     <EyeOff className="h-7 w-7" />
                   </div>
                   <h3 className="text-2xl font-bold mb-4 text-primary">The Solution: Zero Knowledge</h3>
                   <p className="text-zinc-300 text-lg leading-relaxed mb-6">
                     Zero Knowledge Proofs (ZKPs) allow you to mathematically prove a statement (like "I am over 18" or "I am not from a sanctioned country") <strong className="text-white">without revealing the underlying data</strong>.
                   </p>
                   <ul className="space-y-3 text-primary/80">
                     <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Absolute data privacy</li>
                     <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Cryptographic certainty</li>
                     <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Reusable digital identity passports</li>
                   </ul>
                </motion.div>
              </GlowingCard>
           </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-primary/5 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] pointer-events-none" />
        <div className="container px-4 mx-auto max-w-screen-xl relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Enterprise-Grade Architecture</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-xl">Combining cutting-edge cryptography with a seamless user experience.</p>
          </motion.div>
          
          <motion.div 
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={containerVars}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { title: "Zero Data Storage", icon: Lock, desc: "Your raw personal data is never transmitted to our servers. Proofs correspond to your local device." },
              { title: "Cryptographic Privacy", icon: Fingerprint, desc: "We generate zk-SNARKs that mathematically guarantee the validity of your attributes without revealing values." },
              { title: "Instant Validation", icon: Zap, desc: "Once your proof is generated, any third party can verify it instantly on-chain in milliseconds." }
            ].map((feat, i) => (
              <GlowingCard key={i} glowColor="secondary" className="p-8 hover:-translate-y-2 transition-transform duration-300">
                <motion.div variants={itemVars}>
                  <div className="h-14 w-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 text-secondary border border-secondary/20 shadow-[0_0_15px_rgba(124,58,237,0.2)]">
                    <feat.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{feat.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">{feat.desc}</p>
                </motion.div>
              </GlowingCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Interactive ZK Visualization */}
      <ZkVisualization />

      {/* How it Works Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px] -z-10"></div>
        
        <div className="container px-4 mx-auto max-w-screen-xl relative z-10">
          <motion.div 
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-xl">A seamless, privacy-preserving flow from submission to verification.</p>
          </motion.div>

          <div className="relative">
            {/* Animated Connecting line */}
            <div className="hidden md:block absolute top-[80px] left-[15%] right-[15%] h-[2px] bg-border/40 z-0 overflow-hidden rounded-full">
               <motion.div 
                 initial={{ x: "-100%" }}
                 animate={{ x: "200%" }}
                 transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                 className="h-full bg-gradient-to-r from-transparent via-primary to-transparent w-1/2" 
               />
            </div>

            <motion.div 
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} variants={containerVars}
              className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 relative z-10"
            >
              {[
                { step: 1, title: "Submit Attributes", icon: FileJson, desc: "Provide identity documents locally in your browser. No data leaves the device.", highlight: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
                { step: 2, title: "Generate ZK Proof", icon: Lock, desc: "A cryptographic SNARK is computed that verifies your attributes without revealing them.", highlight: "bg-primary/10 text-primary border-primary/40 shadow-[0_0_30px_rgba(52,211,153,0.3)]" },
                { step: 3, title: "Instant Verification", icon: CheckCircle2, desc: "Submit just the proof to any verifier, which mathematically confirms its validity instantly.", highlight: "bg-secondary/10 text-secondary border-secondary/30" },
              ].map((item, i) => (
                <motion.div key={i} variants={itemVars} className="flex flex-col items-center text-center relative group">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-24 h-24 rounded-3xl bg-[var(--glass-effect)] backdrop-blur-md border flex items-center justify-center mb-8 relative transition-colors ${item.highlight}`}
                  >
                    <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-black shadow-lg shadow-black/50">{item.step}</div>
                    <item.icon className="h-10 w-10" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-muted-foreground text-lg max-w-sm mx-auto leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Ready CTA */}
      <section className="py-32 relative text-center border-t border-border/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="container px-4 mx-auto max-w-4xl relative z-10">
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8, type: "spring" }}
          >
            <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">Ready to secure your identity?</h2>
            <p className="text-2xl text-muted-foreground mb-12">Join the privacy revolution today.</p>
            <Link href="/kyc">
              <Button size="lg" className="text-xl h-16 px-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_40px_rgba(52,211,153,0.4)] hover:shadow-[0_0_60px_rgba(52,211,153,0.6)] transition-all">
                Start KYC Process
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
