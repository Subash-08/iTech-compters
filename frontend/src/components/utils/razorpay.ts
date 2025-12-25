declare global {
    interface Window {
        Razorpay: any;
    }
}

// utils/razorpay.ts
export const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.error('❌ Failed to load Razorpay SDK');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};
export const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
};

// Additional TypeScript interfaces for better type safety
export interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

export interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: RazorpayResponse) => void;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    notes?: Record<string, string>;
    theme?: {
        color?: string;
    };
    modal?: {
        ondismiss?: () => void;
        escape?: boolean;
        backdropclose?: boolean;
    };
}

export interface RazorpayError {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
        order_id: string;
        payment_id: string;
    };
}

// Type for Razorpay instance methods
export interface RazorpayInstance {
    open: () => void;
    close: () => void;
    on: (event: string, callback: (response: any) => void) => void;
}