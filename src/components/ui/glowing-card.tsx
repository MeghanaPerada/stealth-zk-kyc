"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowingCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  children: React.ReactNode;
  glowColor?: "primary" | "secondary" | "destructive" | "none";
}

export function GlowingCard({ className, children, glowColor = "primary", ...props }: GlowingCardProps) {
  
  const glowClasses = {
    primary: "hover:shadow-[var(--glow-primary)] border-primary/20 hover:border-primary/50",
    secondary: "hover:shadow-[var(--glow-secondary)] border-secondary/20 hover:border-secondary/50",
    destructive: "hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] border-destructive/20 hover:border-destructive/50",
    none: "border-border/40"
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative rounded-xl overflow-hidden bg-[var(--glass-effect)] backdrop-blur-xl border transition-all duration-300",
        glowClasses[glowColor],
        className
      )}
      {...props}
    >
      {/* Subtle top inner highlight for glass effect */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      {/* Subtle bottom inner shadow */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent pointer-events-none" />
      
      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
}
