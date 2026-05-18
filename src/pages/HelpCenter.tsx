import { GlassCard } from "../components/ui/GlassCard";
import { HelpCircle, Book, MessageSquare, Search, ChevronDown, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function HelpCenter() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: "How does the escrow work?", a: "Poly-Crow locks funds from all participants into a secure digital vault. Once conditions are met, funds are released to the rightful party." },
    { q: "What happens if an agreement is broken?", a: "If a breach claim is verified, the person who broke the agreement loses their stake, and it is automatically awarded to the other participants." },
    { q: "How is my reliability score calculated?", a: "Reliability is based on successful fulfillment of agreements and lack of disputes. High scores grant lower platform fees." },
    { q: "Are payments secure?", a: "We use military-grade encryption and secure payment gateways (Stripe/PayPal) to process all transactions." }
  ];

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h2 className="text-4xl font-display font-bold">{t("help")}</h2>
        <p className="text-white/40">Find answers and get support for your escrow agreements.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={20} />
        <input 
          placeholder="Search for topics, guides, or rules..."
          className="w-full bg-white/5 border border-white/10 rounded-3xl pl-16 pr-8 py-5 outline-none focus:border-white/20 transition-all text-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="flex flex-col gap-4 text-center items-center">
          <Book className="text-indigo-400" size={32} />
          <h3 className="font-bold">Knowledge Base</h3>
          <p className="text-xs text-white/40">Master the art of escrow with our detailed guides.</p>
        </GlassCard>
        <GlassCard className="flex flex-col gap-4 text-center items-center">
          <MessageSquare className="text-indigo-400" size={32} />
          <h3 className="font-bold">Live Support</h3>
          <p className="text-xs text-white/40">Chat with our trust officers 24/7 for dispute resolution.</p>
        </GlassCard>
        <GlassCard className="flex flex-col gap-4 text-center items-center">
          <ShieldAlert className="text-indigo-400" size={32} />
          <h3 className="font-bold">Safety Center</h3>
          <p className="text-xs text-white/40">Learn about our multi-layer security protocols.</p>
        </GlassCard>
      </div>

      <GlassCard className="flex flex-col gap-6">
        <h3 className="text-2xl font-display font-bold">Frequently Asked Questions</h3>
        <div className="flex flex-col gap-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-white/5 last:border-0">
              <button 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between py-6 group"
              >
                <span className="font-bold text-lg group-hover:text-indigo-400 transition-colors">{faq.q}</span>
                <ChevronDown size={20} className={`transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 text-white/60 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
