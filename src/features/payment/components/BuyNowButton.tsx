
import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import { CoursePaymentService } from '../services/course-payment-service';
import { loadRazorpay } from '@/integrations/razorpay';
import { useAuth } from '@/features/auth/hooks/useAuth'; 
import { Loader2 } from 'lucide-react';

interface BuyNowButtonProps {
  courseId: string;
  price: number;
  courseTitle: string;
  onSuccess?: () => void;
  className?: string;
}

export const BuyNowButton: React.FC<BuyNowButtonProps> = ({ 
  courseId, 
  price, 
  courseTitle, 
  onSuccess,
  className 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, session } = useAuth(); // Need to check if useAuth provides session or token

  const handleBuyNow = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase this course.",
        variant: "destructive",
      });
      // Optionally redirect to login
      return;
    }

    setIsLoading(true);

    try {
      const isRazorpayLoaded = await loadRazorpay();
      if (!isRazorpayLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const token = session?.access_token; // Adjust based on actual auth hook
      if (!token) {
         throw new Error('Authentication token not found.');
      }

      // 1. Create Checkout Session
      const order = await CoursePaymentService.createCheckoutSession(courseId, token);

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error('Razorpay Key ID is missing. Please check your .env configuration.');
      }

      // 2. Open Razorpay Modal
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: "AI Study Mentor",
        description: `Purchase: ${courseTitle}`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // 3. Verify Payment
            await CoursePaymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }, token);

            toast({
              title: "Payment Successful",
              description: "You have successfully enrolled in the course!",
            });

            if (onSuccess) {
              onSuccess();
            }
          } catch (verifyError: any) {
             console.error('Verification Error:', verifyError);
             toast({
              title: "Payment Verification Failed",
              description: verifyError.message || "Contact support if money was deducted.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: user.email?.split('@')[0] || 'User', // Fallback
          email: user.email,
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: any){
         toast({
              title: "Payment Failed",
              description: response.error.description || "The payment could not be completed.",
              variant: "destructive",
         });
      });
      
      rzp1.open();

    } catch (error: any) {
      console.error('Checkout Error:', error);
      toast({
        title: "Checkout Failed",
        description: error.message || "An error occurred during checkout.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleBuyNow} 
      disabled={isLoading} 
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        `Buy Now - ₹${price}`
      )}
    </Button>
  );
};
