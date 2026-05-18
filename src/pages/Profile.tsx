import { GlassCard } from "../components/ui/GlassCard";
import { 
  User, 
  Shield, 
  CreditCard, 
  Bell, 
  LogOut, 
  ChevronRight, 
  Star, 
  Languages, 
  ArrowLeft,
  Edit2, 
  Check, 
  X, 
  Mail,
  Smartphone,
  Globe,
  Plus,
  Trash2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { updateProfile, deleteUser } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";

export default function Profile() {
  const { profile, user } = useAuth();
  const { t, i18n } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [activeTab, setActiveTab] = useState<"settings" | "gateways" | "notifications" | "language">("settings");
  const [selectedGatewayConfig, setSelectedGatewayConfig] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [configForm, setConfigForm] = useState({ phoneNumber: "", email: "", apiKey: "" });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  const [gateways, setGateways] = useState([
    { id: "stripe", name: "Stripe", status: "Connected", desc: "Instant fiat settlements", active: true },
    { id: "paypal", name: "PayPal", status: "Connected", desc: "Standard business transfers", active: true },
    { id: "paystack", name: "Paystack", status: "Not Linked", desc: "Modern African payments", active: false },
    { id: "mpesa", name: "M-Pesa", status: "Not Linked", desc: "Mobile money settlement (KE/TZ)", active: false },
    { id: "airtel", name: "Airtel Money", status: "Not Linked", desc: "Pan-African mobile wallet", active: false },
    { id: "mtn", name: "MTN MoMo", status: "Not Linked", desc: "Regional mobile payments", active: false },
    { id: "metamask", name: "Metamask", status: "Not Linked", desc: "Native Web3 settlement", active: false },
    { id: "coinbase", name: "Coinbase", status: "Not Linked", desc: "Institutional crypto custody", active: false },
  ]);

  const [notificationSettings, setNotificationSettings] = useState([
    { id: "push", icon: Bell, label: "App Push Notifications", desc: "Real-time deal events and chat", enabled: true },
    { id: "email", icon: Mail, label: "Email Summaries", desc: "Weekly audit reports and receipts", enabled: true },
    { id: "sms", icon: Smartphone, label: "SMS Verification", desc: "High-security threshold alerts", enabled: false },
    { id: "browser", icon: Globe, label: "Browser Notifications", desc: "Background channel monitoring", enabled: true },
  ]);

  useEffect(() => {
    if (profile?.displayName) {
      setDisplayName(profile.displayName);
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateProfile(user, { displayName });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmed = confirm("WARNING: This will permanently delete your account and all associated data. This action cannot be undone. Are you sure?");
    if (!confirmed) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      alert("Account deleted successfully.");
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/requires-recent-login") {
        alert("Please logout and login again to perform this sensitive action.");
      } else {
        alert("Failed to delete account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleGateway = (id: string) => {
    const gateway = gateways.find(g => g.id === id);
    if (gateway?.active) {
      setGateways(prev => prev.map(g => 
        g.id === id ? { ...g, active: false, status: "Not Linked" } : g
      ));
    } else {
      setSelectedGatewayConfig(id);
      setConfigForm({ phoneNumber: "", email: "", apiKey: "" });
    }
  };

  const handleConnectGateway = async () => {
    if (!selectedGatewayConfig) return;
    setLoading(true);
    
    // Simulate API verification
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setGateways(prev => prev.map(g => 
      g.id === selectedGatewayConfig ? { ...g, active: true, status: "Connected" } : g
    ));
    setLoading(false);
    setSelectedGatewayConfig(null);
  };

  const toggleNotification = (id: string) => {
    setNotificationSettings(prev => prev.map(n => 
      n.id === id ? { ...n, enabled: !n.enabled } : n
    ));
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setActiveTab("settings");
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-4xl font-display font-bold text-slate-900 dark:text-white">{t("profile")}</h2>
          {activeTab !== "settings" && (
            <button 
              onClick={() => setActiveTab("settings")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest text-[10px] hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
            >
              <ArrowLeft size={16} />
              Back to Settings
            </button>
          )}
        </div>
        <p className="text-slate-500 dark:text-white/40">Manage your identity, security credentials, and trust metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-8">
          <GlassCard className="flex flex-col items-center text-center p-12 relative group">
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:text-emerald-500"
              >
                <Edit2 size={16} />
              </button>
            )}

            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center border-2 border-white/20 shadow-2xl">
                {profile?.photoURL ? (
                   <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-3xl" />
                ) : (
                  <User size={64} className="text-white" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center border-4 border-[#f8fafc] dark:border-[#05070a]">
                <Shield size={20} className="text-black" />
              </div>
            </div>

            {isEditing ? (
              <div className="flex flex-col gap-4 w-full">
                <input 
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-center text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 uppercase tracking-widest font-bold text-xs"
                  placeholder="Your Name"
                />
                <div className="flex gap-2">
                  <button 
                    disabled={loading}
                    onClick={handleUpdateProfile}
                    className="flex-1 bg-emerald-500 text-white font-bold py-2 rounded-xl hover:bg-emerald-600 transition-all text-xs"
                  >
                    {loading ? "..." : <Check size={16} className="mx-auto" />}
                  </button>
                  <button 
                    onClick={() => { setIsEditing(false); setDisplayName(profile?.displayName || ""); }}
                    className="flex-1 bg-red-500/10 text-red-500 font-bold py-2 rounded-xl hover:bg-red-500/20 transition-all text-xs"
                  >
                    <X size={16} className="mx-auto" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{profile?.displayName || "Guardian"}</h3>
                <p className="text-slate-400 dark:text-white/40 text-sm mb-6 uppercase tracking-widest font-bold">Member since Oct 2024</p>
              </>
            )}
            
            <div className="grid grid-cols-2 gap-4 w-full pt-6 border-t border-black/5 dark:border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-white/40">Trust Level</span>
                <div className="flex items-center justify-center gap-1 text-yellow-500 dark:text-yellow-400">
                  <Star size={12} fill="currentColor" />
                  <span className="text-sm font-bold text-slate-800 dark:text-white">4.9/5.0</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-white/40">Rank</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">Master</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col gap-4">
            <h4 className="font-bold border-b border-black/5 dark:border-white/5 pb-4 text-slate-900 dark:text-white">Security Status</h4>
            <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${twoFactorEnabled ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}>
              <div className="flex items-center gap-3">
                <Shield size={20} className={twoFactorEnabled ? "text-green-600 dark:text-green-400" : "text-red-500"} />
                <span className="text-sm font-medium text-slate-800 dark:text-white">{twoFactorEnabled ? "Two-Factor Enabled" : "Two-Factor Disabled"}</span>
              </div>
              <button 
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={`w-10 h-6 rounded-full relative transition-all ${twoFactorEnabled ? "bg-green-500" : "bg-slate-300 dark:bg-slate-700"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${twoFactorEnabled ? "right-1" : "left-1"}`} />
              </button>
            </div>
            
            <button 
              onClick={handleDeleteAccount}
              className="mt-4 w-full p-4 text-red-500 font-bold bg-red-500/5 hover:bg-red-500/10 rounded-2xl border border-red-500/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
            >
              <Trash2 size={16} /> Delete Account
            </button>
          </GlassCard>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-8">
          <GlassCard className="flex flex-col gap-6 min-h-[400px] border-black/5 dark:border-white/5 bg-white dark:bg-white/5">
             {activeTab === "settings" && (
                <>
                  <h4 className="font-bold border-b border-black/5 dark:border-white/5 pb-4 text-slate-900 dark:text-white">Account Settings</h4>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: "gateways", icon: CreditCard, label: "Payment Gateways", value: "Stripe, PayPal linked" },
                      { id: "notifications", icon: Bell, label: "Push Notifications", value: "Push, Email, SMS Active" },
                      { id: "language", icon: Languages, label: "Interface Language", value: i18n.language === "en" ? "English" : i18n.language === "es" ? "Español" : i18n.language },
                    ].map((item) => (
                      <button 
                        key={item.id} 
                        onClick={() => setActiveTab(item.id as any)}
                        className="flex items-center justify-between p-6 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all group border border-transparent hover:border-black/5 dark:hover:border-white/10"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 group-hover:border-emerald-500/30 transition-all">
                            <item.icon size={20} className="text-slate-400 dark:text-white/40 group-hover:text-emerald-500 transition-colors" />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="font-bold text-slate-900 dark:text-white">{item.label}</span>
                            <span className="text-xs text-slate-400 dark:text-white/30">{item.value}</span>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-300 dark:text-white/20 transition-transform group-hover:translate-x-1" />
                      </button>
                    ))}
                  </div>
                </>
             )}

             {activeTab === "gateways" && !selectedGatewayConfig && (
               <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/5 pb-4">
                    <button 
                      onClick={() => setActiveTab("settings")}
                      className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <h4 className="font-bold text-slate-900 dark:text-white">Payment Gateways</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gateways.map((gateway, i) => (
                      <div key={i} className={`p-6 rounded-3xl border transition-all ${gateway.active ? "bg-emerald-500/5 border-emerald-500/20" : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10"}`}>
                        <div className="flex justify-between items-start mb-4">
                          <span className="font-bold text-slate-900 dark:text-white">{gateway.name}</span>
                          <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${gateway.active ? "bg-emerald-500/20 text-emerald-500" : "bg-slate-500/20 text-slate-500"}`}>
                            {gateway.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-6">{gateway.desc}</p>
                        <button 
                          onClick={() => toggleGateway(gateway.id)}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${gateway.active ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}
                        >
                          {gateway.active ? "Disconnect" : "Connect Provider"}
                        </button>
                      </div>
                    ))}
                  </div>
                  <button className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-black/5 dark:border-white/5 rounded-3xl text-slate-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all">
                    <Plus size={20} /> Add Custom Payment Endpoint
                  </button>
                  <button 
                    onClick={() => setActiveTab("settings")}
                    className="mt-4 w-full py-4 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-emerald-500 transition-colors border-t border-black/5 dark:border-white/5 pt-6"
                  >
                    Back to Settings
                  </button>
               </div>
             )}

             {activeTab === "gateways" && selectedGatewayConfig && (
               <div className="flex flex-col gap-6 animate-in zoom-in-95 duration-300">
                 <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/5 pb-4">
                    <button 
                      onClick={() => setSelectedGatewayConfig(null)}
                      className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col items-start text-left">
                      <h4 className="font-bold text-slate-900 dark:text-white">Configure {gateways.find(g => g.id === selectedGatewayConfig)?.name}</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Secure Provider Integration</p>
                    </div>
                  </div>

                  <div className="space-y-6 py-4">
                    {(selectedGatewayConfig === "mpesa" || selectedGatewayConfig === "airtel" || selectedGatewayConfig === "mtn") && (
                      <div className="space-y-4 flex flex-col items-start text-left">
                        <div className="space-y-2 w-full flex flex-col items-start">
                          <label className="text-[10px] uppercase font-bold text-slate-500 ml-2">Mobile Number (MSISDN)</label>
                          <input 
                            type="tel"
                            value={configForm.phoneNumber}
                            onChange={e => setConfigForm({...configForm, phoneNumber: e.target.value})}
                            placeholder="+254 7XX XXX XXX"
                            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500/30 transition-all font-mono text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-2 w-full flex flex-col items-start">
                          <label className="text-[10px] uppercase font-bold text-slate-500 ml-2">App ID / Merchant Shortcode (Optional)</label>
                          <input 
                            type="text"
                            placeholder="600492"
                            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500/30 transition-all font-mono text-slate-900 dark:text-white"
                          />
                        </div>
                        <p className="text-[9px] text-slate-400 italic ml-2">Your wallet will be verified via a STK Push or SMS challenge.</p>
                      </div>
                    )}

                    {selectedGatewayConfig === "paystack" && (
                      <div className="flex flex-col items-start gap-4">
                        <div className="space-y-2 w-full flex flex-col items-start">
                          <label className="text-[10px] uppercase font-bold text-slate-500 ml-2 text-left">Public Key</label>
                          <input 
                            type="text"
                            value={configForm.apiKey}
                            onChange={e => setConfigForm({...configForm, apiKey: e.target.value})}
                            placeholder="pk_test_..."
                            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500/30 transition-all font-mono text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-center gap-3 w-full">
                          <Shield size={16} className="text-emerald-500" />
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 text-left">Keys are encrypted with AES-256 before storage.</p>
                        </div>
                      </div>
                    )}

                    {(selectedGatewayConfig === "stripe" || selectedGatewayConfig === "paypal") && (
                      <div className="p-12 text-center flex flex-col items-center gap-4 border-2 border-dashed border-black/5 dark:border-white/5 rounded-3xl">
                        <Globe size={48} className="text-slate-300" />
                        <p className="text-sm text-slate-500">You will be redirected to the provider's secure portal to authorize access.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setSelectedGatewayConfig(null)}
                      className="flex-1 py-4 rounded-2xl text-xs font-bold bg-black/5 dark:bg-white/5 text-slate-500 hover:bg-black/10 transition-all uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleConnectGateway}
                      disabled={loading}
                      className="flex-[2] py-4 rounded-2xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest"
                    >
                      {loading ? "Verifying Credentials..." : "Authorize & Link Provider"}
                    </button>
                  </div>
               </div>
             )}

             {activeTab === "notifications" && (
                <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                   <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/5 pb-4">
                    <button 
                      onClick={() => setActiveTab("settings")}
                      className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <h4 className="font-bold text-slate-900 dark:text-white">Push & Alert Preferences</h4>
                  </div>
                   <div className="space-y-4">
                      {notificationSettings.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-white dark:bg-black/40 rounded-xl">
                              <item.icon size={18} className="text-emerald-500" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">{item.label}</span>
                              <span className="text-[10px] text-slate-500">{item.desc}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => toggleNotification(item.id)}
                            className={`w-12 h-6 rounded-full relative transition-all ${item.enabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${item.enabled ? "right-1" : "left-1"}`} />
                          </button>
                        </div>
                      ))}
                   </div>
                   <button 
                    onClick={() => setActiveTab("settings")}
                    className="mt-4 w-full py-4 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-emerald-500 transition-colors border-t border-black/5 dark:border-white/5 pt-6"
                  >
                    Save & Close
                  </button>
                </div>
             )}

             {activeTab === "language" && (
                <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                   <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/5 pb-4">
                    <button 
                      onClick={() => setActiveTab("settings")}
                      className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <h4 className="font-bold text-slate-900 dark:text-white">Interface Language</h4>
                  </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { code: "en", name: "English (US)", flag: "🇺🇸" },
                        { code: "es", name: "Español", flag: "🇪🇸" },
                        { code: "fr", name: "Français", flag: "🇫🇷" },
                        { code: "de", name: "Deutsch", flag: "🇩🇪" },
                      ].map((lang) => (
                        <button 
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className={`p-6 rounded-3xl border flex items-center justify-between transition-all ${i18n.language === lang.code ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-slate-500"}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{lang.flag}</span>
                            <span className="font-bold">{lang.name}</span>
                          </div>
                          {i18n.language === lang.code && <Check size={20} />}
                        </button>
                      ))}
                   </div>
                </div>
             )}
          </GlassCard>

          <button className="w-full p-6 text-red-500 font-bold bg-red-500/5 hover:bg-red-500/10 rounded-2xl border border-red-500/20 transition-all flex items-center justify-center gap-2">
            <LogOut size={20} /> Logout from all devices
          </button>
        </div>
      </div>
    </div>
  );
}

