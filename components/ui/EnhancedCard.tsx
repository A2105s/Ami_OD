"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useRef, useState } from "react";
import { cva } from "class-variance-authority";

const cardVariants = cva(
  "relative rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm overflow-hidden transition-all duration-300",
  {
    variants: {
      hoverEffect: {
        true: "hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10"
      }
    },
    defaultVariants: {
      hoverEffect: true
    }
  }
);

interface EnhancedCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  borderGradient?: boolean;
  glowEffect?: boolean;
}

interface EnhancedCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  borderGradient?: boolean;
  glowEffect?: boolean;
}

const EnhancedCard = ({
  children,
  className,
  hoverEffect = true,
  borderGradient = true,
  glowEffect = true,
}: EnhancedCardProps) => {
  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden',
        hoverEffect && 'transition-all duration-300 hover:-translate-y-1',
        'p-[1px]',
        className
      )}
    >
      {/* Card content */}
      <div className="relative z-10 h-full bg-slate-800/90 rounded-xl p-6 border border-slate-700/50">
        {children}
      </div>
    </div>
  );
};

export default EnhancedCard;
