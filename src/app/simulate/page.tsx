"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Fingerprint, Database, Zap, Lock, Skull, CheckCircle2, ChevronDown, ArrowRight, FileJson, X, ExternalLink, Info } from "lucide-react";
import { GlowingCard } from "@/components/ui/glowing-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useWallet } from "@/hooks/useWallet";
import PageWrapper from "@/components/layout/PageWrapper";

const APP_ID = process.env.NEXT_PUBLIC_APP_ID ?? "12345";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function SimulatePage() {
  const { isConnected, connectWallet, address } = useWallet();
  const [activeTab, setActiveTab] = useState<"nullifier" | "sybil" | "forge">("nullifier");

  // Sybil state
  const [sybilLogs, setSybilLogs] = useState<{ text: string; type: "info" | "success" | "error" }[]>([]);
  const [sybilStatus, setSybilStatus] = useState<"idle" | "running" | "done">("idle");
  const sybilLogRef = useRef<HTMLDivElement>(null);

  // Forge state
  const [forgeLogs, setForgeLogs] = useState<{ text: string; type: "info" | "success" | "error" }[]>([]);
  const [forgeStatus, setForgeStatus] = useState<"idle" | "running" | "done">("idle");
  const [forgedPiA, setForgedPiA] = useState('["0x1a2b3c4d...","0x5e6f7a8b...","0x1"]');
  const forgeLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sybilLogRef.current) sybilLogRef.current.scrollTop = sybilLogRef.current.scrollHeight;
  }, [sybilLogs]);

  useEffect(() => {
    if (forgeLogRef.current) forgeLogRef.current.scrollTop = forgeLogRef.current.scrollHeight;
  }, [forgeLogs]);

  const addSybilLog = (text: string, type: "info" | "success" | "error" = "info") =>
    setSybilLogs(p => [...p, { text, type }]);

  const addForgeLog = (text: string, type: "info" | "success" | "error" = "info") =>
    setForgeLogs(p => [...p, { text, type }]);

  const simulateSybilAttack = async () => {
    if (!isConnected) { toast.error("Connect a wallet to simulate the attack."); return; }
    setSybilStatus("running");
    setSybilLogs([]);
    await sleep(300);

    addSybilLog("> Connecting burner wallet...");
    await sleep(600);
    addSybilLog(`> Wallet: ${address?.slice(0, 12)}... (Burner)`);
    await sleep(500);
    addSybilLog("> Loading stolen identity data (Aadhaar_User_789)...");
    await sleep(800);
    addSybilLog("> Running snarkjs.groth16.fullProve()...", "info");
    await sleep(1500);
    addSybilLog("> ZK Proof generated — mathematically valid!", "success");
    await sleep(500);
    addSybilLog("> Submitting AppCall to Algorand Smart Contract...", "info");
    await sleep(1200);
    addSybilLog("--- ALGORAND SMART CONTRACT REJECTS ---", "error");
    await sleep(300);
    addSybilLog("> Checking Nullifier Box: sha256(UserSecret, AppId)...", "error");
    await sleep(500);
    addSybilLog("> ERROR: Box already exists! Nullifier collision detected.", "error");
    await sleep(300);
    addSybilLog("> TRANSACTION REJECTED. LogicEval.Error code: 0x01", "error");

    setSybilStatus("done");
    toast.success("Nullifier protection blocked the Sybil attack!");
  };

  const simulateForgeAttack = async () => {
    if (!isConnected) { toast.error("Connect a wallet to simulate the attack."); return; }
    setForgeStatus("running");
    setForgeLogs([]);
    await sleep(300);

    addForgeLog("> Crafting invalid ZK SNARK payload...");
    await sleep(500);
    addForgeLog(`> pi_a: ${forgedPiA.slice(0, 40)}...`);
    await sleep(400);
    addForgeLog("> Encoding ABI arguments (byte[][][])...");
    await sleep(700);
    addForgeLog("> Broadcasting AppCall to Algorand Testnet...", "info");
    await sleep(1000);
    addForgeLog("> AVM executing: op.EllipticCurve.pairingCheck()...", "info");
    await sleep(1300);
    addForgeLog("--- ON-CHAIN PAIRING CHECK FAILS ---", "error");
    await sleep(300);
    addForgeLog("> e(-πA, πB) + e(α,β) + e(vkx,γ) + e(πC,δ) ≠ 0", "error");
    await sleep(400);
    addForgeLog("> Assert failed. Cryptographic proof is invalid.", "error");
    await sleep(300);
    addForgeLog("> TRANSACTION REJECTED. Cost: 0.002 ALGO wasted.", "error");

    setForgeStatus("done");
    toast.success("On-chain pairing check rejected the forged proof!");
  };

  const logColor = (type: "info" | "success" | "error") =>
    type === "success" ? "text-emerald-400" : type === "error" ? "text-red-400" : "text-zinc-400";

  return (
    <PageWrapper>
      <div className="container max-w-6xl pt-12 pb-24 px-4 mx-auto min-h-screen relative">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
        <div className="inline-flex items-center justify-center p-4 bg-red-500/10 rounded-full mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <Skull className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase">
          Attack <span className="text-red-500">Simulator</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto italic">
          See how cryptography and Algorand smart contracts defend against active Sybil attacks and forged ZK proofs — live.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <a
            href={`https://testnet.explorer.perawallet.com/application/${APP_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> View Smart Contract on Algorand
          </a>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {[
          { key: "nullifier", label: "What is a Nullifier?", Icon: Fingerprint, color: "primary" },
          { key: "sybil", label: "Sybil Attack", Icon: ShieldAlert, color: "red" },
          { key: "forge", label: "Forged Proof", Icon: FileJson, color: "purple" },
        ].map(({ key, label, Icon, color }) => (
          <Button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`h-12 px-6 rounded-2xl font-black uppercase tracking-wide transition-all text-sm ${
              activeTab === key
                ? color === "primary"
                  ? "bg-primary text-black shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                  : color === "red"
                  ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] border-red-500"
                  : "bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] border-purple-500"
                : "bg-black/40 border border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4 mr-2 inline" />{label}
          </Button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {/* ── TAB: NULLIFIER ─────────────────────────────────────────── */}
          {activeTab === "nullifier" && (
            <GlowingCard glowColor="primary" className="p-px">
            <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
                  <div className="space-y-5">
                    <h2 className="text-3xl font-black uppercase tracking-tight text-white">
                      The Magic of <span className="text-primary">Nullifiers</span>
                    </h2>
                    <p className="text-zinc-400 leading-relaxed">
                      In a ZK system, identities are hidden. But how can the blockchain prevent a user from
                      registering <em>the same identity</em> on multiple wallets — a classic <strong>Sybil attack</strong>?
                    </p>
                    <p className="text-zinc-400 leading-relaxed">
                      The solution is a <strong className="text-white">Nullifier</strong>: a one-way, deterministic hash
                      computed inside the ZK circuit from the user's secret and the App ID.
                      The smart contract stores this hash in an Algorand <strong className="text-primary">Box</strong>.
                      If the box already exists → transaction rejected.
                    </p>
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 100% Privacy Preserved
                      </p>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        The nullifier reveals <strong>nothing</strong> about the real identity — only that
                        "some unique ID was used once". Casual chain analysis cannot reverse it.
                      </p>
                    </div>
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Nullifier Formula (inside Circuit)</p>
                      <code className="font-mono text-sm text-white">
                        Nullifier = Poseidon(<span className="text-purple-400">UserSecret</span>, <span className="text-emerald-400">AppId</span>)
                      </code>
                    </div>
                  </div>

                  {/* Visual Diagram */}
                  <div className="bg-black/60 border border-white/5 rounded-3xl p-8 flex flex-col items-center gap-5 shadow-2xl">
                    <div className="flex gap-4 items-center w-full justify-center">
                      {[
                        { Icon: Fingerprint, label: "User Secret", sublabel: "(Private Input)", color: "blue" },
                        { Icon: Zap, label: "App ID", sublabel: "(Public Input)", color: "purple" },
                      ].map(({ Icon, label, sublabel, color }) => (
                        <div key={label} className="flex flex-col items-center gap-2 w-2/5">
                          <div className={`w-14 h-14 bg-${color}-500/10 border border-${color}-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]`}>
                            <Icon className={`w-6 h-6 text-${color}-400`} />
                          </div>
                          <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 text-center">{label}<br/><span className="text-zinc-600">{sublabel}</span></span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col items-center text-zinc-600 w-full">
                      <div className="w-px h-6 bg-gradient-to-b from-zinc-700 to-transparent" />
                      <ChevronDown className="w-4 h-4" />
                      <span className="text-[9px] uppercase font-black tracking-widest my-1 text-zinc-500">Poseidon Hash inside ZK Circuit</span>
                      <div className="w-px h-6 bg-gradient-to-t from-zinc-700 to-transparent" />
                    </div>

                    <div className="w-full bg-primary/10 border border-primary/30 rounded-2xl p-4 text-center shadow-[0_0_30px_rgba(52,211,153,0.15)]">
                      <p className="text-primary font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                        <Database className="w-4 h-4" /> 32-Byte Nullifier
                      </p>
                      <p className="font-mono text-[10px] text-zinc-500 mt-2 break-all">0x4a8b9c2fe3d1a5...</p>
                    </div>

                    <div className="w-full border-t border-white/5 pt-4 flex flex-col items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-zinc-600 rotate-90" />
                      <div className="w-full bg-slate-900 border border-white/5 rounded-2xl p-3 text-center">
                        <p className="text-[9px] uppercase font-black tracking-widest text-zinc-500">Stored in Algorand Box</p>
                        <p className="font-mono text-[10px] text-zinc-600 mt-1">{"box[\"nullifier_{hash}\"] = true"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlowingCard>
          )}

          {/* ── TAB: SYBIL ATTACK ────────────────────────────────────────── */}
          {activeTab === "sybil" && (
            <GlowingCard glowColor="destructive" className="p-px">
            <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="grid md:grid-cols-2 gap-12 items-start relative z-10">
                  <div className="space-y-5">
                    <Badge className="bg-red-500/10 text-red-400 border-red-500/20 font-black uppercase tracking-widest text-[10px] px-3 py-1">
                      <ShieldAlert className="w-3 h-3 mr-1 inline" /> Attack Vector
                    </Badge>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-white">
                      Sybil Attack<br/><span className="text-red-500">(Clone Identity)</span>
                    </h2>
                    <p className="text-zinc-400 leading-relaxed">
                      A hacker steals Aadhaar/PAN data of a verified user. They connect a <strong className="text-white">new burner wallet</strong> and attempt to
                      generate a fresh, mathematically valid ZK Proof to pass KYC — bypassing the protocol.
                    </p>
                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 space-y-3">
                      <p className="text-xs font-black text-red-400 uppercase tracking-widest">Hacker's Path:</p>
                      {[
                        "Steal real PII (Aadhaar, PAN)",
                        "Connect a new burner Algorand Wallet",
                        "Run snarkjs locally → Proof is VALID",
                        "Submit AppCall → BLOCKED by Nullifier Box",
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${i === 3 ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"}`}>{i + 1}</div>
                          <span className={i === 3 ? "text-emerald-400 font-bold" : "text-zinc-300"}>{step}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href={`https://testnet.explorer.perawallet.com/application/${APP_ID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs text-primary hover:underline font-bold uppercase tracking-widest"
                    >
                      <ExternalLink className="w-3 h-3" /> View KycAnchor Contract on Algorand Testnet
                    </a>
                  </div>

                  {/* Console */}
                  <div className="bg-black/70 border border-red-500/20 rounded-3xl p-6 flex flex-col gap-4 shadow-[0_0_40px_rgba(239,68,68,0.1)]">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-500 font-mono">Hacker Console</span>
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/70" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                        <div className="w-3 h-3 rounded-full bg-green-500/70" />
                      </div>
                    </div>

                    <div
                      ref={sybilLogRef}
                      className="h-56 overflow-y-auto font-mono text-xs space-y-1.5 pr-2"
                      style={{ scrollbarWidth: "thin", scrollbarColor: "#ef444430 transparent" }}
                    >
                      {sybilLogs.length === 0 && (
                        <p className="text-zinc-600 italic">Waiting for payload execution...</p>
                      )}
                      {sybilLogs.map((l, i) => (
                        <motion.p
                          key={i}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={logColor(l.type)}
                        >
                          {l.text}
                        </motion.p>
                      ))}
                    </div>

                    {sybilStatus === "done" && (
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <p className="text-xs font-bold text-emerald-400">Nullifier Box protection worked. Attack failed.</p>
                      </div>
                    )}

                    <Button
                      onClick={sybilStatus === "done" ? () => { setSybilStatus("idle"); setSybilLogs([]); } : simulateSybilAttack}
                      disabled={sybilStatus === "running"}
                      className={`w-full h-12 font-black tracking-widest uppercase rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 ${
                        sybilStatus === "done"
                          ? "bg-zinc-700 hover:bg-zinc-600 text-white"
                          : "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                      }`}
                    >
                      {sybilStatus === "running" ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Running Attack...
                        </span>
                      ) : sybilStatus === "done" ? "Reset Simulation" : "Execute Sybil Attack"}
                    </Button>
                  </div>
                </div>
              </div>
            </GlowingCard>
          )}

          {/* ── TAB: FORGED ZK PROOF ─────────────────────────────────────── */}
          {activeTab === "forge" && (
            <GlowingCard glowColor="none" className="p-px border border-purple-500/20">
            <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="grid md:grid-cols-2 gap-12 items-start relative z-10">
                  <div className="space-y-5">
                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 font-black uppercase tracking-widest text-[10px] px-3 py-1">
                      <FileJson className="w-3 h-3 mr-1 inline" /> Attack Vector
                    </Badge>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-white">
                      Forged<br/><span className="text-purple-500">ZK Payload</span>
                    </h2>
                    <p className="text-zinc-400 leading-relaxed">
                      Instead of generating a real proof, the hacker crafts a random byte array that looks like a ZK proof
                      and submits it directly to the smart contract via the Algorand CLI, bypassing the backend entirely.
                    </p>
                    <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-5">
                      <p className="text-xs font-black text-purple-400 uppercase tracking-widest mb-3">The On-Chain Defense:</p>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        The AVM executes <code className="bg-black/60 px-2 py-0.5 rounded text-primary border border-white/5 text-xs">op.EllipticCurve.pairingCheck</code> directly.
                        The math is: <code className="text-purple-300 text-xs">e(-πA,πB) + e(α,β) + e(vk_x,γ) + e(πC,δ) == 0</code>.
                        A forged payload fails this equation — the transaction is hard-rejected by the Algorand VM with zero possibility of bypass.
                      </p>
                    </div>
                  </div>

                  {/* Console */}
                  <div className="bg-black/70 border border-purple-500/20 rounded-3xl p-6 flex flex-col gap-4 shadow-[0_0_40px_rgba(168,85,247,0.1)]">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-500 font-mono">AVM Console</span>
                      <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 font-mono text-[9px] uppercase">ZkpVerifier.algo.ts</Badge>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-purple-400">Modify Proof Payload (pi_a)</label>
                      <textarea
                        value={forgedPiA}
                        onChange={(e) => setForgedPiA(e.target.value)}
                        className="w-full h-20 bg-black/60 border border-purple-500/30 rounded-xl p-3 font-mono text-xs text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
                      />
                    </div>

                    <div
                      ref={forgeLogRef}
                      className="h-40 overflow-y-auto font-mono text-xs space-y-1.5 pr-2"
                      style={{ scrollbarWidth: "thin", scrollbarColor: "#a855f730 transparent" }}
                    >
                      {forgeLogs.length === 0 && (
                        <p className="text-zinc-600 italic">Ready to submit invalid mathematical proof...</p>
                      )}
                      {forgeLogs.map((l, i) => (
                        <motion.p key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className={logColor(l.type)}>
                          {l.text}
                        </motion.p>
                      ))}
                    </div>

                    {forgeStatus === "done" && (
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <p className="text-xs font-bold text-emerald-400">Pairing check failed on-chain. Forged proof rejected.</p>
                      </div>
                    )}

                    <Button
                      onClick={forgeStatus === "done" ? () => { setForgeStatus("idle"); setForgeLogs([]); } : simulateForgeAttack}
                      disabled={forgeStatus === "running"}
                      className={`w-full h-12 font-black tracking-widest uppercase rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 ${
                        forgeStatus === "done"
                          ? "bg-zinc-700 hover:bg-zinc-600 text-white"
                          : "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                      }`}
                    >
                      {forgeStatus === "running" ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...
                        </span>
                      ) : forgeStatus === "done" ? "Reset Payload" : "Submit Forged ZK Proof"}
                    </Button>
                  </div>
                </div>
              </div>
            </GlowingCard>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Info Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-16 bg-black/40 border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-4 backdrop-blur-sm"
      >
        <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 flex-shrink-0">
          <Info className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm text-zinc-400 text-center md:text-left leading-relaxed">
          These attacks are mathematically impossible to execute successfully against the Stealth ZK-KYC protocol.
          The Algorand Virtual Machine (AVM 11) verifies the elliptic curve pairing directly in the smart contract execution layer — no server involved.
        </p>
        <a
          href={`https://testnet.explorer.perawallet.com/application/${APP_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full hover:bg-primary/20 transition-colors"
        >
          <ExternalLink className="w-3 h-3" /> Verify On-Chain
        </a>
      </motion.div>
      </div>
    </PageWrapper>
  );
}
