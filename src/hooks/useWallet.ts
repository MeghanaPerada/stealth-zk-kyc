"use client";

import { useWalletContext } from "@/context/WalletContext";

export const useWallet = () => {
  const { 
    connectedAddress, 
    isConnected, 
    isDemoMode,
    connectWallet, 
    disconnectWallet 
  } = useWalletContext();

  const formatAddress = (address: string | null) => {
    if (!address) return "";
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  return {
    address: connectedAddress,
    shortAddress: formatAddress(connectedAddress),
    isConnected,
    isDemoMode,
    connectWallet,
    disconnectWallet,
  };
};

