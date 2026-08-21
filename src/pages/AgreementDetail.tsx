import { useTranslation } from "react-i18next";
import { GlassCard } from "../components/ui/GlassCard";
import { 
  initiateMpesaPush, 
  initiateAirtelMoney, 
  initiateMTNMoMo, 
  initiatePaystack 
} from "../lib/paymentGateways";
import { 
  Smartphone,
  ArrowLeft, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  Users,
  Timer,
  DollarSign,
  Bitcoin
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { 
  doc, 
  onSnapshot, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp, 
  updateDoc,
  arrayUnion,
  deleteDoc,
  increment
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { formatAmount, getCurrencyData, gateways } from "../lib/currencyUtils";
import { CountdownTimer } from "../components/ui/CountdownTimer";
import { getUSDExchangeRates, ExchangeRates, convertToUSD } from "../lib/marketRates";

interface AgreementDetailProps {
  agreementId: string;
  onBack: () => void;
}

export default function AgreementDetail({ agreementId, onBack }: AgreementDetailProps) {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [agreement, setAgreement] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUSDExchangeRates().then(setRates);

    const unsubAgreement = onSnapshot(doc(db, "agreements", agreementId), (doc) => {
      if (!doc.exists()) {
        onBack();
        return;
      }
      setAgreement({ id: doc.id, ...doc.data() });
    }, (error) => {
      console.error("Agreement detail error:", error);
    });

    const q = query(
      collection(db, "agreements", agreementId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubMessages = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Agreement messages error:", error);
    });

    return () => {
      unsubAgreement();
      unsubMessages();
    };
  }, [agreementId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [loading, setLoading] = useState(false);

  const processPayment = async () => {
    if (!agreement || !user) return false;
    
    // Find a suitable gateway for the currency
    const gateway = gateways.find(g => g.currencies.includes(agreement.currency)) || gateways[3]; // Fallback to Paystack
    
    let response;
    switch (gateway.id) {
      case "MPESA":
        {
          const phoneNumber = profile?.phoneNumber || user.phoneNumber || "";
          if (!phoneNumber) {
            alert("Add your M-Pesa phone number in Profile before funding this agreement.");
            return false;
          }
          response = await initiateMpesaPush(phoneNumber, Math.ceil(Number(agreement.stakes)));
        }
        break;
      case "AIRTEL":
        response = await initiateAirtelMoney(user.email, agreement.stakes);
        break;
      case "MTN":
        response = await initiateMTNMoMo(user.email, agreement.stakes);
        break;
      case "PAYSTACK":
        response = await initiatePaystack(user.email, agreement.stakes);
        break;
      default:
        return true; 
    }

    if (!response.success) {
      alert(`Gateway Error: ${response.error}`);
      return false;
    }
    
    return true;
  };

  const handleFundEscrow = async () => {
    if (!user || !profile || !agreement) return;
    setLoading(true);
    
    // Check balance first
    const cid = agreement.currency || "USD";
    const currentBalance = Math.max(0, profile.balances?.[cid] || 0);
    const stakes = parseFloat(agreement.stakes);

    if (currentBalance < (stakes - 0.00000001)) {
      alert(`Insufficient ${cid} balance in your wallet. (Available: ${currentBalance.toLocaleString(undefined, { maximumFractionDigits: (getCurrencyData(cid) as any)?.type === "crypto" ? 8 : 2 })})`);
      setLoading(false);
      return;
    }

    const paid = await processPayment();
    if (!paid) {
      setLoading(false);
      return;
    }

    try {
      // Deduct balance
      const updateData: any = {
        [`balances.${cid}`]: increment(-stakes)
      };
      await updateDoc(doc(db, "users", user.uid), updateData);

      // Add transaction record
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        type: "escrow_lock",
        amount: stakes,
        asset: cid,
        agreementId: agreement.id,
        status: "completed",
        timestamp: serverTimestamp()
      });

      const isInvited = !agreement.participants.includes(user.uid) && agreement.invitedParticipants?.includes(user.email);
      const updatedFunded = { ...agreement.isFunded, [user.uid]: true };
      
      let participants = [...agreement.participants];
      if (isInvited) participants.push(user.uid);

      const isFullyFunded = participants.length >= 2 && 
                           participants.every((uid: string) => updatedFunded[uid]);

      await updateDoc(doc(db, "agreements", agreement.id), {
        participants: isInvited ? arrayUnion(user.uid) : agreement.participants,
        [`isFunded.${user.uid}`]: true,
        status: isFullyFunded ? "active" : "pending"
      });
      
      alert(isInvited ? "Welcome to the agreement! Your stake has been locked." : "Stake locked. Waiting for partner.");
    } catch (e) {
      console.error(e);
      alert("Failed to update agreement state.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    await addDoc(collection(db, "agreements", agreementId, "messages"), {
      senderId: user.uid,
      text: newMessage,
      timestamp: serverTimestamp(),
    });
    setNewMessage("");
  };

  const handleBreach = async () => {
    if (!agreement || !user) return;
    await updateDoc(doc(db, "agreements", agreementId), {
      status: "breached",
      liquidator: user.uid,
    });
    // Multi-user logic: This would typically trigger a dispute flow
  };

  if (!agreement) return null;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
            agreement.status === "active" ? "bg-green-500/10 text-green-500 dark:text-green-400 border-green-500/20" : "bg-black/5 dark:bg-white/5 text-slate-400 dark:text-white/40 border-black/5 dark:border-white/10"
          }`}>
            {agreement.status}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 flex flex-col gap-8">
          <GlassCard className="flex flex-col gap-8 border-white/5 bg-white/5 rounded-[32px] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400 font-bold mb-1 block">Active Agreement</span>
                <h2 className="text-4xl font-display font-bold text-slate-900 dark:text-white">{agreement.title}</h2>
                <div className="flex items-center gap-4 text-slate-500">
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span className="text-xs">{agreement.participants.length} Participants</span>
                  </div>
                  <div className="w-1 h-1 bg-black/10 dark:bg-white/20 rounded-full" />
                  <span className="text-xs">Audit ID: #{agreement.id.substring(0, 8)}</span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-1 block">Status</span>
                <p className={`text-xl font-bold ${agreement.status === "active" ? "text-emerald-400" : "text-blue-400 animate-pulse"}`}>
                  {agreement.status === "active" ? "LOCKED & SECURE" : "PENDING FUNDING"}
                </p>
              </div>
            </div>

            <div className="bg-black/5 dark:bg-black/20 p-6 rounded-2xl border border-black/5 dark:border-white/5">
              <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-4 tracking-widest leading-none">Agreement Terms</h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{agreement.description}</p>
              {agreement.dealCode && (
                <div className="mt-4 p-3 bg-black/10 dark:bg-black/40 rounded-xl border border-black/5 dark:border-white/10 font-mono text-xs text-emerald-600 dark:text-emerald-400/60 w-fit">
                  DEAL AUTH CODE: {agreement.dealCode}
                </div>
              )}
              {agreement.status === "pending" && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                  Note: This agreement will expire if not funded within 10 minutes.
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {!agreement.isFunded?.[user?.uid] && agreement.status === "pending" ? (
                <button 
                  onClick={handleFundEscrow}
                  disabled={loading}
                  className="col-span-2 bg-emerald-500 text-black font-bold py-5 rounded-3xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 uppercase tracking-widest text-lg disabled:opacity-50"
                >
                  {loading ? "Processing Secure Gateway..." : (
                    <>
                      <Smartphone size={24} /> 
                      {agreement.participants.includes(user?.uid) ? "Lock My Stake" : "Join & Fund Escrow"} 
                      ({formatAmount(agreement.stakes, agreement.currency || "USD")})
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => {}} 
                    className="emerald-button py-4 rounded-2xl flex items-center justify-center gap-2 text-sm uppercase tracking-widest disabled:opacity-50"
                    disabled={agreement.status !== "active"}
                  >
                    <CheckCircle2 size={18} /> Mark as Completed
                  </button>
                  <button 
                    onClick={handleBreach}
                    className="bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white font-bold py-4 rounded-2xl border border-black/5 dark:border-white/10 transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-widest disabled:opacity-50"
                    disabled={agreement.status !== "active"}
                  >
                    <ShieldAlert size={18} /> Raise Dispute
                  </button>
                </>
              )}
            </div>
          </GlassCard>

          {/* Chat System */}
          <GlassCard className="flex flex-col gap-6 h-[500px] rounded-[32px] p-0 overflow-hidden bg-white/5 border-white/5">
            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Negotiation Chat</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Secure Monitor Active</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.senderId === user?.uid ? "justify-end" : "justify-start"}`}>
                  {msg.senderId !== user?.uid && (
                    <div className="w-6 h-6 rounded-full bg-slate-600 flex-shrink-0" />
                  )}
                  <div className={`max-w-[80%] p-3 text-xs ${
                    msg.senderId === user?.uid 
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-white border border-emerald-500/20 rounded-tl-xl rounded-br-xl rounded-bl-xl" 
                    : "bg-black/5 dark:bg-white/5 text-slate-800 dark:text-slate-300 border border-black/5 dark:border-white/10 rounded-tr-xl rounded-br-xl rounded-bl-xl"
                  }`}>
                    <p>{msg.text}</p>
                  </div>
                  {msg.senderId === user?.uid && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex-shrink-0" />
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white/5 border-t border-black/5 dark:border-white/5">
              <form onSubmit={handleSendMessage} className="bg-slate-100 dark:bg-black/40 rounded-xl p-2 flex items-center gap-2">
                <input 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-transparent border-none focus:outline-none text-xs flex-1 px-4 text-slate-800 dark:text-slate-300"
                />
                <button className="p-2 text-emerald-500 dark:text-emerald-400 hover:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar info */}
        <div className="flex flex-col gap-8">
          <GlassCard className="flex flex-col gap-6 rounded-[32px] p-8 border-white/5">
            <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-500 border-b border-black/5 dark:border-white/5 pb-4">Escrow Stake</h4>
              <div className="flex flex-col items-center py-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5 shadow-inner">
              <div className="p-4 bg-emerald-500/10 rounded-full mb-4">
                {(() => {
                  const curr = getCurrencyData(agreement.currency || "USD");
                  return <curr.icon className={curr.color} size={32} />;
                })()}
              </div>
              <span className="text-4xl font-display font-bold text-slate-900 dark:text-white text-center px-4">
                {formatAmount(agreement.stakes, agreement.currency || "USD")}
              </span>
              {rates && agreement.currency !== "USD" && (
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  ≈ ${convertToUSD(parseFloat(agreement.stakes), agreement.currency, rates).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                </span>
              )}
              <span className="text-[10px] uppercase font-bold text-emerald-500 dark:text-emerald-400 mt-2 tracking-widest">Locked in Smart Vault</span>
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col gap-6 rounded-[32px] p-8 border-black/5 dark:border-white/5">
            <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-500 border-b border-black/5 dark:border-white/5 pb-4">Secure Audit Log</h4>
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex flex-col items-center gap-3">
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                  {agreement.status === "pending" ? "Funding Window Expires In" : "Withdrawal Window Expires In"}
                </span>
                <CountdownTimer 
                  targetDate={(() => {
                    if (agreement.status === "pending" && agreement.createdAt) {
                        const createdAt = agreement.createdAt.toDate ? agreement.createdAt.toDate() : new Date(agreement.createdAt);
                        return new Date(createdAt.getTime() + 10 * 60000);
                    }
                    return agreement.timerEnd ? new Date(agreement.timerEnd) : undefined;
                  })()}
                  onExpire={async () => {
                    if (agreement.status === "pending") {
                        console.log("Agreement expired while viewing (pending)");
                        await deleteDoc(doc(db, "agreements", agreement.id));
                        onBack();
                    } else if (agreement.status === "active") {
                        console.log("Agreement expired while viewing (active)");
                        await updateDoc(doc(db, "agreements", agreement.id), {
                            status: "completed",
                            completedAt: serverTimestamp()
                        });
                        alert("The secure window has closed. Agreement marked as completed.");
                    }
                  }}
                />
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 mt-1 shadow-[0_0_8px_#10b981]" />
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Channel initialized by {agreement.createdBy === user?.uid ? "you" : "partner"}.
                </p>
              </div>
              {agreement.isFunded?.[user?.uid] && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 mt-1 shadow-[0_0_8px_#10b981]" />
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">Your stake ({agreement.stakes} {agreement.currency}) successfully locked.</p>
                </div>
              )}
              {agreement.status === "active" && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 mt-1 shadow-[0_0_8px_#10b981]" />
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">Full escrow liquidity verified and locked.</p>
                </div>
              )}
            </div>
            <button className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-4 hover:gap-2 transition-all">
              Full Protocol Logs <ArrowLeft size={12} className="rotate-180" />
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
