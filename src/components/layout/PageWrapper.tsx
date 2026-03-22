"use client";

import React from "react";
import { motion } from "framer-motion";

export default function PageWrapper({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`min-h-[calc(100vh-80px)] w-full text-white p-4 md:p-8 ${className}`}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {children}
      </div>
    </motion.div>
  );
}
