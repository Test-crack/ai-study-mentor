# Frontend Integration Guide: Razorpay Course Payments

This document details the backend APIs and frontend logic required to integrate Razorpay payments for course purchases.

## 1. Backend API Routes

**Base URL:** `VITE_API_URL` (e.g., `http://localhost:4000`)

### A. Create Checkout Session

- **Endpoint:** `POST /api/payment/checkout`
- **Auth:** Required (Bearer Token)
- **Body:**

```json
{
  "courseId": "uuid-of-course"
}
```

- **Response (Success):**

```json
{
  "id": "order_P0q...",       // Razorpay Order ID
  "currency": "INR",
  "amount": 49900             // Amount in paisa (499.00 INR)
}
```

### B. Verify Payment

- **Endpoint:** `POST /api/payment/verify`
- **Auth:** Required (Bearer Token)
- **Body:**

```json
{
  "razorpay_order_id": "order_P0q...",
  "razorpay_payment_id": "pay_29...",
  "razorpay_signature": "e2ba..."
}
```

- **Response (Success):**

```json
{
  "status": "success"
}
```

## 2. Frontend Implementation Logic

### A. Razorpay Script Loader

- **File:** `src/integrations/razorpay.ts`
- **Function:** `loadRazorpay()`
- **Purpose:** Dynamically loads the `https://checkout.razorpay.com/v1/checkout.js` script.
- **Usage:** Call this before initiating any payment.

### B. Buy Now Button Component

- **File:** `src/features/payment/components/BuyNowButton.tsx`
- **Props:** `courseId` (string), `price` (number), `courseTitle` (string), `onSuccess` (callback).

**Workflow:**

1. **User Click:** User clicks "Buy Now".
2. **Auth Check:** Ensure user is logged in.
3. **API Call (Checkout):** Call `/api/payment/checkout` to get `order_id`.
4. **Razorpay Modal:** Initialize `new window.Razorpay(options)` with the `order_id` and key.
5. **User Payment:** User completes payment in the modal.
6. **Success Callback (handler):** Razorpay returns `payment_id` and `signature`.
7. **API Call (Verify):** Call `/api/payment/verify` with these details.
8. **Completion:** If verify returns success, show toast and trigger `onSuccess` (e.g., refresh page/redirect).

### C. Integration Steps (Recommended)

To complete the integration, place the `<BuyNowButton />` in the Course Detail Sidebar or Content Area.

**Example Usage:**

```tsx
import { BuyNowButton } from '../../payment/components/BuyNowButton';

// Inside your component
<BuyNowButton 
  courseId={course.id} 
  price={Number(course.price)} 
  courseTitle={course.title} 
  onSuccess={() => window.location.reload()} // Reload to update enrollment status
/>
```

## 3. Environment Variables

Ensure these are set in your frontend `.env`:

```env
VITE_API_URL=http://localhost:4000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```
