"use client";

import React, { useState, useEffect } from "react";

type Step = "home" | "email" | "txn" | "otp" | "verified" | "manual";

export default function IdentityFlow() {
  const [step, setStep] = useState<Step>("home");
  const [email, setEmail] = useState("");
  const [txnHash, setTxnHash] = useState("");
  const [otp, setOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    console.log("Step:", step);
  }, [step]);

  const generateOtp = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(newOtp);
  };

  const handleDigiLockerClick = () => setStep("email");
  const handleManualClick = () => setStep("manual");

  const handleEmailContinue = () => {
    if (email) setStep("txn");
  };

  const handleSignConsent = async () => {
    const txn = {
      type: "CONSENT",
      email: email,
      timestamp: Date.now(),
    };
    
    // Mock hash generation
    try {
        const msgUint8 = new TextEncoder().encode(JSON.stringify(txn));
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        setTxnHash(hashHex);
    } catch (e) {
        setTxnHash("0x" + Math.random().toString(16).slice(2));
    }
    
    generateOtp();
    setStep("otp");
  };

  const handleVerifyOtp = () => {
    if (enteredOtp === otp) {
      setStep("verified");
    } else {
      alert("Invalid OTP! Try again.");
    }
  };

  const handleManualVerify = () => {
    if (name && email) {
      setStep("verified");
    }
  };

  const reset = () => {
    setStep("home");
    setEmail("");
    setTxnHash("");
    setOtp("");
    setEnteredOtp("");
    setName("");
  };

  const containerStyle: React.CSSProperties = {
    padding: "40px",
    background: "#1e293b",
    borderRadius: "20px",
    maxWidth: "600px",
    margin: "40px auto",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    border: "1px solid #334155",
    color: "white",
    fontFamily: "Inter, system-ui, sans-serif",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "12px 24px",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer",
    border: "none",
    transition: "all 0.2s",
    marginTop: "10px",
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: "#3b82f6",
    color: "white",
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: "#64748b",
    color: "white",
  };

  const inputStyle: React.CSSProperties = {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #475569",
    background: "#0f172a",
    color: "white",
    width: "100%",
    marginBottom: "15px",
    outline: "none",
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "10px", textAlign: "center" }}>
        Verify your identity
      </h2>
      <p style={{ color: "#94a3b8", marginBottom: "30px", textAlign: "center" }}>
        Secure verification powered by <strong>Stealth ZK-KYC</strong>
      </p>

      {step === "home" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <button 
            style={{ ...primaryButtonStyle, background: "#10b981", height: "60px", fontSize: "1.1rem" }}
            onClick={handleDigiLockerClick}
          >
            Fetch from DigiLocker
          </button>
          <button 
            style={{ ...secondaryButtonStyle, height: "60px", fontSize: "1.1rem" }}
            onClick={handleManualClick}
          >
            Enter Details Manually
          </button>
        </div>
      )}

      {step === "email" && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ marginBottom: "10px", fontWeight: "bold" }}>Enter your Email</label>
          <input 
            style={inputStyle}
            type="email" 
            placeholder="email@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button style={primaryButtonStyle} onClick={handleEmailContinue}>Continue</button>
          <button style={{ ...secondaryButtonStyle, background: "transparent", color: "#94a3b8" }} onClick={reset}>Back</button>
        </div>
      )}

      {step === "txn" && (
        <div style={{ textAlign: "center" }}>
          <p style={{ marginBottom: "20px", fontSize: "1.1rem" }}>
            To securely access your DigiLocker data, please approve this request.
          </p>
          <button style={{ ...primaryButtonStyle, background: "#8b5cf6", width: "100%", height: "50px" }} onClick={handleSignConsent}>
            Sign Consent Transaction
          </button>
          <button style={{ ...secondaryButtonStyle, background: "transparent", color: "#94a3b8" }} onClick={() => setStep("email")}>Back</button>
        </div>
      )}

      {step === "otp" && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p style={{ color: "#10b981", fontWeight: "bold", marginBottom: "15px", textAlign: "center" }}>
            ✅ Transaction signed successfully
          </p>
          <p style={{ fontSize: "0.7rem", color: "#64748b", wordBreak: "break-all", marginBottom: "20px", background: "#0f172a", padding: "10px", borderRadius: "8px" }}>
            Hash: {txnHash}
          </p>
          <p style={{ marginBottom: "15px" }}>A verification code has been sent to your email:</p>
          
          {/* EMAIL UI BOX */}
          <div style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "15px",
            marginTop: "10px",
            border: "2px solid #334155",
            boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)"
          }}>
            <p style={{ margin: "5px 0", fontSize: "0.9rem" }}><b>From:</b> no-reply@digilocker.gov.in</p>
            <p style={{ margin: "5px 0", fontSize: "0.9rem" }}><b>Subject:</b> Your OTP Code</p>
            <hr style={{ border: "0", borderTop: "1px solid #334155", margin: "15px 0" }}/>
            <h2 style={{ letterSpacing: "8px", textAlign: "center", fontSize: "2.5rem", color: "#34d399", margin: "20px 0" }}>
              {otp}
            </h2>
            <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#94a3b8" }}>This OTP is valid for 2 minutes</p>
          </div>

          <div style={{ marginTop: "30px" }}>
            <label style={{ marginBottom: "10px", display: "block", fontWeight: "bold" }}>Enter OTP</label>
            <input 
              style={{ ...inputStyle, textAlign: "center", fontSize: "1.5rem", letterSpacing: "5px" }}
              type="text" 
              maxLength={6}
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
            />
            <button style={{ ...primaryButtonStyle, width: "100%" }} onClick={handleVerifyOtp}>Verify</button>
          </div>
        </div>
      )}

      {step === "verified" && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "4rem", marginBottom: "20px" }}>✅</div>
          <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "10px" }}>Verification Successful</h3>
          <p style={{ color: "#94a3b8" }}>
            Secure verification successful via <strong>Stealth ZK-KYC</strong>. Your identity is now anchored.
          </p>
          <button style={{ ...primaryButtonStyle, marginTop: "30px" }} onClick={reset}>Restart</button>
        </div>
      )}

      {step === "manual" && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h3 style={{ marginBottom: "20px", fontWeight: "bold" }}>Manual Entry</h3>
          <label style={{ marginBottom: "5px", fontSize: "0.9rem", color: "#94a3b8" }}>Full Name</label>
          <input 
            style={inputStyle}
            type="text" 
            placeholder="John Doe" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label style={{ marginBottom: "5px", fontSize: "0.9rem", color: "#94a3b8" }}>Email Address</label>
          <input 
            style={inputStyle}
            type="email" 
            placeholder="email@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button style={{ ...primaryButtonStyle, background: "#f59e0b", color: "black", fontWeight: "900" }} onClick={handleManualVerify}>
            Verify Identity
          </button>
          <button style={{ ...secondaryButtonStyle, background: "transparent", color: "#94a3b8" }} onClick={reset}>Back</button>
        </div>
      )}

      {/* DEBUG PANEL */}
      <div style={{
        border: "2px dashed yellow",
        padding: "15px",
        marginTop: "40px",
        background: "rgba(255, 255, 0, 0.05)",
        borderRadius: "10px",
        fontSize: "0.8rem",
        color: "#fde047"
      }}>
        <p style={{ fontWeight: "bold", margin: "0 0 5px 0", textTransform: "uppercase" }}>Debug Panel Active</p>
        <p style={{ margin: "0" }}>Current Step: <code style={{ background: "#000", padding: "2px 6px", borderRadius: "4px" }}>{step}</code></p>
      </div>
    </div>
  );
}
