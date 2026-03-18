"use client";

import { useWallet as useTxnWallet } from "@txnlab/use-wallet-react";
import { useWalletContext } from "@/context/WalletContext";

export const useWallet = () => {
  const { 
    activeAddress, 
    activeWallet,
    signTransactions,
    algodClient,
  } = useTxnWallet();

  const isTxnConnected = !!activeWallet;

  const {
    isConnected: isDemoConnected,
    isDemoMode,
    connectWallet: triggerContextConnect,
    disconnectWallet: triggerContextDisconnect
  } = useWalletContext();

  const isConnected = isTxnConnected || isDemoConnected;
  const connectedAddress = activeAddress || (isDemoMode ? "DEMO_ADDRESS_PLACEHOLDER" : null);

  const formatAddress = (address: string | null) => {
    if (!address) return "";
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  return {
    address: connectedAddress,
    shortAddress: formatAddress(connectedAddress),
    isConnected,
    isDemoMode,
    // Note: connectWallet is now primarily handled by the WalletButton trigger 
    // but we keep the mapping for compatibility.
    connectWallet: triggerContextConnect, 
    disconnectWallet: async () => {
      if (activeWallet) {
        activeWallet.disconnect();
      }
      await triggerContextDisconnect();
    },
    signTransactions,
    algodClient,
  };
};

