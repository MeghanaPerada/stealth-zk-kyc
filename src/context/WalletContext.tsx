"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// Dynamically import PeraWalletConnect only on client side
let peraWalletInstance: any = null;

if (typeof window !== "undefined") {
  try {
    const { PeraWalletConnect } = require("@perawallet/connect");
    peraWalletInstance = new PeraWalletConnect({ shouldShowSignTxnToast: true });
  } catch (e) {
    console.warn("Pera Wallet SDK not available, demo mode only.");
  }
}

interface WalletContextType {
  peraWallet: any | null;
  connectedAddress: string | null;
  isConnected: boolean;
  isDemoMode: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

/**
 * Generate a realistic-looking Algorand Testnet address for demo purposes.
 */
function generateDemoAddress(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let address = "";
  for (let i = 0; i < 58; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const isConnected = !!connectedAddress;

  const handleDisconnect = useCallback(async () => {
    if (peraWalletInstance && !isDemoMode) {
      try {
        await peraWalletInstance.disconnect();
      } catch (e) {
        // ignore disconnect errors
      }
    }
    setConnectedAddress(null);
    setIsDemoMode(false);
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("walletDemoMode");
  }, [isDemoMode]);

  /**
   * connectWallet()
   * Tries Pera Wallet first. If that fails or the user closes the modal,
   * falls back to Demo Mode with a simulated Algorand address.
   */
  const handleConnect = useCallback(async () => {
    // Try Pera Wallet first
    if (peraWalletInstance) {
      try {
        const newAccounts = await peraWalletInstance.connect();
        peraWalletInstance.connector?.on("disconnect", handleDisconnect);
        const address = newAccounts[0];
        setConnectedAddress(address);
        setIsDemoMode(false);
        localStorage.setItem("walletAddress", address);
        localStorage.removeItem("walletDemoMode");
        return;
      } catch (error) {
        // User closed the modal or connection failed — fall through to demo mode
        console.log("Pera Wallet connection cancelled, activating demo mode...");
      }
    }

    // Fallback: Demo Mode
    const demoAddr = generateDemoAddress();
    setConnectedAddress(demoAddr);
    setIsDemoMode(true);
    localStorage.setItem("walletAddress", demoAddr);
    localStorage.setItem("walletDemoMode", "true");
  }, [handleDisconnect]);

  const reconnectSession = useCallback(async () => {
    // Check localStorage for a saved demo session
    const savedDemo = localStorage.getItem("walletDemoMode");
    const savedAddr = localStorage.getItem("walletAddress");

    if (savedDemo === "true" && savedAddr) {
      setConnectedAddress(savedAddr);
      setIsDemoMode(true);
      return;
    }

    // Try reconnecting to a real Pera session
    if (peraWalletInstance) {
      try {
        const accounts = await peraWalletInstance.reconnectSession();
        if (accounts.length > 0) {
          peraWalletInstance.connector?.on("disconnect", handleDisconnect);
          setConnectedAddress(accounts[0]);
        } else {
          localStorage.removeItem("walletAddress");
        }
      } catch (error) {
        console.error("Failed to reconnect session:", error);
        localStorage.removeItem("walletAddress");
      }
    }
  }, [handleDisconnect]);

  useEffect(() => {
    reconnectSession();
    return () => {
      peraWalletInstance?.connector?.off("disconnect");
    };
  }, [reconnectSession]);

  const value = {
    peraWallet: peraWalletInstance,
    connectedAddress,
    isConnected,
    isDemoMode,
    connectWallet: handleConnect,
    disconnectWallet: handleDisconnect,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return context;
};

