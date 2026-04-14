"use client";

import React, { useEffect } from "react";

interface ProofExplorerProps {
  proof?: any;
}

export const ProofExplorer: React.FC<ProofExplorerProps> = ({ proof }) => {
  useEffect(() => {
    console.log("ProofExplorer rendered", proof);
  }, [proof]);

  const commitment = proof?.commitment || "demo_value";

  return (
    <div 
      id="proof-explorer-debug"
      style={{
        padding: "20px", 
        border: "4px solid red",
        background: "#111",
        color: "white",
        margin: "20px 0",
        borderRadius: "12px",
        zIndex: 9999,
        position: "relative"
      }}
    >
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "15px", color: "red" }}>
        Proof Explorer (Debug Mode)
      </h2>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <p style={{ fontFamily: "monospace", background: "#222", padding: "8px", borderRadius: "4px", border: "1px solid #444" }}>
          <strong>Commitment:</strong> {commitment}
        </p>
        
        <button 
          onClick={() => {
            navigator.clipboard.writeText(commitment);
            console.log("Commitment copied!");
          }}
          style={{
            background: "#34d399",
            color: "black",
            padding: "10px 20px",
            borderRadius: "8px",
            fontWeight: "900",
            cursor: "pointer",
            width: "fit-content",
            border: "none",
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}
        >
          Copy Commitment
        </button>
      </div>

      <div style={{ marginTop: "15px", fontSize: "0.8rem", opacity: 0.8 }}>
        <p>Status: {proof ? "✅ Proof Loaded" : "⚠️ No Proof Object Provided"}</p>
        {proof && (
          <pre style={{ 
            overflowX: "auto", 
            background: "#000", 
            padding: "12px", 
            marginTop: "10px", 
            borderRadius: "6px",
            border: "1px solid #333",
            fontSize: "0.7rem"
          }}>
            {JSON.stringify(proof, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default ProofExplorer;
