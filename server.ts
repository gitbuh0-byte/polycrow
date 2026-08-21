import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mpesaRequests = new Map<string, string>();

function normalizeMpesaPhone(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  return digits;
}

async function getMpesaAccessToken() {
  const credentials = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64");
  const response = await fetch(`${process.env.MPESA_BASE_URL || "https://sandbox.safaricom.co.ke"}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` }
  });
  const data = await response.json() as { access_token?: string; errorMessage?: string };
  if (!response.ok || !data.access_token) throw new Error(data.errorMessage || "M-Pesa authentication failed");
  return data.access_token;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/mpesa/stkpush", async (req, res) => {
    try {
      const { phoneNumber, amount } = req.body as { phoneNumber?: string; amount?: number };
      const required = ["MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET", "MPESA_SHORTCODE", "MPESA_PASSKEY", "MPESA_CALLBACK_URL"];
      const missing = required.filter(key => !process.env[key]);
      if (missing.length > 0) return res.status(503).json({ success: false, error: `Missing M-Pesa configuration: ${missing.join(", ")}` });

      const normalizedPhone = normalizeMpesaPhone(phoneNumber || "");
      const numericAmount = Number(amount);
      if (!/^2547\d{8}$/.test(normalizedPhone)) return res.status(400).json({ success: false, error: "Use a valid Kenyan phone number, for example 0712345678." });
      if (!Number.isInteger(numericAmount) || numericAmount < 1) return res.status(400).json({ success: false, error: "M-Pesa amount must be a whole number of at least 1 KES." });

      const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
      const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString("base64");
      const token = await getMpesaAccessToken();
      const response = await fetch(`${process.env.MPESA_BASE_URL || "https://sandbox.safaricom.co.ke"}/mpesa/stkpush/v1/processrequest`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          BusinessShortCode: process.env.MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: process.env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline",
          Amount: numericAmount,
          PartyA: normalizedPhone,
          PartyB: process.env.MPESA_SHORTCODE,
          PhoneNumber: normalizedPhone,
          CallBackURL: process.env.MPESA_CALLBACK_URL,
          AccountReference: process.env.MPESA_ACCOUNT_REFERENCE || "POLYCROW",
          TransactionDesc: process.env.MPESA_TRANSACTION_DESC || "Poly-Crow escrow deposit"
        })
      });
      const data = await response.json() as { ResponseCode?: string; ResponseDescription?: string; CheckoutRequestID?: string };
      if (data.CheckoutRequestID) mpesaRequests.set(data.CheckoutRequestID, timestamp);
      return res.status(response.ok && data.ResponseCode === "0" ? 200 : 502).json({
        success: response.ok && data.ResponseCode === "0",
        checkoutRequestId: data.CheckoutRequestID,
        ResponseDescription: data.ResponseDescription,
        error: data.ResponseCode === "0" ? undefined : data.ResponseDescription || "M-Pesa rejected the request."
      });
    } catch (error) {
      console.error("M-Pesa STK Push error:", error);
      return res.status(502).json({ success: false, error: "M-Pesa service is unavailable." });
    }
  });

  app.post("/api/mpesa/status", async (req, res) => {
    try {
      const checkoutRequestId = String(req.body?.checkoutRequestId || "");
      const timestamp = mpesaRequests.get(checkoutRequestId);
      if (!checkoutRequestId || !timestamp) return res.status(400).json({ success: false, pending: false, error: "Unknown M-Pesa checkout request." });

      const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString("base64");
      const token = await getMpesaAccessToken();
      const response = await fetch(`${process.env.MPESA_BASE_URL || "https://sandbox.safaricom.co.ke"}/mpesa/stkpushquery/v1/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ BusinessShortCode: process.env.MPESA_SHORTCODE, Password: password, Timestamp: timestamp, CheckoutRequestID: checkoutRequestId })
      });
      const data = await response.json() as { ResultCode?: string; ResultDesc?: string };
      if (data.ResultCode === "0") mpesaRequests.delete(checkoutRequestId);
      const terminal = ["0", "1032", "1037", "1", "2001"].includes(data.ResultCode || "");
      return res.json({ success: response.ok && data.ResultCode === "0", pending: response.ok && !terminal, error: data.ResultCode === "0" || !terminal ? undefined : data.ResultDesc || "M-Pesa payment failed." });
    } catch (error) {
      console.error("M-Pesa status error:", error);
      return res.status(502).json({ success: false, pending: true, error: "Unable to check M-Pesa payment status." });
    }
  });

  app.post("/api/mpesa/callback", (req, res) => {
    console.log("M-Pesa callback:", JSON.stringify(req.body));
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  });

  // Mock Payment Gateway for simulation
  app.post("/api/simulate-payment", (req, res) => {
    const { amount, agreementId } = req.body;
    // Real-world logic would integrate with Stripe/PayPal here
    res.json({ success: true, transactionId: `sim_${Math.random().toString(36).substr(2, 9)}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Poly-Crow server running on http://localhost:${PORT}`);
  });
}

startServer();
