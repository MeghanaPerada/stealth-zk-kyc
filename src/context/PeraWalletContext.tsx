"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { PeraWalletConnect } from "@perawallet/connect";

const peraWallet = new PeraWalletConnect();

interface PeraWalletContextType {
  accountAddress: string | null;
  isConnected: boolean;
  handleConnectWalletClick: () => Promise<void>;
  handleDisconnectWalletClick: () => void;
}

const PeraWalletContext = createContext<PeraWalletContextType | undefined>(undefined);

export const PeraWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const isConnected = !!accountAddress;

  useEffect(() => {
    // Reconnect to the session when the component is mounted
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts.length) {
          setAccountAddress(accounts[0]);
        }
        peraWallet.connector?.on("disconnect", handleDisconnectWalletClick);
      })
      .catch((e) => {
        console.error("Reconnect error", e);
      });
  }, []);

  const handleConnectWalletClick = async () => {
    try {
      const newAccounts = await peraWallet.connect();
      setAccountAddress(newAccounts[0]);
      peraWallet.connector?.on("disconnect", handleDisconnectWalletClick);
    } catch (e) {
      if (e instanceof Error && e.message !== "The user rejected the request.") {
        console.error("Connect error", e);
      }
    }
  };

  const handleDisconnectWalletClick = () => {
    peraWallet.disconnect();
    setAccountAddress(null);
  };

  return (
    <PeraWalletContext.Provider
      value={{
        accountAddress,
        isConnected,
        handleConnectWalletClick,
        handleDisconnectWalletClick,
      }}
    >
      {children}
    </PeraWalletContext.Provider>
  );
};

export const usePeraWallet = () => {
  const context = useContext(PeraWalletContext);
  if (context === undefined) {
    throw new Error("usePeraWallet must be used within a PeraWalletProvider");
  }
  return context;
};
