
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export interface CheckoutResponse {
    id: string; // Razorpay Order ID
    currency: string;
    amount: number;
}

export interface VerifyPaymentPayload {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export interface VerifyResponse {
    status: string;
}

export const CoursePaymentService = {
    async createCheckoutSession(courseId: string, token: string): Promise<CheckoutResponse> {
        const response = await fetch(`${API_URL}/api/payment/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ courseId }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to create checkout session');
        }

        return response.json();
    },

    async verifyPayment(payload: VerifyPaymentPayload, token: string): Promise<VerifyResponse> {
        const response = await fetch(`${API_URL}/api/payment/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Payment verification failed');
        }

        return response.json();
    }
};
