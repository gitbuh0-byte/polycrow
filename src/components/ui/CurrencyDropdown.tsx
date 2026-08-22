import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { currencies, getCurrencyData } from "../../lib/currencyUtils";
import { getUSDExchangeRates, ExchangeRates, convertFromUSD } from "../../lib/marketRates";

interface CurrencyDropdownProps {
  value: string;
  onChange: (value: string) => void;
  type: "fiat" | "crypto" | "all";
  baseAmount?: number; // Optional amount in USD to show conversion
}

export function CurrencyDropdown({ value, onChange, type, baseAmount }: CurrencyDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCurrencies = currencies
    .filter(c => type === "all" || (c as any).type === type)
    .filter(c => 
      c.label.toLowerCase().includes(search.toLowerCase()) || 
      c.id.toLowerCase().includes(search.toLowerCase())
    );

  const selectedCurrency = getCurrencyData(value);
  const SelectedIcon = selectedCurrency?.icon;

  useEffect(() => {
    getUSDExchangeRates().then(setRates);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl outline-none focus:border-emerald-500/30 transition-all text-slate-900 dark:text-white"
      >
        <div className="flex items-center gap-3">
          {selectedCurrency ? (
            <>
              {SelectedIcon && <SelectedIcon size={18} className={selectedCurrency.color} />}
              <span className="font-bold">{selectedCurrency.label}</span>
              <span className="text-[10px] text-slate-500 font-mono uppercase bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-lg border border-black/5 dark:border-white/5">{selectedCurrency.id}</span>
            </>
          ) : (
            <span className="text-slate-400">Select Currency</span>
          )}
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 p-2 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="relative mb-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              autoFocus
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-emerald-500/20 rounded-xl pl-12 pr-4 py-3 text-sm outline-none transition-all"
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredCurrencies.length > 0 ? (
              filteredCurrencies.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onChange(c.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all hover:bg-emerald-500/5 group ${value === c.id ? "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"}`}
                >
                  <div className="flex items-center gap-3">
                    {(() => {
                      const CurrencyIcon = c.icon;
                      return <CurrencyIcon size={16} className={value === c.id ? c.color : "text-slate-400 group-hover:text-emerald-500"} />;
                    })()}
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold">{c.label}</span>
                      <span className="text-[10px] uppercase font-mono tracking-tighter opacity-60">{c.id}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {baseAmount !== undefined && rates && (
                      <span className="text-[10px] font-mono font-bold">
                         {convertFromUSD(baseAmount, c.id, rates).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </span>
                    )}
                    {value === c.id && <Check size={14} className="text-emerald-500" />}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 uppercase font-bold tracking-widest">No assets found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
