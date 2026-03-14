"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Lock, Zap, CheckCircle2, FileJson, Fingerprint, Database, EyeOff, Globe, Settings, ShieldCheck } from "lucide-react";
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
      <section className="relative pt-36 pb-24 md:pt-48 md:pb-24 overflow-hidden">
        <div className="container px-4 mx-auto relative z-10 text-center max-w-5xl">
          <motion.div 
            initial="hidden"
            animate="show"
            variants={containerVars}
            className="flex flex-col items-center"
          >
            <motion.div variants={itemVars} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 mb-8 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-semibold tracking-wide uppercase">Algorand Identity Ecosystem</span>
            </motion.div>
            
            <motion.h1 variants={itemVars} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-br from-foreground via-foreground/90 to-primary/70 filter drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              Privacy-Preserving<br/>
              <span className="text-primary filter drop-shadow-[0_0_20px_rgba(52,211,153,0.4)]">Identity Verification</span>
            </motion.h1>
            
            <motion.p variants={itemVars} className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Connect your decentralized identity through Algorand. We use your wallet solely for <strong className="text-primary">secure identity anchoring</strong> and cryptographic proof generation — not for financial transactions.
            </motion.p>
            
            <motion.div variants={itemVars} className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
              <Link href="/kyc" className="w-full sm:w-auto">
                <button className="relative w-full sm:w-auto text-xl h-16 px-12 rounded-full bg-gradient-to-r from-primary to-emerald-400 text-black font-black tracking-wide shadow-[0_0_40px_rgba(52,211,153,0.4)] hover:shadow-[0_0_60px_rgba(52,211,153,0.6)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 overflow-hidden group flex items-center justify-center gap-3">
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                  <span className="relative z-10 flex items-center gap-3">Start KYC Process <ArrowRight className="h-6 w-6" /></span>
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Problem vs Solution Section */}
      <section className="py-24 relative z-10">
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
      <section className="py-24 relative">
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
              <GlowingCard key={i} glowColor="primary" className="p-8 hover:-translate-y-2 transition-transform duration-300">
                <motion.div variants={itemVars}>
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary border border-primary/20 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
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

      {/* Visual System Flow Section */}
      <section className="py-24 relative overflow-hidden bg-black/20" id="architecture">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
        
        <div className="container px-4 mx-auto max-w-screen-xl relative z-10">
          <motion.div 
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight uppercase">System Architecture</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-xl italic font-light">A seamless, privacy-preserving flow from wallet connection to public verification.</p>
          </motion.div>

          <div className="relative">
            {/* Horizontal Flow Container */}
            <motion.div 
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} variants={containerVars}
              className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10"
            >
              {[
                { title: "Identity Connection", icon: Shield, desc: "Connect your Algorand identity to establish decentralized ownership without transaction requirements.", color: "primary", href: "/" },
                { title: "Identity Submission", icon: Lock, desc: "Identity attributes are securely entered and encrypted locally.", color: "blue-500", href: "/kyc" },
                { title: "Zero Knowledge Proof", icon: Settings, desc: "Generate a proof that validates identity attributes without revealing personal data.", color: "primary", href: "/generate" },
                { title: "Proof Verification", icon: ShieldCheck, desc: "Verifier nodes validate the proof without accessing sensitive information.", color: "primary", href: "/verify" },
                { title: "Proof Explorer", icon: Globe, desc: "Public registry showing verification records without exposing identities.", color: "primary", href: "/explorer" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center relative">
                  {/* Card */}
                  <Link href={item.href} className="w-full">
                    <motion.div 
                      variants={itemVars}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="flex flex-col items-center text-center group w-full"
                    >
                      <div className={`w-20 h-20 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center mb-6 relative transition-all group-hover:border-primary/50 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.2)]`}>
                        <div className="absolute -top-3 -left-3 w-7 h-7 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-[10px] font-black text-primary shadow-lg">0{i+1}</div>
                        <item.icon className={`h-9 w-9 text-zinc-400 group-hover:text-primary transition-colors`} />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-widest mb-3 group-hover:text-primary transition-colors">{item.title}</h3>
                      <p className="text-[11px] text-zinc-500 leading-relaxed font-medium uppercase tracking-tighter">{item.desc}</p>
                    </motion.div>
                  </Link>

                  {/* Arrow (except for last item) */}
                  {i < 4 && (
                    <div className="hidden md:flex absolute top-10 left-[calc(100%-20px)] w-full h-full items-start justify-center pointer-events-none z-0">
                       <motion.div 
                         initial={{ opacity: 0.2 }}
                         animate={{ opacity: [0.2, 1, 0.2] }}
                         transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
                         className="w-16 h-[1px] bg-gradient-to-r from-primary/50 to-transparent relative mt-[calc(40px-0.5px)]"
                       >
                         <div className="absolute top-1/2 right-0 -translate-y-1/2 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-primary/50" />
                       </motion.div>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 flex justify-center"
          >
            <div className="bg-primary/5 rounded-2xl px-8 py-5 border border-primary/20 flex flex-col md:flex-row items-center gap-6 backdrop-blur-md shadow-[0_0_50px_rgba(52,211,153,0.1)] max-w-3xl">
               <div className="flex -space-x-3">
                 {[1,2,3].map(n => (
                   <div key={n} className="w-10 h-10 rounded-full bg-zinc-900 border border-primary/30 flex items-center justify-center shadow-xl">
                      <Shield className="h-4 w-4 text-primary" />
                   </div>
                 ))}
               </div>
               <p className="text-sm font-bold text-zinc-300 text-center md:text-left leading-relaxed">
                 Identity data remains on the user device. <span className="text-primary uppercase tracking-wider">Only a cryptographic proof is shared on the Algorand mainnet.</span>
               </p>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
