
export interface PaymentGatewayResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export async function initiateMpesaPush(phoneNumber: string, amount: number): Promise<PaymentGatewayResponse> {
  try {
    const response = await fetch("/api/mpesa/stkpush", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, amount })
    });
    const data = await response.json();
    if (!response.ok || data.success !== true || !data.checkoutRequestId) {
      return { success: false, error: data.error || data.ResponseDescription || "M-Pesa rejected the request." };
    }

    for (let attempt = 0; attempt < 20; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const statusResponse = await fetch("/api/mpesa/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutRequestId: data.checkoutRequestId })
      });
      const status = await statusResponse.json();
      if (status.success === true) return { success: true, transactionId: data.checkoutRequestId };
      if (status.pending !== true) return { success: false, transactionId: data.checkoutRequestId, error: status.error || "M-Pesa payment was not completed." };
    }

    return {
      success: false,
      transactionId: data.checkoutRequestId,
      error: "M-Pesa payment timed out. Check your phone and try again."
    };
  } catch {
    return { success: false, error: "Unable to reach the M-Pesa service." };
  }
}

export async function initiateAirtelMoney(phoneNumber: string, amount: number): Promise<PaymentGatewayResponse> {
  console.log(`Initiating Airtel Money for ${phoneNumber} - Amount: ${amount}`);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const success = Math.random() > 0.2;
  return {
    success,
    transactionId: success ? "AIRTEL_" + Math.random().toString(36).substring(7).toUpperCase() : undefined,
    error: success ? undefined : "Insufficient funds in Airtel wallet."
  };
}

export async function initiateMTNMoMo(phoneNumber: string, amount: number): Promise<PaymentGatewayResponse> {
  console.log(`Initiating MTN MoMo for ${phoneNumber} - Amount: ${amount}`);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const success = Math.random() > 0.2;
  return {
    success,
    transactionId: success ? "MTN_" + Math.random().toString(36).substring(7).toUpperCase() : undefined,
    error: success ? undefined : "MTN Network busy, try again later."
  };
}

export async function initiatePaystack(email: string, amount: number): Promise<PaymentGatewayResponse> {
  console.log(`Initiating Paystack for ${email} - Amount: ${amount}`);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const success = Math.random() > 0.1;
  return {
    success,
    transactionId: success ? "PSTK_" + Math.random().toString(36).substring(7).toUpperCase() : undefined,
    error: success ? undefined : "Connection to Paystack API failed."
  };
}
