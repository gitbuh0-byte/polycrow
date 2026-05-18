import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  ShieldCheck, 
  Lock, 
  Zap, 
  Globe, 
  ChevronRight, 
  Users, 
  BarChart3, 
  Anchor,
  Sun,
  Moon,
  Shield,
  Eye,
  Key
} from "lucide-react";
import { GlassCard } from "../components/ui/GlassCard";
import { useTheme } from "../context/ThemeContext";

interface LandingPageProps {
  onLogin: () => void;
  onAdminPortalClick: () => void;
}

const orbitNodes = [
  { size: 18, start: 10, ring: [40, 80, 40], duration: 12, delay: 0, direction: 1 },
  { size: 16, start: 92, ring: [80, 40, 80], duration: 15, delay: -3, direction: -1 },
  { size: 17, start: 176, ring: [40, 40, 80, 40], duration: 18, delay: -6, direction: 1 },
  { size: 15, start: 238, ring: [80, 80, 40, 80], duration: 14, delay: -2, direction: 1 },
  { size: 16, start: 304, ring: [40, 80, 80, 40], duration: 20, delay: -9, direction: -1 },
  { size: 14, start: 350, ring: [80, 40, 40, 80], duration: 16, delay: -5, direction: 1 },
];

const revealTransition = { duration: 0.8, ease: [0.22, 1, 0.36, 1] };
const heroLines = [
  { text: "SECURE DEALS", className: "text-slate-900 dark:text-white", letterClassName: "" },
  { text: "YOU CAN TRUST", className: "", letterClassName: "text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-500" },
];

function FlipLetters({ text, className, letterClassName }: { text: string; className?: string; letterClassName?: string }) {
  return (
    <span className={`letter-flip-word block ${className ?? ""}`} tabIndex={0} aria-label={text}>
      {text.split("").map((char, index) => (
        <span
          key={`${char}-${index}`}
          className={`letter-flip ${letterClassName ?? ""}`}
          aria-hidden="true"
          style={{ "--letter-index": index } as React.CSSProperties}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

export default function LandingPage({ onLogin, onAdminPortalClick }: LandingPageProps) {
  const { theme, toggleTheme } = useTheme();
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const backgroundScale = useTransform(scrollYProgress, [0, 0.6, 1], [1, 1.08, 1.16]);
  const heroY = useTransform(scrollYProgress, [0, 0.22], [0, 135]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.22]);
  const heroScale = useTransform(scrollYProgress, [0, 0.22], [1, 0.9]);
  const navBlur = useTransform(scrollYProgress, [0, 0.08], [0, 18]);
  const navBackdropFilter = useTransform(navBlur, (value) => `blur(${value}px)`);
  const progressScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#05070a] text-slate-900 dark:text-white relative overflow-x-hidden transition-colors duration-500">
      {/* Dynamic Background */}
      <motion.div className="fixed inset-0 z-0" style={{ y: backgroundY, scale: backgroundScale }}>
        <motion.div
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"
          animate={{ borderRadius: ["42%", "58% 42% 48% 52%", "42%"], rotate: [0, 18, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px]"
          animate={{ borderRadius: ["50%", "38% 62% 54% 46%", "50%"], rotate: [0, -14, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
      <motion.div
        className="fixed left-0 top-0 z-50 h-1 w-full origin-left bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500"
        style={{ scaleX: progressScaleX }}
      />

      {/* Navigation */}
      <motion.nav
        className="sticky top-0 z-40 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto"
        style={{ backdropFilter: navBackdropFilter }}
      >
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain brightness-125 drop-shadow-[0_0_10px_rgba(92,255,239,0.85)]" />
          <h1 className="text-xl font-display font-bold tracking-tight text-slate-900 dark:text-white">poly-crow</h1>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-white transition-colors">Features</a>
          <a href="#security" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-white transition-colors">Security</a>
          <a href="#network" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-white transition-colors">Network</a>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="poly-button-secondary p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button 
            onClick={onLogin}
            className="poly-button-primary px-6 py-2 text-sm"
          >
            <span className="relative z-10">Get Started</span>
          </button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section className="relative z-10 pt-32 pb-20 px-8 max-w-7xl mx-auto text-center" style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="hero-flip-group text-6xl md:text-8xl font-display font-bold tracking-tight mb-8 leading-[0.9] [perspective:1000px]">
            {heroLines.map((line, lineIndex) => (
              <motion.span
                key={line.text}
                className="block"
                initial={{ opacity: 0, rotateX: lineIndex === 0 ? 72 : -72, y: 18 }}
                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                transition={{ ...revealTransition, delay: lineIndex * 0.12 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <FlipLetters text={line.text} className={line.className} letterClassName={line.letterClassName} />
              </motion.span>
            ))}
          </h1>
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop worrying about who you're dealing with. Poly-Crow holds funds in a digital vault and only releases them when both parties are happy. Simple, safe, and smart.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onLogin}
              className="poly-button-primary w-full sm:w-auto px-8 py-4 gap-2"
            >
              <span className="relative z-10 flex items-center gap-2">Start Your First Deal <ChevronRight size={20} /></span>
            </button>
            <button className="poly-button-secondary w-full sm:w-auto px-8 py-4">
              <span className="relative z-10">How it works</span>
            </button>
          </div>
        </motion.div>

        {/* Floating Metrics */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { label: "Locked Value", value: "$42.8M" },
            { label: "Success Rate", value: "99.9%" },
            { label: "Avg. Resolution", value: "2.4h" },
            { label: "Active Nodes", value: "12,402" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="morph-glass p-6 rounded-[22px] bg-white/80 dark:bg-white/[0.07] border border-black/5 dark:border-white/10 shadow-sm backdrop-blur-xl transition-all hover:scale-105"
              whileInView={{ opacity: 1, y: 0, borderRadius: i % 2 === 0 ? "30px 18px 30px 18px" : "18px 30px 18px 30px" }}
              initial={{ opacity: 0, y: 28 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ ...revealTransition, delay: i * 0.08 }}
            >
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features Grid */}
      <motion.section
        id="features"
        className="relative z-10 py-32 px-8 max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 80, filter: "blur(10px)", clipPath: "inset(10% 0 0 0 round 32px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", clipPath: "inset(0% 0 0 0 round 32px)" }}
        viewport={{ once: true, amount: 0.2 }}
        transition={revealTransition}
      >
        <div className="text-center mb-20">
          <h2 className="text-4xl font-display font-bold mb-4">BUILT FOR ZERO RISK</h2>
          <p className="text-slate-500 dark:text-slate-400">Our multi-layered protection keeps your money exactly where it should be.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <GlassCard className="morph-glass p-8 flex flex-col gap-6 group hover:border-emerald-500/50 transition-colors bg-white/80 dark:bg-white/[0.07] border-black/5 dark:border-white/5">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-[18px] flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:rounded-[28px_14px_28px_14px] transition-all duration-500">
              <Lock size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Secure Vaults</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Your funds are kept in a separate, isolated digital vault that nobody can touch until the deal is done.</p>
            </div>
          </GlassCard>

          <GlassCard className="morph-glass p-8 flex flex-col gap-6 group hover:border-blue-500/50 transition-colors bg-white/80 dark:bg-white/[0.07] border-black/5 dark:border-white/5">
            <div className="w-14 h-14 bg-blue-500/10 rounded-[18px] flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:rounded-[14px_28px_14px_28px] transition-all duration-500">
              <Zap size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Instant Payouts</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">No waiting days for bank transfers. Once both sides say 'yes', the money moves instantly.</p>
            </div>
          </GlassCard>

          <GlassCard className="morph-glass p-8 flex flex-col gap-6 group hover:border-purple-500/50 transition-colors bg-white/80 dark:bg-white/[0.07] border-black/5 dark:border-white/5">
            <div className="w-14 h-14 bg-purple-500/10 rounded-[18px] flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 group-hover:rounded-[28px_14px_28px_14px] transition-all duration-500">
              <Anchor size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Permanent Proof</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Every chat and agreement is signed and sealed. You have an unbreakable record of exactly what was promised.</p>
            </div>
          </GlassCard>
        </div>
      </motion.section>

      {/* Security Section */}
      <motion.section
        id="security"
        className="relative z-10 py-32 px-8 max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 90, scale: 0.94, filter: "blur(12px)" }}
        whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.25 }}
        transition={revealTransition}
      >
        <GlassCard className="morph-glass p-12 md:p-20 rounded-[34px] bg-gradient-to-br from-slate-900 to-black dark:from-emerald-500/10 dark:to-blue-500/5 border-none overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Shield size={300} />
          </div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="text-emerald-400 text-xs font-bold tracking-[0.3em] uppercase mb-6 block">Defense in Depth</span>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-8 text-white">THE HIGHEST STANDARD <br /> OF SECURITY</h2>
              <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                Poly-Crow uses the same technology that secures billions of dollars in global finance. Our platform is built on transparency and non-custodial principles.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <Eye size={20} />
                    <span className="font-bold uppercase tracking-widest text-[10px]">Visible Audit</span>
                  </div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Public ledger tracking for every transaction.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-blue-400">
                    <Key size={20} />
                    <span className="font-bold uppercase tracking-widest text-[10px]">Your Keys</span>
                  </div>
                  <p className="text-xs text-slate-500 uppercase font-bold">We never have access to your private funds.</p>
                </div>
              </div>
            </div>
            
            <div className="morph-glass bg-white/[0.07] backdrop-blur-2xl rounded-[24px] p-8 border border-white/10 shadow-2xl">
              <div className="space-y-6">
                {[
                  { label: "Encryption", status: "AES-256-GCM", color: "bg-emerald-500" },
                  { label: "Verification", status: "Multi-Sig 2/2", color: "bg-emerald-500" },
                  { label: "Settlement", status: "Sub-second", color: "bg-blue-500" },
                  { label: "Identity", status: "KYC L3 Verified", color: "bg-purple-500" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <span>{item.label}</span>
                      <span className="text-white">{item.status}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: "100%" }}
                        transition={{ duration: 1.5, delay: i * 0.2 }}
                        className={`h-full ${item.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center">
                <div className="flex -space-x-3 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?u=${i + 20}`} alt="Verifier" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Secured by 12,000+ Independent Nodes</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.section>

      {/* Network Preview */}
      <motion.section
        id="network"
        className="relative z-10 py-32 bg-slate-50 dark:bg-white/[0.02] border-y border-black/5 dark:border-white/5 overflow-hidden"
        initial={{ opacity: 0, y: 80, scale: 0.96, filter: "blur(10px)" }}
        whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9 }}
      >
        <div className="px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1">
            <h2 className="text-5xl font-display font-bold mb-8 leading-tight text-slate-900 dark:text-white">GLOBAL TRUST <br /> WITHOUT BORDERS</h2>
            <div className="space-y-6">
              {[
                { icon: Globe, title: "Any Currency", desc: "Settle in USD, BTC, ETH, or any major stablecoin without friction." },
                { icon: Users, title: "KYC Verified", desc: "All participants undergo rigorous identity verification for high-stakes deals." },
                { icon: BarChart3, title: "Real-time Audits", desc: "Monitor your deal health with enterprise-grade analytics tools." },
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <div className="morph-glass flex-shrink-0 w-12 h-12 bg-white dark:bg-white/5 rounded-[18px] flex items-center justify-center border border-black/5 dark:border-white/10 shadow-sm">
                    <item.icon size={20} className="text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full max-w-xl">
             <div className="relative aspect-square">
                {/* Simulated Network Visualization */}
                <div className="absolute inset-0 bg-emerald-500/5 rounded-full animate-pulse" />
                <div className="absolute inset-10 border border-emerald-500/10 rounded-full" />
                <div className="absolute inset-20 border border-emerald-500/10 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-12 bg-emerald-500/10 rounded-full blur-3xl" />
                
                {/* Orbiting Nodes */}
                {orbitNodes.map((node, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      top: node.ring[0],
                      right: node.ring[0],
                      bottom: node.ring[0],
                      left: node.ring[0],
                    }}
                    animate={{
                      rotate: node.start + (node.direction * 360),
                      top: node.ring,
                      right: node.ring,
                      bottom: node.ring,
                      left: node.ring,
                    }}
                    transition={{
                      rotate: {
                        duration: node.duration,
                        ease: "linear",
                        repeat: Infinity,
                        delay: node.delay,
                      },
                      top: {
                        duration: node.duration,
                        ease: "easeInOut",
                        repeat: Infinity,
                        delay: node.delay,
                      },
                      right: {
                        duration: node.duration,
                        ease: "easeInOut",
                        repeat: Infinity,
                        delay: node.delay,
                      },
                      bottom: {
                        duration: node.duration,
                        ease: "easeInOut",
                        repeat: Infinity,
                        delay: node.delay,
                      },
                      left: {
                        duration: node.duration,
                        ease: "easeInOut",
                        repeat: Infinity,
                        delay: node.delay,
                      },
                    }}
                  >
                    <motion.span
                      className="absolute left-1/2 top-0 block rounded-full bg-emerald-400 shadow-[0_0_18px_#34d399]"
                      style={{
                        width: node.size,
                        height: node.size,
                        x: "-50%",
                        y: "-50%",
                      }}
                      animate={{
                        scale: [0.85, 1.18, 0.85],
                        opacity: [0.65, 1, 0.65],
                      }}
                      transition={{
                        duration: 2.8 + i * 0.25,
                        ease: "easeInOut",
                        repeat: Infinity,
                        delay: node.delay,
                      }}
                    />
                  </motion.div>
                ))}
                
                <div className="absolute inset-0 flex items-center justify-center">
                   <img src="/logo.png" alt="Logo" className="w-32 h-32 object-contain opacity-[0.35] brightness-150 drop-shadow-[0_0_18px_rgba(92,255,239,0.75)]" />
                </div>
             </div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 pt-32 pb-20 px-8 border-t border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain brightness-125 drop-shadow-[0_0_8px_rgba(92,255,239,0.8)]" />
              <h1 className="text-lg font-display font-bold tracking-tight text-slate-900 dark:text-white">poly-crow</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-500 max-w-xs">
              The professional standard for decentralized asset custody and trustless settlements.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-6">Protocol</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li className="hover:text-emerald-500 transition-colors cursor-pointer">Documentation</li>
                <li className="hover:text-emerald-500 transition-colors cursor-pointer">Audit Logs</li>
                <li className="hover:text-emerald-500 transition-colors cursor-pointer">Security</li>
                <li className="hover:text-emerald-500 transition-colors cursor-pointer">API Reference</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li className="hover:text-emerald-500 transition-colors cursor-pointer">About</li>
                <li className="hover:text-emerald-500 transition-colors cursor-pointer">Network</li>
                <li className="hover:text-emerald-500 transition-colors cursor-pointer">Careers</li>
                <li className="hover:text-emerald-500 transition-colors cursor-pointer">Legal</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-6">Social</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li className="hover:text-emerald-500 transition-colors cursor-pointer">Twitter</li>
                <li className="hover:text-emerald-500 transition-colors cursor-pointer">GitHub</li>
                <li className="hover:text-emerald-500 transition-colors cursor-pointer">Discord</li>
                <li className="hover:text-emerald-500 transition-colors cursor-pointer">Telegram</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-400 dark:text-slate-600 uppercase font-bold tracking-widest text-center">
           <span>© 2026 POLY-CROW PROTOCOL | <button onClick={onAdminPortalClick} className="hover:text-emerald-500 transition-colors">Admin Portal</button></span>
           <span>ESTABLISHED 2024 • V2.0.4-STABLE</span>
        </div>
      </footer>
    </div>
  );
}
