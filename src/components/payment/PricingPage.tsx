// components/payment/PricingPage.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Crown, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PaymentService, PRICING_PLANS } from '@/lib/payment/payment-service';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PricingPage: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const paymentService = new PaymentService();

  const plans = [
    {
      id: 'free',
      name: 'Free',
      icon: <Zap className="w-6 h-6" />,
      price_inr: 0,
      price_usd: 0,
      period: 'forever',
      credits: 10,
      color: 'from-gray-500 to-gray-600',
      features: [
        '5 AI Notes Uploads/month',
        'Basic YouTube Learning',
        'KTMG Progress Tracking',
        'Community Support',
        'Basic Study Analytics'
      ],
      limitations: [
        'No Quiz Generation',
        'No Custom Study Plans',
        'Limited AI Analysis'
      ]
    },
    {
      id: billingPeriod === 'monthly' ? 'pro_monthly' : 'pro_yearly',
      name: 'Pro',
      icon: <Sparkles className="w-6 h-6" />,
      price_inr: billingPeriod === 'monthly' ? 499 : 4999,
      price_usd: billingPeriod === 'monthly' ? 9.99 : 99.99,
      period: billingPeriod,
      credits: billingPeriod === 'monthly' ? 100 : 1200,
      popular: true,
      color: 'from-indigo-500 to-purple-600',
      features: [
        'Unlimited AI Notes Upload',
        'Advanced YouTube Learning',
        'KTMG with Callbacks',
        'AI Quiz Generation',
        'Study Analytics Dashboard',
        'Priority Support',
        'Export Study Materials',
        'Custom Reminders'
      ],
      savings: billingPeriod === 'yearly' ? '₹999 saved' : null
    },
    {
      id: 'premium_monthly',
      name: 'Premium',
      icon: <Crown className="w-6 h-6" />,
      price_inr: 999,
      price_usd: 19.99,
      period: 'monthly',
      credits: -1,
      color: 'from-purple-600 to-pink-600',
      features: [
        'Everything in Pro',
        'Personal AI Tutor',
        'Custom Study Plans',
        'Interview Prep Mode',
        '1-on-1 Expert Support',
        'API Access',
        'Certification Prep',
        'Unlimited Everything',
        'White-label Options'
      ]
    }
  ];

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to subscribe to a plan",
        variant: "destructive"
      });
      return;
    }

    if (planId === 'free') {
      toast({
        title: "Free Plan",
        description: "You're already on the free plan!",
      });
      return;
    }

    setIsLoading(true);
    setSelectedPlan(planId);

    try {
      // Detect user region (simplified - you might want to use a geolocation API)
      const region = 'IN'; // Default to India for demo
      
      await paymentService.initializePayment(
        planId,
        user.id,
        user.email || '',
        region
      );

      toast({
        title: "Payment Initiated",
        description: "Complete the payment to activate your subscription",
      });
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "Unable to process payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const ComparisonTable = () => (
    <Dialog open={showComparison} onOpenChange={setShowComparison}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Detailed Plan Comparison</DialogTitle>
        </DialogHeader>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Features</th>
              <th className="text-center p-4">Free</th>
              <th className="text-center p-4">Pro</th>
              <th className="text-center p-4">Premium</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['AI Notes Upload', '5/month', 'Unlimited', 'Unlimited'],
              ['YouTube Learning', 'Basic', 'Advanced', 'Advanced+'],
              ['KTMG Methodology', '✓', '✓ + Callbacks', '✓ + AI Optimization'],
              ['Quiz Generation', '✗', '✓', '✓ + Custom'],
              ['Study Analytics', 'Basic', 'Advanced', 'Enterprise'],
              ['Support', 'Community', 'Priority', '1-on-1'],
              ['API Access', '✗', '✗', '✓'],
              ['Credits', '10', '100/month', 'Unlimited'],
            ].map(([feature, ...values]) => (
              <tr key={feature} className="border-b">
                <td className="p-4 font-medium">{feature}</td>
                {values.map((value, i) => (
                  <td key={i} className="text-center p-4">
                    {value === '✓' ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : value === '✗' ? (
                      <X className="w-5 h-5 text-gray-400 mx-auto" />
                    ) : (
                      value
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-indigo-50/20 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            LIMITED TIME: 50% OFF on Yearly Plans 🎉
          </Badge>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Choose Your Learning Journey
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Unlock AI-powered learning with KTMG methodology
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={billingPeriod === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}>
              Monthly
            </span>
            <Switch
              checked={billingPeriod === 'yearly'}
              onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
            />
            <span className={billingPeriod === 'yearly' ? 'font-semibold' : 'text-muted-foreground'}>
              Yearly
              <Badge className="ml-2" variant="default">Save 20%</Badge>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative h-full ${plan.popular ? 'border-indigo-500 shadow-2xl scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600">
                      MOST POPULAR
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${plan.color} flex items-center justify-center text-white mb-4`}>
                    {plan.icon}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        {plan.price_inr === 0 ? 'Free' : `₹${plan.price_inr}`}
                      </span>
                      {plan.price_inr !== 0 && (
                        <span className="text-muted-foreground">/{plan.period}</span>
                      )}
                    </div>
                    {plan.savings && (
                      <Badge variant="success" className="mt-2">
                        {plan.savings}
                      </Badge>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations?.map((limitation) => (
                      <li key={limitation} className="flex items-start text-muted-foreground">
                        <X className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                    disabled={isLoading && selectedPlan === plan.id}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {isLoading && selectedPlan === plan.id ? (
                      <span className="flex items-center">
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        {plan.price_inr === 0 ? 'Start Free' : 'Get Started'}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Comparison Button */}
        <div className="text-center">
          <Button
            variant="link"
            onClick={() => setShowComparison(true)}
            className="text-indigo-600"
          >
            View Detailed Comparison →
          </Button>
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-muted-foreground mb-4">Trusted by 10,000+ students</p>
          <div className="flex justify-center items-center gap-8">
            <Badge variant="outline">🔒 Secure Payments</Badge>
            <Badge variant="outline">💳 No Hidden Fees</Badge>
            <Badge variant="outline">🔄 Cancel Anytime</Badge>
            <Badge variant="outline">✨ Instant Access</Badge>
          </div>
        </motion.div>

        <ComparisonTable />
      </motion.div>
    </div>
  );
};

export default PricingPage;