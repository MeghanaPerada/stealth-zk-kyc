"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Lock, Zap, CheckCircle2, FileJson, Fingerprint, Database, EyeOff, Globe, Settings, ShieldCheck, X } from "lucide-react";
import { GlowingCard } from "@/components/ui/glowing-card";
import { ZkVisualization } from "@/components/ui/zk-visualization";
import PageWrapper from "@/components/layout/PageWrapper";
import ProofExplorer from "@/components/ProofExplorer";
import IdentityFlow from "@/components/IdentityFlow";



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
    <PageWrapper>
      <div style={{padding: "20px", background: "#0f172a", minHeight: "100vh", color: "white"}}>
        <h1 style={{fontSize: "2.5rem", fontWeight: "900", textAlign: "center", marginBottom: "30px", textTransform: "uppercase", letterSpacing: "2px"}}>
          Identity Verification Module
        </h1>
        <IdentityFlow />
        
        <div className="mt-20">
          <ProofExplorer />
        </div>
      </div>
      {/* Hero Section */}


      <section className="relative pt-24 pb-24 md:pt-32 md:pb-24 overflow-hidden">
        <div className="container px-4 mx-auto relative z-10 text-center max-w-5xl">
          <motion.div 
            initial="hidden"
            animate="show"
            variants={containerVars}
            className="flex flex-col items-center"
          >
            <motion.div variants={itemVars} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-8 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-semibold tracking-wide uppercase">Algorand Identity Ecosystem</span>
            </motion.div>
            
            <motion.h1 variants={itemVars} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-emerald-500/70">
              Stealth<br/>
              <span className="text-emerald-500">ZK-KYC Protocol</span>
            </motion.h1>
            
            <motion.p variants={itemVars} className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Connect your decentralized identity through Algorand. We use your wallet solely for <strong className="text-emerald-500 font-black">secure identity anchoring</strong> and cryptographic proof generation.
            </motion.p>
            
            <motion.div variants={itemVars} className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
              <Link href="/kyc" className="w-full sm:w-auto">
                <button className="btn-premium btn-green relative w-full sm:w-auto text-xl h-16 px-12 rounded-full font-black tracking-wide shadow-[0_0_40px_rgba(52,211,153,0.4)] hover:shadow-[0_0_60px_rgba(52,211,153,0.6)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 overflow-hidden group flex items-center justify-center gap-3">
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
              <div className="glass-card p-8 md:p-12 relative overflow-hidden group">
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-red-500/5 rounded-full blur-[80px]" />
                <motion.div variants={itemVars} className="relative z-10">
                   <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20 text-red-500 group-hover:scale-110 transition-transform">
                     <Database className="h-7 w-7" />
                   </div>
                   <h3 className="text-2xl font-black mb-4 text-red-500 uppercase tracking-tight">The Problem: Centralized Honeypots</h3>
                   <p className="text-gray-400 text-lg leading-relaxed mb-6">
                     Traditional KYC systems require you to upload your sensitive data to centralized databases. This creates massive honeypots waiting to be breached.
                   </p>
                   <ul className="space-y-3 text-red-400/60 font-medium">
                     <li className="flex items-center gap-3"><X className="w-4 h-4"/> Your data is out of your control</li>
                     <li className="flex items-center gap-3"><X className="w-4 h-4"/> Constant risk of identity theft</li>
                     <li className="flex items-center gap-3"><X className="w-4 h-4"/> Redundant verification costs</li>
                   </ul>
                </motion.div>
              </div>

              {/* Solution */}
              <div className="glass-card p-8 md:p-12 relative overflow-hidden group border-emerald-500/20">
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px]" />
                <motion.div variants={itemVars} className="relative z-10">
                   <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 text-emerald-500 group-hover:scale-110 transition-transform">
                     <EyeOff className="h-7 w-7" />
                   </div>
                   <h3 className="text-2xl font-black mb-4 text-emerald-500 uppercase tracking-tight">The Solution: Zero Knowledge</h3>
                   <p className="text-gray-300 text-lg leading-relaxed mb-6">
                     Zero Knowledge Proofs (ZKPs) allow you to mathematically prove statements <strong className="text-white">without revealing the underlying data</strong>.
                   </p>
                   <ul className="space-y-3 text-emerald-400/80 font-medium">
                     <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4"/> Absolute data privacy</li>
                     <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4"/> Cryptographic certainty</li>
                     <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4"/> Reusable digital passports</li>
                   </ul>
                </motion.div>
              </div>
           </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container px-4 mx-auto max-w-screen-xl relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-black mb-6 tracking-tighter uppercase">Enterprise Architecture</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-xl italic">Combining top-tier cryptography with a seamless user experience.</p>
          </motion.div>
          
          <motion.div 
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={containerVars}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { title: "Zero Data Storage", icon: Lock, desc: "Your raw personal data is never transmitted to our servers. All PII stays local." },
              { title: "ZK Privacy", icon: Fingerprint, desc: "We generate zk-SNARKs that guarantee validity without revealing values to anyone." },
              { title: "Instant Validation", icon: Zap, desc: "Once generated, any third party can verify your proof instantly on Algorand." }
            ].map((feat, i) => (
              <div key={i} className="glass-card p-8 hover:-translate-y-2 transition-all duration-300 group">
                <motion.div variants={itemVars}>
                  <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-emerald-500 border border-white/5 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                    <feat.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-black mb-3 text-white uppercase tracking-tight">{feat.title}</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">{feat.desc}</p>
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <ZkVisualization />

      {/* Visual System Flow Section */}
      <section className="py-24 relative overflow-hidden" id="architecture">
        <div className="container px-4 mx-auto max-w-screen-xl relative z-10">
          <motion.div 
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-5xl font-black mb-6 tracking-tighter uppercase">Protocol Flow</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-xl italic font-light">From wallet connection to immutable public verification.</p>
          </motion.div>

          <div className="relative">
            <motion.div 
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} variants={containerVars}
              className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10"
            >
              {[
                { title: "Connect", icon: Shield, desc: "Bind your Algorand identity.", href: "/kyc" },
                { title: "Submit", icon: Lock, desc: "Identity data stays local.", href: "/kyc" },
                { title: "Prove", icon: Settings, desc: "ZK-SNARK generation.", href: "/kyc" },
                { title: "Verify", icon: ShieldCheck, desc: "On-Chain validation.", href: "/kyc" },
                { title: "Explore", icon: Globe, desc: "Public audit log.", href: "/explorer" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center relative">
                  <Link href={item.href} className="w-full">
                    <motion.div 
                      variants={itemVars}
                      whileHover={{ y: -10 }}
                      className="flex flex-col items-center text-center group w-full"
                    >
                      <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative transition-all group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10">
                        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-xl bg-zinc-900 border border-emerald-500/30 flex items-center justify-center text-xs font-black text-emerald-500 shadow-xl">0{i+1}</div>
                        <item.icon className="h-10 w-10 text-zinc-500 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-widest mb-3 group-hover:text-emerald-500 transition-colors">{item.title}</h3>
                      <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-tighter">{item.desc}</p>
                    </motion.div>
                  </Link>

                  {i < 4 && (
                    <div className="hidden md:flex absolute top-12 left-[calc(100%-20px)] w-full items-start justify-center pointer-events-none opacity-20">
                      <ArrowRight className="h-6 w-6 text-emerald-500" />
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
            className="mt-24 flex justify-center"
          >
            <div className="glass-card px-8 py-6 flex flex-col md:flex-row items-center gap-8 max-w-3xl border-emerald-500/20">
               <div className="flex -space-x-4">
                 {[1,2,3].map(n => (
                   <div key={n} className="w-12 h-12 rounded-2xl bg-black border border-emerald-500/30 flex items-center justify-center shadow-xl">
                      <ShieldCheck className="h-6 w-6 text-emerald-500" />
                   </div>
                 ))}
               </div>
               <p className="text-sm font-bold text-gray-300 text-center md:text-left leading-relaxed">
                 Identity data never leaves your device. <span className="text-emerald-500 uppercase tracking-widest font-black">Mathematical certainty, total privacy.</span>
               </p>
            </div>
          </motion.div>
        </div>
      </section>
    </PageWrapper>
  );
}
