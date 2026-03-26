"use client";
import React from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import RegisterOnChain from "@/components/kyc/RegisterOnChain";

export default function RegisterPage() {
  return (
    <PageWrapper>
      <div className="container mx-auto px-4 py-20 min-h-screen flex flex-col justify-center">
        <RegisterOnChain />
      </div>
    </PageWrapper>
  );
}
