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
      
      // Create a dummy transaction to sign as a "message"
      // We use a zero-amount payment to the user's own address
      // with the message in the 'note' field.
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: activeAddress,
        amount: 0,
        note: new Uint8Array(Buffer.from(message)),
        suggestedParams: params,
      });

      const signedTxns = await signTransactions([txn.toByte()]);
      const signedTxn = signedTxns[0];
      if (!signedTxn) throw new Error("Signing failed");
      
      // Return the base64 encoded signed transaction as the "signature"
      return Buffer.from(signedTxn).toString("base64");
    }
  };
};

