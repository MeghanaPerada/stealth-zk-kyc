import { useState, useCallback, useEffect } from "react";
import { generateSecret } from "@/lib/lightCryptoUtils";
import { generateIdentityCommitment, createLightProof } from "@/lib/lightIdentityService";
import { toast } from "sonner";

export type OnboardingStep = "form" | "otp" | "loading" | "complete";

/**
 * useLightIdentity
 * 
 * Manages the Mock DigiLocker onboarding flow state.
 */
export function useLightIdentity() {
  const [step, setStep] = useState<OnboardingStep>("form");
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [inputOtp, setInputOtp] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [proof, setProof] = useState<any>(null);

  // Persistence: Check if already onboarded
  const [hasIdentity, setHasIdentity] = useState(false);

  useEffect(() => {
    const commitment = localStorage.getItem("identityCommitment");
    const secret = localStorage.getItem("identitySecret");
    if (commitment && secret) {
      setHasIdentity(true);
      setStep("complete");
    }
  }, []);

  const initiateOtp = useCallback(() => {
    if (!formData.name || !formData.email) {
      toast.error("Please fill in all fields.");
      return;
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setStep("otp");
    // Simulate sending OTP
    console.log(`[MOCK DIGILOCKER] OTP sent to ${formData.email}: ${otp}`);
    toast.info(`Simulated OTP sent to ${formData.email}`);
  }, [formData]);

  const verifyOtp = useCallback(async () => {
    if (inputOtp !== generatedOtp) {
      toast.error("Invalid OTP. Try again.");
      return;
    }

    setIsGenerating(true);
    setStep("loading");

    try {
      // 1. Generate identity anchor
      const secret = generateSecret();
      const commitment = await generateIdentityCommitment(formData.name, formData.email, secret);

      // 2. Persist securely (simulated local vault)
      localStorage.setItem("identityCommitment", commitment);
      localStorage.setItem("identitySecret", secret);
      
      // Clear sensitive form data from memory
      setFormData({ name: "", email: "" });
      setHasIdentity(true);
      setStep("complete");
      toast.success("Identity Anchor Generated!");
    } catch (err: any) {
      toast.error("Failed to anchor identity: " + err.message);
      setStep("otp");
    } finally {
      setIsGenerating(false);
    }
  }, [inputOtp, generatedOtp, formData]);

  const generateNewProof = useCallback(async () => {
    const secret = localStorage.getItem("identitySecret");
    const commitment = localStorage.getItem("identityCommitment");
    
    if (!secret || !commitment) {
      toast.error("No identity found. Please re-onboard.");
      return;
    }

    setIsGenerating(true);
    try {
      const newProof = await createLightProof(secret, commitment);
      setProof(newProof);
      toast.success("New Proof Generated!");
      return newProof;
    } catch (err: any) {
      toast.error("Proof generation failed: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const resetIdentity = useCallback(() => {
    localStorage.removeItem("identityCommitment");
    localStorage.removeItem("identitySecret");
    setHasIdentity(false);
    setStep("form");
    setProof(null);
    toast.info("Identity vault cleared.");
  }, []);

  return {
    step,
    formData,
    setFormData,
    inputOtp,
    setInputOtp,
    generatedOtp, // For display in mock UI if needed
    isGenerating,
    proof,
    hasIdentity,
    initiateOtp,
    verifyOtp,
    generateNewProof,
    resetIdentity
  };
}
