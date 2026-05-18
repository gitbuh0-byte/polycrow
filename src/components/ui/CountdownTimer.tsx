import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate?: Date;
  className?: string;
  variant?: "compact" | "full";
  onExpire?: () => void;
}

export function CountdownTimer({ targetDate, className = "", variant = "full", onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{h: string, m: string, s: string}>({ h: "00", m: "00", s: "00" });
  const [isExpired, setIsExpired] = useState(false);
  const [urgency, setUrgency] = useState<"normal" | "warning" | "critical">("normal");

  useEffect(() => {
    // If no target date, mock one 48 hours from now for demonstration
    const destination = targetDate || new Date(Date.now() + 48 * 60 * 60 * 1000 + 12 * 60 * 1000 + 5000);

    const checkTime = () => {
      const now = new Date().getTime();
      const difference = destination.getTime() - now;

      if (difference <= 0) {
        setIsExpired(true);
        setUrgency("critical");
        setTimeLeft({ h: "00", m: "00", s: "00" });
        if (onExpire) onExpire();
        return true;
      }

      // Calculate urgency
      const totalSeconds = Math.floor(difference / 1000);
      if (totalSeconds <= 60) {
        setUrgency("critical");
      } else if (totalSeconds <= 120) {
        setUrgency("warning");
      } else {
        setUrgency("normal");
      }

      return false;
    };

    if (checkTime()) return;

    const timer = setInterval(() => {
      if (checkTime()) {
        clearInterval(timer);
      } else {
        const now = new Date().getTime();
        const difference = destination.getTime() - now;
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({
          h: h.toString().padStart(2, "0"),
          m: m.toString().padStart(2, "0"),
          s: s.toString().padStart(2, "0"),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  const getUrgencyClasses = () => {
    if (isExpired || urgency === "critical") return "text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]";
    if (urgency === "warning") return "text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]";
    return "text-emerald-500 dark:text-emerald-400";
  };

  const getBorderClasses = () => {
    if (isExpired || urgency === "critical") return "bg-rose-500/10 border-rose-500/30";
    if (urgency === "warning") return "bg-amber-500/10 border-amber-500/30";
    return "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10";
  };

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${isExpired || urgency === "critical" ? "text-rose-500" : urgency === "warning" ? "text-amber-400" : "text-slate-500"} ${className}`}>
        <Clock size={14} className={isExpired ? "" : "animate-pulse"} />
        <span className="text-xs font-mono font-bold">
          {isExpired ? "EXPIRED" : `${timeLeft.h}:${timeLeft.m}:${timeLeft.s}`}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${className}`}>
      {[
        { label: "Hours", value: timeLeft.h },
        { label: "Mins", value: timeLeft.m },
        { label: "Secs", value: timeLeft.s },
      ].map((unit, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className={`border rounded-xl px-3 py-2 min-w-[3rem] text-center shadow-inner transition-all duration-500 ${getBorderClasses()}`}>
            <span className={`text-xl font-display font-bold tabular-nums transition-colors duration-500 ${getUrgencyClasses()}`}>
              {unit.value}
            </span>
          </div>
          <span className={`text-[8px] uppercase font-bold mt-1 tracking-widest ${
            isExpired || urgency === "critical" ? "text-rose-400" : urgency === "warning" ? "text-amber-400/70" : "text-slate-400"
          }`}>{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
