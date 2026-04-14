"use client";

import React, { useState, useEffect, useRef } from "react";
import { Shield, ShieldAlert, Terminal as TerminalIcon, BarChart3, Lock, Zap, CheckCircle2 } from "lucide-react";

export default function SybilSimulation() {
  const [usedNullifiers, setUsedNullifiers] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [attackCount, setAttackCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [currentNullifier, setCurrentNullifier] = useState<string>("");
  const [showOverlay, setShowOverlay] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const generateProof = async () => {
    addLog("Initializing proof generation...");
    await new Promise((r) => setTimeout(r, 600));
    
    // Generate a new unique nullifier
    const newNullifier = "0x" + Math.random().toString(16).substring(2, 42);
    
    setCurrentNullifier(newNullifier);
    setUsedNullifiers((prev) => [...prev, newNullifier]);
    
    addLog(`✔ Proof generated successfully`);
    addLog(`Nullifier recorded: ${newNullifier.substring(0, 12)}...`);
    addLog("System: Identity anchored. Nullifier state updated.");
  };

  const attemptAttack = async () => {
    if (usedNullifiers.length === 0) {
      addLog("⚠ Error: No proofs generated yet. Generate a proof first.");
      return;
    }

    setAttackCount((prev) => prev - 1); // We'll increment it properly after timeout
    setAttackCount((prev) => prev + 1);
    addLog("Hacker: Attempting Sybil attack...");
    addLog("Hacker: Reusing previous nullifier to bypass registry...");
    await new Promise((r) => setTimeout(r, 800));

    const reusedNullifier = usedNullifiers[0];
    addLog(`System: Checking nullifier ${reusedNullifier.substring(0, 12)}...`);
    await new Promise((r) => setTimeout(r, 600));

    // Logic implementation: nullifier reuse detection
    if (usedNullifiers.includes(reusedNullifier)) {
      setBlockedCount((prev) => prev + 1);
      addLog("⚠ Duplicate nullifier detected");
      addLog("❌ Sybil attack blocked by Cryptographic Guard");
      
      // Trigger full-screen overlay
      setShowOverlay(true);
      setTimeout(() => setShowOverlay(false), 2000);
    }
  };

  const successRate = attackCount === 0 ? 0 : Math.round(((attackCount - blockedCount) / attackCount) * 100);

  return (
    <div id="sybil-simulation" style={{
      padding: "40px",
      background: "#0f172a",
      borderRadius: "24px",
      border: "1px solid #1e293b",
      color: "white",
      maxWidth: "1000px",
      margin: "40px auto",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
    }}>
      {/* Background decoration */}
      <div style={{
        position: "absolute",
        top: "-100px",
        right: "-100px",
        width: "300px",
        height: "300px",
        background: "rgba(34,197,94,0.03)",
        borderRadius: "50%",
        filter: "blur(80px)",
        pointerEvents: "none"
      }} />

      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <div style={{ 
          display: "inline-flex", 
          alignItems: "center", 
          gap: "8px", 
          background: "rgba(34,197,94,0.1)", 
          padding: "8px 16px", 
          borderRadius: "100px", 
          color: "#4ade80",
          fontSize: "0.8rem",
          fontWeight: "900",
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginBottom: "16px",
          border: "1px solid rgba(34,197,94,0.2)"
        }}>
          <Shield className="w-4 h-4" /> Hacker Simulation Mode
        </div>
        <h2 style={{ fontSize: "2.5rem", fontWeight: "900", marginBottom: "12px", letterSpacing: "-0.05em" }}>
          Sybil Attack Attempt
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "1.1rem", maxWidth: "700px", margin: "0 auto" }}>
          Test how the system defends against duplicate identity fraud using cryptographic nullifiers.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "40px" }}>
        {/* Explanation Card */}
        <div style={{ background: "#1e293b", padding: "24px", borderRadius: "20px", border: "1px solid #334155" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "1rem", fontWeight: "bold", marginBottom: "15px", color: "#f8fafc" }}>
            <Zap className="w-5 h-5 text-amber-500" /> System Defense Logic
          </h3>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: "1.6" }}>
            A Sybil attack occurs when a user attempts to create multiple identities to exploit a system.
          </p>
          <ul style={{ listStyle: "none", padding: "0", marginTop: "15px", gap: "12px", display: "flex", flexDirection: "column" }}>
            {[
              "Each proof generates a unique nullifier from the user’s secret",
              "Nullifiers are recorded after first use",
              "Reuse of a nullifier indicates a duplicate attempt",
              "The system immediately rejects such attempts"
            ].map((text, i) => (
              <li key={i} style={{ display: "flex", gap: "10px", fontSize: "0.85rem", color: "#cbd5e1" }}>
                <span style={{ color: "#4ade80" }}>•</span> {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Analytics Card */}
        <div style={{ background: "#1e293b", padding: "24px", borderRadius: "20px", border: "1px solid #334155", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "1rem", fontWeight: "bold", marginBottom: "20px", color: "#f8fafc" }}>
              <BarChart3 className="w-5 h-5 text-blue-500" /> Attack Analytics
            </h3>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: "900" }}>Total Attacks</p>
                <p style={{ fontSize: "1.5rem", fontWeight: "900", color: "white" }}>{attackCount}</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: "900" }}>Blocked</p>
                <p style={{ fontSize: "1.5rem", fontWeight: "900", color: "#ef4444" }}>{blockedCount}</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: "900" }}>Success Rate</p>
                <p style={{ fontSize: "1.5rem", fontWeight: "900", color: successRate === 0 ? "#4ade80" : "#ef4444" }}>
                  {successRate}%
                </p>
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "60px", background: "#0f172a", borderRadius: "8px", padding: "10px" }}>
            {Array.from({ length: Math.min(attackCount, 20) }).map((_, i) => (
              <div key={i} style={{ 
                flex: 1, 
                background: i < blockedCount ? "#ef4444" : "#4ade80", 
                borderRadius: "2px", 
                height: "100%", 
                animation: "growUp 0.3s ease-out" 
              }} />
            ))}
            {attackCount === 0 && <p style={{ fontSize: "0.6rem", color: "#334155", textAlign: "center", width: "100%" }}>NO ATTACKS RECORDED</p>}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "30px" }}>
        {/* Terminal Section */}
        <div>
          <h3 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.8rem", fontWeight: "900", marginBottom: "12px", color: "#64748b", textTransform: "uppercase" }}>
            <TerminalIcon className="w-4 h-4" /> Live Attack Logs
          </h3>
          <div style={{ 
            background: "black", 
            color: "#00ff9f", 
            fontFamily: "monospace", 
            padding: "20px", 
            height: "250px", 
            overflowY: "auto", 
            borderRadius: "16px",
            border: "1px solid #1e293b",
            fontSize: "0.85rem",
            boxShadow: "inset 0 4px 6px -1px rgba(0, 0, 0, 0.4)"
          }}>
            {logs.map((log, i) => (
              <p key={i} style={{ 
                margin: "0 0 6px 0", 
                opacity: i === logs.length - 1 ? 1 : 0.6,
                transform: i === logs.length - 1 ? "translateX(4px)" : "none",
                transition: "all 0.2s"
              }}>
                <span style={{ color: "#334155" }}>{"> "}</span> {log}
              </p>
            ))}
            {logs.length === 0 && <p style={{ color: "#334155" }}>Waiting for interaction...</p>}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* Nullifier List */}
        <div>
          <h3 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.8rem", fontWeight: "900", marginBottom: "12px", color: "#64748b", textTransform: "uppercase" }}>
            <Lock className="w-4 h-4" /> Nullifier Registry
          </h3>
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", padding: "16px", borderRadius: "16px", height: "250px", overflowY: "auto" }}>
            <p style={{ fontSize: "0.7rem", color: "#475569", fontWeight: "bold", marginBottom: "10px", textTransform: "uppercase" }}>Current Nullifier</p>
            <div style={{ background: "#1e293b", padding: "8px 12px", borderRadius: "8px", fontSize: "0.75rem", fontFamily: "monospace", color: "#4ade80", marginBottom: "20px", border: "1px solid rgba(74,222,128,0.2)" }}>
              {currentNullifier || "NOT_GENERATED"}
            </div>
            
            <p style={{ fontSize: "0.7rem", color: "#475569", fontWeight: "bold", marginBottom: "10px", textTransform: "uppercase" }}>Registered Nullifiers ({usedNullifiers.length})</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {usedNullifiers.map((n, i) => (
                <div key={i} style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#94a3b8", background: "rgba(255,255,255,0.03)", padding: "4px 8px", borderRadius: "4px" }}>
                  {n}
                </div>
              ))}
              {usedNullifiers.length === 0 && <p style={{ fontSize: "0.7rem", color: "#334155" }}>Registry Empty</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "20px", marginTop: "40px" }}>
        <button 
          onClick={generateProof}
          style={{ 
            flex: 1, 
            height: "64px", 
            borderRadius: "16px", 
            background: "#10b981", 
            color: "black", 
            fontWeight: "900", 
            fontSize: "1rem", 
            border: "none", 
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "1px",
            boxShadow: "0 10px 20px -10px rgba(16, 185, 129, 0.4)",
            transition: "all 0.2s"
          }}
        >
          Generate First Proof
        </button>
        <button 
          onClick={attemptAttack}
          style={{ 
            flex: 1, 
            height: "64px", 
            borderRadius: "16px", 
            background: "transparent", 
            color: "#ef4444", 
            fontWeight: "900", 
            fontSize: "1rem", 
            border: "2px solid #ef4444", 
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "1px",
            transition: "all 0.2s"
          }}
        >
          Attempt Duplicate Proof (Attack)
        </button>
      </div>

      <div style={{ marginTop: "30px", textAlign: "center" }}>
        <p style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#4ade80", fontWeight: "bold" }}>
          <CheckCircle2 className="w-4 h-4" /> System is resistant to Sybil attacks using nullifier-based protection
        </p>
      </div>

      {/* ATTACK FAILED OVERLAY */}
      {showOverlay && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.92)",
          color: "#ef4444",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10000,
          animation: "glitch 0.2s infinite"
        }}>
          <div style={{ textAlign: "center", padding: "40px", border: "4px solid #ef4444", borderRadius: "24px", background: "rgba(239, 68, 68, 0.05)", boxShadow: "0 0 100px rgba(239, 68, 68, 0.2)" }}>
            <ShieldAlert style={{ width: "100px", height: "100px", marginBottom: "24px" }} />
            <h1 style={{ fontSize: "5rem", fontWeight: "900", margin: "0", letterSpacing: "-0.05em" }}>ATTACK FAILED</h1>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "4px", opacity: 0.8 }}>
              Sybil attempt detected and blocked
            </p>
          </div>
          
          <style>{`
            @keyframes growUp {
              from { transform: scaleY(0); transform-origin: bottom; }
              to { transform: scaleY(1); transform-origin: bottom; }
            }
            @keyframes glitch {
              0% { transform: translate(0); }
              20% { transform: translate(-5px, 5px); }
              40% { transform: translate(-5px, -5px); }
              60% { transform: translate(5px, 5px); }
              80% { transform: translate(5px, -5px); }
              100% { transform: translate(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
