import { useState, useCallback } from "react";
import { verifyProof, type LightProof, type VerificationResult } from "@/lib/lightVerifyService";
import { toast } from "sonner";

/**
 * useLightVerification
 * 
 * Custom hook to manage the lifecycle of a light-weight KYC verification.
 * Handles loading states, result persistence, and UI notifications.
 */
export function useLightVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "failure">("idle");

  /**
   * executeVerification
   * 
   * Runs the verification logic and updates local state.
   */
  const executeVerification = useCallback(async (proof: LightProof) => {
    setIsVerifying(true);
    setStatus("verifying");
    setResult(null);

    try {
      // Small artificial delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 800));

      const verificationResult = await verifyProof(proof);
      setResult(verificationResult);

      if (verificationResult.success) {
        setStatus("success");
        toast.success("Identity Verified!");
      } else {
        setStatus("failure");
        toast.error(verificationResult.message);
      }

      return verificationResult;
    } catch (err: any) {
      const errorResult = { success: false, message: err.message };
      setResult(errorResult);
      setStatus("failure");
      toast.error("An unexpected error occurred during verification.");
      return errorResult;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  /**
   * resetVerification
   */
  const resetVerification = useCallback(() => {
    setResult(null);
    setStatus("idle");
    setIsVerifying(false);
  }, []);

  return {
    isVerifying,
    result,
    status,
    executeVerification,
    resetVerification
  };
}
