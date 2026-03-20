// v1.0.2 - Force rebuild fixed algosdk
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
    signMessage: async (message: string) => {
      if (!activeAddress || !signTransactions) {
        throw new Error("Wallet not connected or cannot sign");
      }
      
      const algosdk = await import("algosdk");
      const params = await algodClient.getTransactionParams().do();
      
      // Ensure we have a valid fee (at least 1000 microAlgos)
      // Some wallets reject transactions with 0 fee even for signing.
      const suggestedParams = {
        ...params,
        fee: Math.max(Number(params.minFee || 1000), 1000),
        flatFee: true,
      };

      // Create a dummy transaction to sign as a "message"
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: activeAddress,
        amount: 0,
        note: new TextEncoder().encode(message),
        suggestedParams,
      });

      console.log(`[useWallet] Requesting signature for transaction...`);
      const signedTxns = await signTransactions([txn.toByte()]);
      const signedTxn = signedTxns[0];
      if (!signedTxn) throw new Error("Signing failed");
      
      return Buffer.from(signedTxn).toString("base64");
    }
  };
};

