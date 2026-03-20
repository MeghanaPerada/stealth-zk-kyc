"use client";
import React, { useState } from "react";
import { Loader2, Send, CheckCircle2, ShieldCheck, Mail, Phone, Fingerprint } from "lucide-react";

interface KYCFlowProps {
  onVerified: (data: any) => void;
  walletAddress?: string | null;
}

export default function KYCFlow({ onVerified, walletAddress }: KYCFlowProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [manualData, setManualData] = useState({ pan: "", aadhaar: "", dob: "" });
  const [mode, setMode] = useState<"digilocker" | "manual">("digilocker");

  const key = email || phone;

  // 1️⃣ Send OTP
  const sendOtp = async () => {
    if (!key) return alert("Please enter an email or phone number.");
    setIsSending(true);
    try {
      const res = await fetch("/api/otp/send", { 
        method: "POST", 
        body: JSON.stringify({ key }), 
        headers: { "Content-Type": "application/json" } 
      });
      if (!res.ok) throw new Error("Failed to send OTP");
      setOtpSent(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSending(false);
    }
  };

  // 2️⃣ Verify OTP & Release Data
  const verifyOtp = async () => {
    if (!otp) return alert("Please enter the OTP.");
    setIsVerifying(true);
    try {
      const res = await fetch("/api/otp/verify", { 
        method: "POST", 
        body: JSON.stringify({ key, otp }), 
        headers: { "Content-Type": "application/json" } 
      });
      const data = await res.json();
      
      if (!data.verified) {
        throw new Error(data.error || "Invalid OTP");
      }

      // If DigiLocker (Simulated), we release standard mock data
      if (mode === "digilocker") {
        onVerified({
          type: "digilocker",
          email,
          phone,
          pan: "ABCDE1234F",
          aadhaar: "123412341234",
          dob: "1998-05-15",
          wallet: walletAddress
        });
      } else {
        onVerified({ 
          type: "manual", 
          ...manualData, 
          wallet: walletAddress 
        });
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <ShieldCheck className="text-emerald-400 w-6 h-6" />
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Identity Attestation
        </h3>
      </div>
      
      <div className="flex p-1 bg-slate-950 rounded-xl gap-1">
        <button 
          onClick={() => setMode("digilocker")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            mode === "digilocker" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
          }`}
        >
          DigiLocker (Sim)
        </button>
        <button 
          onClick={() => setMode("manual")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            mode === "manual" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
          }`}
        >
          Manual Entry
        </button>
      </div>

      <div className="space-y-4">
        {mode === "digilocker" ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input 
                type="tel" 
                placeholder="Mobile Number" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
            <input 
              type="text" 
              placeholder="PAN Number (e.g. ABCDE1234F)" 
              value={manualData.pan} 
              onChange={e => setManualData({ ...manualData, pan: e.target.value })} 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-white focus:border-emerald-500/50 outline-none"
            />
            <input 
              type="text" 
              placeholder="Aadhaar Number (12 digits)" 
              value={manualData.aadhaar} 
              onChange={e => setManualData({ ...manualData, aadhaar: e.target.value })} 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-white focus:border-emerald-500/50 outline-none"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase font-semibold">DOB:</span>
              <input 
                type="date" 
                value={manualData.dob} 
                onChange={e => setManualData({ ...manualData, dob: e.target.value })} 
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-white focus:border-emerald-500/50 outline-none"
              />
            </div>
          </div>
        )}

        {!otpSent ? (
          <button 
            onClick={sendOtp}
            disabled={isSending}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isSending ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
            Trigger Consent Code
          </button>
        ) : (
          <div className="space-y-3 animate-in fade-in zoom-in-95">
            <div className="relative">
              <Fingerprint className="absolute left-3 top-3 w-4 h-4 text-emerald-500" />
              <input 
                type="text" 
                placeholder="Enter 6-Digit OTP" 
                value={otp} 
                onChange={e => setOtp(e.target.value)} 
                className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-emerald-500 outline-none placeholder:text-slate-600"
              />
            </div>
            <button 
              onClick={verifyOtp}
              disabled={isVerifying}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isVerifying ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              Verify & Authorize
            </button>
          </div>
        )}
      </div>
      <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest leading-relaxed">
        Secure Zero-Knowledge Attestation <br/>
        No PII Stored on Core Chain
      </p>
    </div>
  );
}
