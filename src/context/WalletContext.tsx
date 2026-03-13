"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { PeraWalletConnect } from "@perawallet/connect";

interface WalletContextType {
  peraWallet: PeraWalletConnect | null;
  connectedAddress: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Initializing Pera Wallet
const peraWalletInstance = typeof window !== "undefined" ? new PeraWalletConnect({
  shouldShowSignTxnToast: true
}) : null;

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  const isConnected = !!connectedAddress;

  /**
   * disconnectWallet()
   * Clears the React state, removes the wallet from localStorage,
   * and terminates the Pera Wallet session.
   */
  const handleDisconnect = useCallback(async () => {
    if (peraWalletInstance) {
      await peraWalletInstance.disconnect();
    }
    setConnectedAddress(null);
    localStorage.removeItem("walletAddress");
  }, []);

  /**
   * connectWallet()
   * Opens the Pera Wallet connection modal and allows the user to connect their Algorand wallet.
   * In this system, the wallet address serves as the user's Decentralized Identity (DID) anchor,
   * which will later be used to link generated zero-knowledge proofs to a specific account.
   */
  const handleConnect = useCallback(async () => {
    if (!peraWalletInstance) return;

    try {
      const newAccounts = await peraWalletInstance.connect();
      
      // Setup disconnect listener
      peraWalletInstance.connector?.on("disconnect", handleDisconnect);

      const address = newAccounts[0];
      setConnectedAddress(address);
      localStorage.setItem("walletAddress", address);
    } catch (error) {
      const errorString = error?.toString() || "";
      if (errorString.includes("PeraWalletConnect closed") || errorString.includes("Connect modal is closed by user")) {
        // User closed the modal, no action needed
        return;
      }
      
      console.error("Failed to connect to Pera Wallet:", error);
      alert("Could not connect to Pera Wallet. Please ensure you have the Pera Wallet app installed or the browser extension active.");
    }
  }, [handleDisconnect]);

  const reconnectSession = useCallback(async () => {
    if (!peraWalletInstance) return;

    try {
      const accounts = await peraWalletInstance.reconnectSession();
      
      if (accounts.length > 0) {
        peraWalletInstance.connector?.on("disconnect", handleDisconnect);
        setConnectedAddress(accounts[0]);
      } else {
        // If reconnect failed but we have something in localstorage, clear it
        localStorage.removeItem("walletAddress");
      }
    } catch (error) {
      console.error("Failed to reconnect session:", error);
      localStorage.removeItem("walletAddress");
    }
  }, [handleDisconnect]);

  useEffect(() => {
    // Reconnect to session on mount
    reconnectSession();

    return () => {
      // Cleanup listeners if necessary
      peraWalletInstance?.connector?.off("disconnect");
    };
  }, [reconnectSession]);

  const value = {
    peraWallet: peraWalletInstance,
    connectedAddress,
    isConnected,
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
