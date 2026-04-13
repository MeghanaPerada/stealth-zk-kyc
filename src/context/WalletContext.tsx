"use client";

import React, { createContext, useContext } from "react";
import { NetworkId, WalletId, WalletManager, WalletProvider as BaseWalletProvider } from '@txnlab/use-wallet-react';
import { WalletUIProvider } from '@txnlab/use-wallet-ui-react';
import '@txnlab/use-wallet-ui-react/dist/style.css';

// Initialize WalletManager following the requested starter implementation
const walletManager = new WalletManager({
  wallets: [
    WalletId.PERA,
    WalletId.DEFLY,
    {
      id: WalletId.LUTE,
      options: { siteName: "Stealth ZK-KYC" }
    }
  ],
  defaultNetwork: NetworkId.TESTNET,
});

interface WalletContextType {
  connectedAddress: string | null;
  isConnected: boolean;
  isDemoMode: boolean;
  connectWallet: () => void; // Trigger for WalletUI
  disconnectWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Note: We use the context to manage "Demo Mode" specifically, 
  // while real wallets are managed by BaseWalletProvider.
  
  const handleConnect = () => {
    window.dispatchEvent(new CustomEvent("open-wallet-modal"));
  };

  const handleDisconnect = async () => {
    console.log("Disconnect triggered");
  };

  const value = {
    connectedAddress: null,
    isConnected: false,
    isDemoMode: false,
    connectWallet: handleConnect,
    disconnectWallet: handleDisconnect,
  };

  return (
    <BaseWalletProvider manager={walletManager}>
      <WalletUIProvider>
        <WalletContext.Provider value={value}>
          {children}
        </WalletContext.Provider>
      </WalletUIProvider>
    </BaseWalletProvider>
  );
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return context;
};

