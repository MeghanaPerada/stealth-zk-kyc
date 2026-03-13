"use client";

import { useWalletContext } from "@/context/WalletContext";

export const useWallet = () => {
  const { 
    connectedAddress, 
    isConnected, 
    connectWallet, 
    disconnectWallet 
  } = useWalletContext();

  /**
   * Helper to format the wallet address for display (e.g., ABCD...WXYZ)
   */
  const formatAddress = (address: string | null) => {
    if (!address) return "";
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  return {
    address: connectedAddress,
    shortAddress: formatAddress(connectedAddress),
    isConnected,
    connectWallet,
    disconnectWallet,
  };
};
