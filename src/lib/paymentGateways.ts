
export interface PaymentGatewayResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export async function initiateMpesaPush(phoneNumber: string, amount: number): Promise<PaymentGatewayResponse> {
  console.log(`Initiating M-Pesa STK Push for ${phoneNumber} - Amount: ${amount}`);
  // Simulated delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Random success
  const success = Math.random() > 0.2;
  return {
    success,
    transactionId: success ? "MPESA_" + Math.random().toString(36).substring(7).toUpperCase() : undefined,
    error: success ? undefined : "User cancelled the request or timeout."
  };
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
