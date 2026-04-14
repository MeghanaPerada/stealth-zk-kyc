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
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
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

  // Handle resend timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const initiateOtp = useCallback(() => {
    if (!formData.name || !formData.email) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsSendingEmail(true);
    setStep("otp");
    setInputOtp(""); // Clear previous input

    // Simulate network delay
    setTimeout(() => {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);
      setIsSendingEmail(false);
      setResendTimer(30); // 30 second cooldown
      
      console.log(`[MOCK DIGILOCKER] OTP sent to ${formData.email}: ${otp}`);
      toast.info(`Simulated email sent to ${formData.email}`);
    }, 2000);
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
    generatedOtp,
    isGenerating,
    isSendingEmail,
    resendTimer,
    proof,
    hasIdentity,
    initiateOtp,
    verifyOtp,
    generateNewProof,
    resetIdentity
  };
}
