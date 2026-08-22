import { lazy, Suspense, useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  PlusCircle, 
  ShieldCheck, 
  MessageSquare, 
  User as UserIcon,
  Wallet as WalletIcon,
  Bell,
  Sun,
  Moon,
  LogOut,
  HelpCircle,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import { useTranslation } from "react-i18next";
import { GlassCard } from "./components/ui/GlassCard";
import "./lib/i18n";

import { useChatActivity } from "./hooks/useChatActivity";

import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db, firebaseAvailable } from "./lib/firebase";
import { setDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const CreateAgreement = lazy(() => import("./pages/CreateAgreement"));
const AgreementDetail = lazy(() => import("./pages/AgreementDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AdminAuth = lazy(() => import("./pages/AdminAuth"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Onboarding = lazy(() => import("./components/Onboarding"));

function LoadingSurface() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full"
      />
    </div>
  );
}

export default function App() {
  const { user, profile, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [rates, setRates] = useState<any>(null);

  // System Auto-Reset: Clears legacy balances to ensure 0.00 reflection as requested
  useEffect(() => {
    const performReset = async () => {
      if (user && profile && !profile.systemResetDone && firebaseAvailable) {
        try {
          await updateDoc(doc(db, "users", user.uid), {
            balance: 0,
            balanceCrypto: 0,
            balances: {
              USD: 0,
              BTC: 0,
              ETH: 0
            },
            systemResetDone: true
          });
          console.log("System reset performed for user.");
        } catch (e) {
          console.error("Auto-reset error:", e);
        }
      }
    };
    performReset();
  }, [user, profile]);

  useEffect(() => {
    import("./lib/marketRates").then(m => m.getUSDExchangeRates().then(setRates));
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSelectedAgreementId(null);
    setIsSidebarOpen(false);
  };

  const handleCreateAgreement = () => {
    if (!profile?.kycVerified) {
      handleNavigate("verify");
      return;
    }
    handleNavigate("create");
  };

  const handleLogin = async () => {
    if (!firebaseAvailable) {
      alert("Firebase is not configured. Set VITE_FIREBASE_API_KEY to enable login.");
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Initialize profile if new
      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        reliabilityScore: 100,
        balance: 0, 
        balanceCrypto: 0,
        balances: {
          USD: 0,
          BTC: 0,
          ETH: 0
        },
        kycVerified: false,
        onboardingCompleted: false,
        createdAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => {
    if (firebaseAvailable) auth.signOut();
  };

  useEffect(() => {
    // Check for invite/join parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const joinDealId = urlParams.get("joinDeal");
    if (joinDealId) {
      setSelectedAgreementId(joinDealId);
      // Don't auto-navigate if not logged in, but store it
      if (user) {
        setCurrentPage("detail");
        // Clear the URL parameter so it doesn't keep triggering
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [user]);

  useEffect(() => {
    const handleCustomNavigate = (e: any) => {
      if (e.detail) handleNavigate(e.detail);
    };
    window.addEventListener('navigate', handleCustomNavigate);
    return () => window.removeEventListener('navigate', handleCustomNavigate);
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsDesktop(window.innerWidth >= 1024);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<"kyc" | "completed">("kyc");
  const { recentMessages } = useChatActivity();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme]);

  // Authentication Guard (Simplified)
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#05070a]">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full"
      />
    </div>
  );

  if (!user && !isAdminMode) return (
    <Suspense fallback={<LoadingSurface />}>
      <LandingPage onLogin={handleLogin} onAdminPortalClick={() => setIsAdminMode(true)} />
    </Suspense>
  );

  if (isAdminMode && !adminAuthenticated) {
    return (
      <Suspense fallback={<LoadingSurface />}>
        <AdminAuth 
          onBack={() => setIsAdminMode(false)} 
          onLogin={async ({ email, pass }) => {
            if (email === "admin@polycrow.com" && pass === "polycrow2026") {
              setAdminAuthenticated(true);
              return true;
            }
            return false;
          }}
        />
      </Suspense>
    );
  }

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { id: "wallet", icon: WalletIcon, label: "Wallet" },
    { id: "create", icon: PlusCircle, label: t("create_agreement") },
    { id: "profile", icon: UserIcon, label: t("profile") },
    { id: "help", icon: HelpCircle, label: t("help") },
  ];

  const fiatTotal = (() => {
    if (!profile || !rates) return 0;
    let total = 0;
    const fiatCurrencies = ["USD", "EUR", "GBP", "KES", "NGN", "MXN", "ZAR", "GHS"];
    fiatCurrencies.forEach(cid => {
      const bal = profile?.balances?.[cid] || 0;
      const rate = rates[cid] || 1;
      total += Math.max(0, bal) / rate;
    });
    return total;
  })();

  const renderPage = () => {
    if (isAdminMode) return <AdminPanel onExit={() => { setIsAdminMode(false); setAdminAuthenticated(false); }} />;

    switch (currentPage) {
      case "dashboard": return (
        <Dashboard 
          onSelectAgreement={(id) => { setSelectedAgreementId(id); handleNavigate("detail"); }} 
          onCreateAgreement={handleCreateAgreement}
          onVerifyAccount={() => handleNavigate("verify")}
        />
      );
      case "wallet": return <Wallet />;
      case "create": return <CreateAgreement onCreated={() => handleNavigate("dashboard")} />;
      case "detail": return <AgreementDetail agreementId={selectedAgreementId!} onBack={() => handleNavigate("dashboard")} />;
      case "profile": return <Profile />;
      default: return (
        <Dashboard 
          onSelectAgreement={() => {}} 
          onCreateAgreement={handleCreateAgreement}
          onVerifyAccount={() => handleNavigate("verify")}
        />
      );
    }
  };

  return (
    <div className="min-h-screen flex text-inherit">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {(isSidebarOpen || isDesktop) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="mobile-sidebar fixed lg:relative z-50 w-[min(84vw,20rem)] h-screen p-5 lg:p-6 flex flex-col gap-7 bg-[#f8fafc]/95 dark:bg-[#081016]/95 lg:bg-transparent backdrop-blur-3xl border-r border-black/5 dark:border-white/10 shadow-[18px_0_50px_rgba(2,6,23,0.22)] lg:shadow-none"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Poly-Crow Logo" className="w-10 h-10 object-contain brightness-125 drop-shadow-[0_0_10px_rgba(92,255,239,0.85)]" />
                <h1 className="text-xl font-display font-bold tracking-tight text-slate-900 dark:text-white">poly-crow</h1>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden w-10 h-10 rounded-[10px] border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
                aria-label="Close navigation menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="lg:hidden px-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-500 dark:text-emerald-400">Control center</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Move through your secure workspace.</p>
            </div>

            <nav className="flex-1 flex flex-col gap-2" aria-label="Main navigation">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => item.id === "create" ? handleCreateAgreement() : handleNavigate(item.id)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-[10px] transition-all duration-300 ${
                    currentPage === item.id 
                    ? "bg-white/10 text-emerald-500 dark:text-emerald-400 border border-white/10 shadow-lg" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="flex flex-col gap-4 mt-auto">
              <GlassCard className="p-4 rounded-2xl border-white/5 bg-white/5" hover={false} animate={false}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center">
                    <UserIcon size={16} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{profile?.displayName || "Guardian"}</p>
                    <p className="text-[10px] text-emerald-500 dark:text-emerald-400">Reliability: {profile?.reliabilityScore || "98"}%</p>
                  </div>
                </div>
                <div className={`border rounded-lg py-1 px-2 text-center text-[10px] font-bold tracking-widest ${profile?.kycVerified ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
                  {profile?.kycVerified ? "IDENTITY VERIFIED" : "IDENTITY NOT VERIFIED"}
                </div>
              </GlassCard>
              
              <div className="flex items-center justify-between px-2">
                <button 
                  onClick={toggleTheme}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => i18n.changeLanguage(i18n.language === "en" ? "es" : "en")}
                    className="text-[10px] font-bold text-slate-500 hover:text-white uppercase"
                  >
                    {i18n.language}
                  </button>
                  {user ? (
                    <LogOut 
                      size={16} 
                      className="text-slate-500 cursor-pointer hover:text-white" 
                      onClick={handleLogout} 
                    />
                  ) : (
                    <button 
                      onClick={handleLogin}
                      className="text-[10px] font-bold bg-white text-black px-4 py-1.5 rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                      LOGIN
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto relative flex flex-col">
        {user && currentPage === "verify" ? (
          <section className="flex-1 flex items-center justify-center p-8">
            <Suspense fallback={<LoadingSurface />}>
              <Onboarding 
                step={onboardingStep} 
                onNext={(next) => setOnboardingStep(next)} 
                onComplete={() => {
                  setOnboardingStep("completed");
                  setCurrentPage("dashboard");
                }}
              />
            </Suspense>
          </section>
        ) : (
          <>
            <header className="h-20 border-b border-black/5 dark:border-white/5 px-8 flex items-center justify-between backdrop-blur-md sticky top-0 z-40 bg-white/50 dark:bg-[#05070a]/50">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="mobile-menu-trigger lg:hidden h-11 min-w-11 px-3 rounded-[10px] border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(16,185,129,0.12)]"
                  aria-label={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
                  aria-expanded={isSidebarOpen}
                >
                  {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                  <span className="sr-only">Menu</span>
                </button>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">{currentPage}</h1>
                  <p className="text-xs text-slate-500">Poly-Crow Escrow Control Center</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleNavigate("wallet")}
                  className="hidden md:flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all cursor-pointer"
                >
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{t("balance")}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">${fiatTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </button>
                
                <button 
                  onClick={() => setIsNotifDrawerOpen(true)}
                  className="relative p-2 text-slate-400 hover:text-white bg-white/5 border border-white/10 rounded-full transition-all hover:scale-110 active:scale-95"
                >
                  <Bell size={20} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
                </button>
              </div>
            </header>

            <section className="p-8 flex-1 max-w-7xl w-full mx-auto">
              <Suspense fallback={<LoadingSurface />}>
                {renderPage()}
              </Suspense>
            </section>

            {/* Unified Notification & Chat Drawer */}
            <AnimatePresence>
              {isNotifDrawerOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsNotifDrawerOpen(false)}
                    className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                  />
                  <motion.aside
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed top-0 right-0 z-[70] w-full max-w-md h-screen bg-white dark:bg-[#05070a]/90 backdrop-blur-3xl border-l border-black/5 dark:border-white/10 flex flex-col shadow-2xl"
                  >
                    <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Activity Feed</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Secure Messages & Events</p>
                      </div>
                      <button onClick={() => setIsNotifDrawerOpen(false)} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X size={24} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                       {/* Messages Section */}
                       <div className="space-y-4">
                        <h4 className="text-[10px] uppercase font-bold text-emerald-400 tracking-[0.2em]">Recent Chats</h4>
                        {recentMessages.length > 0 ? recentMessages.map((msg) => (
                          <GlassCard 
                            key={msg.id} 
                            className="p-4 bg-white/5 border-white/5 group cursor-pointer" 
                            hover={true} 
                            animate={false}
                            onClick={() => {
                              setSelectedAgreementId(msg.agreementId);
                              setCurrentPage("detail");
                              setIsNotifDrawerOpen(false);
                            }}
                          >
                            <div className="flex gap-4">
                              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                <MessageSquare size={16} className="text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                                    {msg.senderId === user?.uid ? "You" : "Partner"}
                                  </span>
                                  <span className="text-[8px] text-slate-500">
                                    {msg.timestamp?.toDate?.() ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{msg.text}</p>
                              </div>
                            </div>
                          </GlassCard>
                        )) : (
                          <p className="text-[10px] text-slate-500 text-center py-8 italic">No recent messages across your secure channels.</p>
                        )}
                      </div>

                      <div className="w-full h-px bg-white/5" />

                      {/* Notifications Section */}
                       <div className="space-y-4">
                        <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em]">System Alerts</h4>
                        {[
                          { icon: ShieldCheck, text: "Escrow funds locked for #9921", color: "text-emerald-500 dark:text-emerald-400" },
                          { icon: Bell, text: "New deal code received: PC-XT88", color: "text-blue-500 dark:text-blue-400" },
                        ].map((notif, i) => (
                          <div key={i} className="flex gap-4 items-start p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                            <notif.icon size={16} className={`${notif.color} mt-0.5`} />
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">{notif.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-black/40">
                      <button 
                        onClick={() => { setIsNotifDrawerOpen(false); handleNavigate("dashboard"); }}
                        className="w-full py-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border border-emerald-500/20 rounded-xl hover:bg-emerald-500/5 transition-all text-center"
                      >
                        View All Audit Logs
                      </button>
                    </div>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Liquid Glass Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1] opacity-50">
          <div className="absolute -top-[100px] -left-[100px] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-[100px] -right-[100px] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        </div>
      </main>
    </div>
  );
}
