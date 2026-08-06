
// ===================================
// components/payment/PaymentSuccess.tsx
// ===================================

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import confetti from 'canvas-confetti';

const  PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [planDetails, setPlanDetails] = useState<any>(null);

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // Verify payment and get plan details
    verifyPayment();

    return () => clearInterval(interval);
  }, []);

  const verifyPayment = async () => {
    const sessionId = searchParams.get('session_id');
    const paymentId = searchParams.get('payment_id');

    // Simulate verification delay
    setTimeout(() => {
      setIsVerifying(false);
      setPlanDetails({
        name: 'Pro Plan',
        features: [
          'Unlimited AI Notes Upload',
          'Advanced YouTube Learning',
          'KTMG with Callbacks',
          'AI Quiz Generation',
          'Priority Support'
        ]
      });
    }, 2000);
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-teal-600 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-teal-50 via-white to-brand-blue-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <Card className="border-2 border-green-500 shadow-2xl">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            </motion.div>
            <CardTitle className="text-3xl font-bold">
              Payment Successful! 🎉
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Welcome to the AI Study Mentor Pro family!
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-brand-teal-500 to-brand-blue-600 text-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Your Pro Plan is Active</h3>
                <Badge className="bg-white text-brand-teal-600">ACTIVE</Badge>
              </div>
              <p className="text-sm opacity-90">
                You now have unlimited access to all Pro features. Start your learning journey with AI-powered study tools!
              </p>
            </div>

            {planDetails && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-brand-teal-600" />
                  Your Pro Features:
                </h4>
                <ul className="space-y-2">
                  {planDetails.features.map((feature: string, index: number) => (
                    <motion.li
                      key={feature}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center text-sm"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-brand-teal-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">What's Next?</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Upload your first study document</li>
                <li>• Try the YouTube learning feature</li>
                <li>• Set up your KTMG study plan</li>
                <li>• Generate your first AI quiz</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                className="flex-1"
                size="lg"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/notes/new')}
              >
                Upload First Note
              </Button>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-6"
        >
          <p className="text-sm text-muted-foreground">
            Need help? Contact us at{' '}
            <a href="mailto:support@aistudymentor.com" className="text-brand-teal-600 hover:underline">
              support@aistudymentor.com
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;