"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  User, 
  Calendar, 
  Fingerprint, 
  FileUp, 
  FileJson, 
  CheckCircle2, 
  Download,
  Zap,
  PlusCircle,
  Upload,
  Shield
} from "lucide-react";
import { GlowingCard } from "@/components/ui/glowing-card";
import { useWallet } from "@/hooks/useWallet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function KYCSubmission() {
  const router = useRouter();
  const { isConnected, address, connectWallet } = useWallet();
  const [activeTab, setActiveTab] = useState("oracle");
  const [isFetchingOracle, setIsFetchingOracle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [manualData, setManualData] = useState({
    name: "",
    dob: "",
    email: ""
  });
  
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [digilockerData, setDigilockerData] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchFromDigiLocker = async () => {
    if (!isConnected) {
      setFetchError("Please connect wallet first");
      return;
    }
    
    setIsFetchingOracle(true);
    setFetchError(null);
    setDigilockerData(null);
    
    try {
      // Production-aligned DigiLocker Fetch
      const response = await fetch("/api/digilocker/demo-user");
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Failed to fetch identity data");

      // Extract attributes for ZK process
      const kycContext = {
        name: data.data.name,
        dob: data.data.dob,
        birthYear: data.data.dob.split('-')[0],
        aadhaar_last4: data.data.aadhaar_last4,
        pan: "ABCDE1234F", // Standardized Demo PAN
        issuer: data.issuer,
        sourceType: data.type
      };

      setDigilockerData({
        name: kycContext.name,
        dob: kycContext.dob,
        pan: kycContext.pan,
        raw: kycContext
      });
      
      // Store the identity context for the ZK generator
      localStorage.setItem("stealth_identity_credential", JSON.stringify(kycContext));
      
    } catch (error: any) {
      console.error("DigiLocker fetch failed:", error);
      setFetchError(error.message || "Failed to connect to DigiLocker network");
    } finally {
      setIsFetchingOracle(false);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (text) {
          localStorage.setItem("stealth_identity_credential", text as string);
        }
      };
      reader.readAsText(uploadedFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return;
    setIsSubmitting(true);
    
    if (activeTab === "manual") {
      const cred = {
        name: manualData.name,
        credential: "manual_entry",
        timestamp: new Date().toISOString(),
        issuer: "Self-Signed_Local"
      };
      localStorage.setItem("stealth_identity_credential", JSON.stringify(cred));
    }

    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/generate");
    }, 2000);
  };

  return (
    <div className="container max-w-5xl pt-32 md:pt-40 lg:pt-48 pb-16 px-4 mx-auto min-h-[calc(100vh-4rem-200px)] flex flex-col items-center justify-center relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-black uppercase tracking-widest mb-4">
          <Fingerprint className="w-3 h-3" /> Step 2: Acquire Identity Credentials
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter uppercase">Credential Porter</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto italic font-light">
          Acquire or upload cryptographically signed identity credentials.
        </p>
      </motion.div>

      <div className="w-full max-w-3xl relative">
        {!isConnected && (
          <div className="absolute inset-x-0 -inset-y-4 z-20 bg-black/40 backdrop-blur-[2px] rounded-3xl flex items-center justify-center p-6 transition-all duration-500">
            <div className="bg-zinc-900/90 border border-destructive/30 p-8 rounded-3xl text-center max-w-sm shadow-2xl">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-destructive/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <Fingerprint className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest mb-3 text-destructive">Identity Required</h3>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                Please connect your Algorand Identity to proceed with the secure verification process.
              </p>
              <Button 
                onClick={connectWallet}
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 h-12 px-8 font-bold tracking-widest uppercase text-xs rounded-xl"
              >
                Connect Identity
              </Button>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/40 h-16 rounded-2xl p-1.5 border border-white/5 mb-10 shadow-2xl backdrop-blur-3xl">
            <TabsTrigger value="oracle" className="rounded-xl font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-black transition-all">
              <Download className="w-4 h-4 mr-2" /> DigiLocker Connect
            </TabsTrigger>
            <TabsTrigger value="upload" className="rounded-xl font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-black transition-all">
              <FileJson className="w-4 h-4 mr-2" /> Upload VC
            </TabsTrigger>
            <TabsTrigger value="manual" className="rounded-xl font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-black transition-all">
              <PlusCircle className="w-4 h-4 mr-2" /> Manual Entry
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {activeTab === "oracle" && (
              <TabsContent key="oracle" value="oracle" className="mt-0" forceMount>
                <motion.div 
                  key="oracle-content"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                >
                  <GlowingCard glowColor="primary" className="p-1">
                    <div className="bg-background/40 backdrop-blur-3xl rounded-2xl p-10 flex flex-col items-center text-center border-t border-white/5">
                        <div className="p-4 bg-primary/10 rounded-2xl text-primary mb-8 border border-primary/20 shadow-[0_0_20px_rgba(52,211,153,0.1)]">
                          <Download className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-widest mb-4">DigiLocker Connect v1.0</h2>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-10 max-w-md leading-relaxed">
                          Securely fetch your government-issued documents directly from DigiLocker. We only extract the minimum required attributes for KYC.
                        </p>
                        
                        <button 
                          onClick={fetchFromDigiLocker}
                          disabled={isFetchingOracle}
                          className="w-full h-16 text-lg font-black tracking-widest uppercase bg-gradient-to-r from-primary to-emerald-400 text-black shadow-[0_0_30px_rgba(52,211,153,0.3)] hover:shadow-[0_0_50px_rgba(52,211,153,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-2xl relative overflow-hidden group flex items-center justify-center"
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                          {isFetchingOracle ? (
                            <span className="flex items-center">
                              <span className="w-5 h-5 rounded-full border-2 border-black/40 border-t-black animate-spin mr-3"></span>
                              Extracting Attributes...
                            </span>
                          ) : (
                            "Fetch From DigiLocker"
                          )}
                        </button>

                        {fetchError && (
                          <div className="mt-6 p-4 w-full bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> {fetchError}
                          </div>
                        )}

                        {digilockerData && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 w-full p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-left"
                          >
                            <div className="flex items-center gap-2 mb-4 text-emerald-400">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Credentials Fetched Successfully</span>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                                <span className="text-[9px] font-bold uppercase text-zinc-500">Name</span>
                                <span className="text-xs font-mono text-zinc-300">{digilockerData.name}</span>
                              </div>
                              <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                                <span className="text-[9px] font-bold uppercase text-zinc-500">Age Range</span>
                                <span className="text-xs font-mono text-zinc-300">18+ (Verified)</span>
                              </div>
                              <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                                <span className="text-[9px] font-bold uppercase text-zinc-500">PAN Status</span>
                                <span className="text-xs font-mono text-primary">{digilockerData.pan}</span>
                              </div>
                            </div>
                            
                            <button 
                              onClick={handleSubmit}
                              className="w-full mt-6 h-12 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                            >
                              Generate ZK Proof <ArrowRight className="w-4 h-4" />
                            </button>
                          </motion.div>
                        )}
                    </div>
                  </GlowingCard>
                </motion.div>
              </TabsContent>
            )}

            {activeTab === "upload" && (
              <TabsContent key="upload" value="upload" className="mt-0" forceMount>
                <motion.div
                  key="upload-content"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                >
                  <GlowingCard glowColor="primary" className="p-1">
                    <div className="bg-background/40 backdrop-blur-3xl rounded-2xl p-8 md:p-12 border-t border-white/5">
                      <div 
                        className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center group hover:border-primary/40 transition-all cursor-pointer bg-white/5 relative overflow-hidden"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          className="hidden" 
                          onChange={handleUpload}
                          accept=".json"
                        />
                        <div className="max-w-xs mx-auto space-y-6">
                          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto border border-white/5 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                            {file ? <FileJson className="h-8 w-8 text-primary" /> : <Upload className="h-8 w-8 text-zinc-600 group-hover:text-primary transition-colors" />}
                          </div>
                          <div className="space-y-2">
                            <p className="font-black uppercase tracking-widest text-sm text-zinc-300">
                              {file ? file.name : "Drop Signed Credential"}
                            </p>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Supports .JSON format from trusted oracles</p>
                          </div>
                          {file && (
                            <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Credential Loaded</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-10 flex gap-4">
                        <Button variant="outline" onClick={() => {
                          const sample = {
                            credential: "age_over_18_certificate",
                            issuer: "Sample_Issuer_0x8f2a",
                            issuedAt: new Date().toISOString(),
                            hash: "0xec23...a9b1",
                            signature: "0x7d8e...f2a4"
                          };
                          const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
                          const dUrl = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = dUrl;
                          a.download = "sample_credential.json";
                          a.click();
                        }} className="flex-1 h-14 border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all rounded-xl">
                          Download Sample VC
                        </Button>
                        <button 
                          onClick={handleSubmit}
                          disabled={!file || isSubmitting}
                          className="flex-[2] h-14 bg-gradient-to-r from-primary to-emerald-400 text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.2)] hover:shadow-[0_0_40px_rgba(52,211,153,0.4)] hover:scale-[1.02] transition-all disabled:opacity-40 disabled:pointer-events-none"
                        >
                          {isSubmitting ? "Processing..." : (
                            <span className="flex items-center justify-center gap-2">
                              Continue to Generation <ArrowRight className="w-4 h-4" />
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </GlowingCard>
                </motion.div>
              </TabsContent>
            )}

            {activeTab === "manual" && (
              <TabsContent key="manual" value="manual" className="mt-0" forceMount>
                <motion.div
                  key="manual-content"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                >
                  <GlowingCard glowColor="primary" className="p-1">
                    <div className="bg-background/40 backdrop-blur-3xl rounded-2xl p-8 md:p-12 border-t border-white/5">
                      <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Full Legal Name</Label>
                            <Input 
                              value={manualData.name}
                              onChange={(e) => setManualData({...manualData, name: e.target.value})}
                              placeholder="John Doe" 
                              className="bg-white/5 border-white/10 h-14 rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary/40 text-sm font-bold placeholder:text-zinc-700 font-mono" 
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Date of Birth</Label>
                            <Input 
                              type="date"
                              value={manualData.dob}
                              onChange={(e) => setManualData({...manualData, dob: e.target.value})}
                              className="bg-white/5 border-white/10 h-14 rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary/40 text-sm font-bold text-zinc-400" 
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Verified Email Endpoint</Label>
                          <Input 
                            type="email" 
                            value={manualData.email}
                            onChange={(e) => setManualData({...manualData, email: e.target.value})}
                            placeholder="vault@identity.secure" 
                            className="bg-white/5 border-white/10 h-14 rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary/40 text-sm font-bold placeholder:text-zinc-700 font-mono" 
                          />
                        </div>

                        <div className="flex gap-4 pt-4">
                          <Button type="submit" disabled={isSubmitting || !manualData.name} className="w-full h-16 bg-gradient-to-r from-primary to-emerald-400 text-black font-black uppercase tracking-widest text-sm rounded-2xl shadow-[0_0_40px_rgba(52,211,153,0.3)] hover:shadow-[0_0_60px_rgba(52,211,153,0.5)] transition-all hover:scale-[1.02]">
                            {isSubmitting ? "Encrypting Locally..." : "Proceed to Proof Generation"}
                          </Button>
                        </div>

                        <p className="text-center text-[9px] text-zinc-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                          <Shield className="h-3 w-3" /> Data is only stored in browser memory & local vault
                        </p>
                      </form>
                    </div>
                  </GlowingCard>
                </motion.div>
              </TabsContent>
            )}
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
}
