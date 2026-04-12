/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { AlgorandClient, microAlgos } from "@algorandfoundation/algokit-utils";
import * as algosdk from "algosdk";
import { ZkpVerifierClient } from "@/contracts/zkp_verifier/ZkpVerifierClient";
import { ShieldCheck, Loader2, CheckCircle2, ExternalLink, ArrowLeft, History, Database, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { isUserVerifiedOnChain } from "@/lib/algorand";

export default function RegisterOnChain() {
  const { address, isConnected, signTransactions } = useWallet();
  const [proofData, setProofData] = useState<any>(null);
  const [isVerifyingOnChain, setIsVerifyingOnChain] = useState(false);
  const [onChainTxId, setOnChainTxId] = useState<string | null>(null);
  const [alreadyVerified, setAlreadyVerified] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("stealth_final_proof");
    if (saved) {
      try {
        setProofData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse proof data", e);
      }
    }
  }, []);

  useEffect(() => {
    if (address && isConnected) {
      isUserVerifiedOnChain(address).then(setAlreadyVerified);
    }
  }, [address, isConnected]);

  const handleVerifyOnChain = async () => {
    if (!address || !proofData) {
      toast.error("Missing address or proof data");
      return;
    }
    setIsVerifyingOnChain(true);
    
    try {
      const verifierAppIdStr = process.env.NEXT_PUBLIC_ZKP_VERIFIER_APP_ID;
      const registryAppIdStr = process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_APP_ID;
      
      if (!verifierAppIdStr) throw new Error("Verifier App ID not configured (checked NEXT_PUBLIC_ZKP_VERIFIER_APP_ID)");

      const parsed = proofData;

      // Helper to pad numeric strings to 32-byte BE Uint8Array
      const padTo32Bytes = (val: string | bigint): Uint8Array => {
        let hex = BigInt(val).toString(16);
        if (hex.length % 2 !== 0) hex = '0' + hex;
        const bytes = new Uint8Array(Buffer.from(hex, 'hex'));
        const res = new Uint8Array(32);
        res.set(bytes, 32 - bytes.length);
        return res;
      };

      const pA = parsed.proof.pi_a;
      const pB = parsed.proof.pi_b;
      const pC = parsed.proof.pi_c;

      // Pack proof A, B, C into 256 bytes
      const packedProof = new Uint8Array(256);
      packedProof.set(padTo32Bytes(pA[0]), 0);
      packedProof.set(padTo32Bytes(pA[1]), 32);
      packedProof.set(padTo32Bytes(pB[0][0]), 64);
      packedProof.set(padTo32Bytes(pB[0][1]), 96);
      packedProof.set(padTo32Bytes(pB[1][0]), 128);
      packedProof.set(padTo32Bytes(pB[1][1]), 160);
      packedProof.set(padTo32Bytes(pC[0]), 192);
      packedProof.set(padTo32Bytes(pC[1]), 224);

      const sigs = parsed.publicSignals || parsed.publicInputs;
      const packedSignals = new Uint8Array(96);
      if (sigs && sigs.length >= 3) {
         packedSignals.set(padTo32Bytes(sigs[0]), 0);
         packedSignals.set(padTo32Bytes(sigs[1]), 32);
         packedSignals.set(padTo32Bytes(sigs[2]), 64);
      } else {
         throw new Error("Invalid public signals array.");
      }

      const nullifierHex = sigs ? BigInt(sigs[1]).toString(16).padStart(64, "0") : "";
      
      if (!nullifierHex) throw new Error("Nullifier not found in proof data.");

      const identityHashHex = parsed.hash || parsed.identityHash || "";
      const oracleDataHex = parsed.oracleDataHex;
      let oracleData: Uint8Array;
      
      if (oracleDataHex) {
        oracleData = new Uint8Array(Buffer.from(oracleDataHex, "hex"));
      } else {
        // Fallback: This is rare as oracleDataHex should be in localStorage
        throw new Error("Missing oracle metadata. Please re-generate your proof.");
      }

      const oraclePubKey = process.env.NEXT_PUBLIC_ORACLE_PUBKEY || "";
      const oraclePubKeys = [new Uint8Array(Buffer.from(oraclePubKey, "hex"))];
      // Oracle API returns HEX by default for signature now
      const sigHex = parsed.oracleSignature || parsed.signature || "";
      const oracleSignatures = [new Uint8Array(Buffer.from(sigHex, "hex"))];

      // 1. Initialize Client
      const algorand = AlgorandClient.testNet();
      algorand.setSigner(address, async (group: any, indexes: number[]) => {
        const signed = await signTransactions(group, indexes);
        return signed.map(s => s!) as Uint8Array[];
      });
      
      const client = new ZkpVerifierClient({
        algorand,
        appId: BigInt(verifierAppIdStr),
        defaultSender: address
      });

      // 2. Prepare Boxes
      const nullifierBytes = new Uint8Array(Buffer.from(nullifierHex, "hex"));
      const nullifierBoxName = new Uint8Array(1 + nullifierBytes.length);
      nullifierBoxName[0] = 0x6e; // 'n'
      nullifierBoxName.set(nullifierBytes, 1);

      const oraclePubKeyBytes = new Uint8Array(Buffer.from(oraclePubKey, "hex"));
      const oracleBoxName = new Uint8Array(2 + oraclePubKeyBytes.length);
      oracleBoxName[0] = 0x61; // 'a'
      oracleBoxName[1] = 0x6f; // 'o'
      oracleBoxName.set(oraclePubKeyBytes, 2);

      let registryBoxName = new Uint8Array(0);
      if (registryAppIdStr) {
        const registryAppId = parseInt(registryAppIdStr);
        const walletBytes = algosdk.decodeAddress(address).publicKey;
        const registryAppInfo = await algorand.client.algod.getApplicationByID(registryAppId).do();
        const secState = (registryAppInfo.params.globalState || []).find((s: any) => s.key === "c2Vj");
        let appSecret = new Uint8Array(0);
        if (secState && secState.value && secState.value.bytes) {
            const rawSecret = secState.value.bytes;
            appSecret = (typeof rawSecret === "string" ? algosdk.base64ToBytes(rawSecret) : rawSecret) as any;
        }
        const combined = new Uint8Array(walletBytes.length + appSecret.length);
        combined.set(walletBytes);
        combined.set(appSecret, walletBytes.length);
        const stealthHash = await window.crypto.subtle.digest("SHA-256", combined);
        const stealthKey = new Uint8Array(stealthHash);
        registryBoxName = new Uint8Array(1 + stealthKey.length);
        registryBoxName[0] = 0x76; // 'v'
        registryBoxName.set(stealthKey, 1);
      }

      // 3. Call Contract
      const composer = algorand.newGroup();

      const verifyCall = await client.params.verifyAndRegister({
        args: {
            proof: packedProof,
            publicInputs: packedSignals,
            oracleData: oracleData,
            oraclePubKeys: oraclePubKeys,
            oracleSignatures: oracleSignatures,
            proofId: identityHashHex || "manual_reg"
        },
        appReferences: registryAppIdStr ? [BigInt(registryAppIdStr)] : [],
        boxReferences: [
           { appId: BigInt(verifierAppIdStr), name: nullifierBoxName },
           { appId: BigInt(verifierAppIdStr), name: oracleBoxName },
           ...(registryAppIdStr ? [{ appId: BigInt(registryAppIdStr), name: registryBoxName }] : [])
        ],
        extraFee: microAlgos(80000), // Increased fee for up to 80 OpUp inner txns just to be absolutely safe
      });

      composer.addAppCallMethodCall(verifyCall);

      const result = await composer.send();
      const txId = result.transactions[result.transactions.length - 1].txID();
      setOnChainTxId(txId);
      
      localStorage.setItem("stealth_final_proof", JSON.stringify({ ...parsed, txId: txId }));
      toast.success("Identity Registered On-Chain! 🚀");
    } catch (err: any) {
      console.error("On-Chain Registration Error:", err);
      toast.error("Registration Failed: " + (err.message || "Unknown error"));
    } finally {
      setIsVerifyingOnChain(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass-card max-w-2xl mx-auto">
        <ShieldCheck className="w-16 h-16 text-zinc-700 mb-6" />
        <h2 className="text-2xl font-black uppercase mb-4">Connect Wallet</h2>
        <p className="text-zinc-500 text-center mb-8 font-bold uppercase tracking-tight">You must connect your Algorand wallet to proceed with on-chain registration.</p>
        <Link href="/kyc" className="btn-premium btn-green px-8 py-3 rounded-full font-black uppercase tracking-widest text-sm">Return to KYC</Link>
      </div>
    );
  }

  if (!proofData && !alreadyVerified) {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass-card max-w-2xl mx-auto">
        <History className="w-16 h-16 text-zinc-700 mb-6" />
        <h2 className="text-2xl font-black uppercase mb-4">No Proof Found</h2>
        <p className="text-zinc-500 text-center mb-8 font-bold uppercase tracking-tight">Please complete the ZK proof generation before attempting to register on-chain.</p>
        <Link href="/kyc" className="btn-premium btn-green px-8 py-3 rounded-full font-black uppercase tracking-widest text-sm">Start KYC Flow</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 md:p-16 relative overflow-hidden text-center"
      >
        <div className="absolute top-0 right-0 p-8">
            <ShieldCheck className="w-32 h-32 text-emerald-500/5 rotate-12" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center mb-8 border border-emerald-500/20">
                {onChainTxId || alreadyVerified ? <CheckCircle2 className="w-10 h-10 text-emerald-500" /> : <Database className="w-10 h-10 text-emerald-500" />}
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-6">
                On-Chain <span className="text-emerald-500">Registration</span>
            </h1>
            
            <p className="text-xl text-zinc-400 max-w-2xl font-bold uppercase tracking-tight mb-12">
               {alreadyVerified 
                 ? "You are already registered on the Algorand Testnet. Your identity is cryptographically anchored." 
                 : "Finalize your identity by anchoring your ZK proof hash to the Algorand blockchain. This makes your verification reusable across the ecosystem."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-12">
                <div className="bg-black/40 border border-white/5 p-6 rounded-2xl text-left">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em] block mb-2">Connected Address</span>
                    <span className="text-xs font-mono text-emerald-500/80 truncate block">{address}</span>
                </div>
                <div className="bg-black/40 border border-white/5 p-6 rounded-2xl text-left">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em] block mb-2">Network</span>
                    <span className="text-xs font-mono text-emerald-500/80 truncate block">Algorand Testnet</span>
                </div>
            </div>

            {(onChainTxId || alreadyVerified) ? (
                <div className="space-y-6 w-full max-w-2xl">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-3xl text-left flex items-start gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div className="space-y-2">
                             <h4 className="font-black text-emerald-500 uppercase tracking-widest text-sm">Successfully Verified</h4>
                             <p className="text-zinc-400 text-xs font-bold leading-relaxed">
                                Your ZK proof has been verified by the smart contract and your nullifier is now immutable.
                             </p>
                             <a 
                                href={`https://testnet.explorer.perawallet.app/tx/${onChainTxId || alreadyVerified}`}
                                target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-xs font-black uppercase tracking-widest pt-2"
                             >
                                View on Explorer <ExternalLink className="w-3 h-3" />
                             </a>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link href="/explorer" className="w-full btn-premium btn-green h-14 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2">
                            View Identity Registry <ArrowLeft className="w-4 h-4 rotate-180" />
                        </Link>
                        <Link href="/" className="w-full px-8 h-14 border border-zinc-800 rounded-2xl flex items-center justify-center font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:border-zinc-700 transition-all">
                            Back Home
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 w-full max-w-2xl">
                    <div className="bg-blue-500/5 border border-blue-500/10 p-8 rounded-3xl text-left flex items-start gap-6">
                         <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Cpu className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="space-y-2">
                             <h4 className="font-black text-blue-500 uppercase tracking-widest text-sm">Compute Requirements</h4>
                             <p className="text-zinc-500 text-xs font-bold leading-relaxed">
                                On-chain ZK verification is computationally intensive. We will send a group of 16 transactions to provide enough opcode budget for the BN254 pairing check.
                             </p>
                        </div>
                    </div>

                    <button 
                        onClick={handleVerifyOnChain}
                        disabled={isVerifyingOnChain}
                        className="w-full btn-premium btn-green h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-lg flex items-center justify-center gap-4 relative overflow-hidden group shadow-[0_0_40px_rgba(52,211,153,0.3)]"
                    >
                        {isVerifyingOnChain ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span>Verifying Proof...</span>
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-6 h-6" />
                                <span>Anchor Identity on Algorand</span>
                            </>
                        )}
                    </button>
                    
                    <Link href="/kyc" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors">
                        <ArrowLeft className="w-3 h-3" /> Back to Proof Details
                    </Link>
                </div>
            )}
        </div>
      </motion.div>
    </div>
  );
}
