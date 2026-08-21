import { type ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "motion/react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  animate?: boolean;
  onClick?: () => void;
  key?: any;
}

export function GlassCard({ children, className, hover = true, animate = true }: GlassCardProps) {
  const Component = animate ? motion.div : "div";
  
  return (
    <Component
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "liquid-glass p-6",
        hover && "glass-hover",
        className
      )}
    >
      {children}
    </Component>
  );
}
