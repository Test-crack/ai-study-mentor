
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown } from "lucide-react";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PremiumModal = ({ isOpen, onClose }: PremiumModalProps) => {
  const plans = [
    {
      name: "Basic",
      price: "$9.99",
      period: "/month",
      description: "Perfect for individual learners",
      features: [
        "Upload up to 10 documents/month",
        "Analyze 5 YouTube videos/month",
        "Basic AI study guides",
        "Progress tracking",
        "Email support"
      ],
      popular: false,
      buttonText: "Start Basic",
      gradient: "from-blue-500 to-purple-500"
    },
    {
      name: "Premium",
      price: "$19.99",
      period: "/month",
      description: "Most popular for serious students",
      features: [
        "Unlimited document uploads",
        "Unlimited YouTube video analysis",
        "Advanced AI tutoring sessions",
        "Personalized study schedules",
        "Detailed learning analytics",
        "Priority support",
        "Export study materials"
      ],
      popular: true,
      buttonText: "Go Premium",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      name: "Pro",
      price: "$39.99",
      period: "/month",
      description: "For power users and teams",
      features: [
        "Everything in Premium",
        "AI-powered weakness detection",
        "Custom learning paths",
        "Advanced concept mapping",
        "Integration with learning platforms",
        "Dedicated account manager",
        "Early access to new features"
      ],
      popular: false,
      buttonText: "Upgrade to Pro",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-3">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Unlock Your Learning Potential
          </DialogTitle>
          <DialogDescription className="text-lg">
            Choose the perfect plan to accelerate your learning journey with AI-powered features
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular 
                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 scale-105' 
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-1">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className={`w-full bg-gradient-to-r ${plan.gradient} hover:opacity-90 transition-opacity`}
                size="lg"
              >
                {plan.popular && <Crown className="h-4 w-4 mr-2" />}
                {!plan.popular && <Zap className="h-4 w-4 mr-2" />}
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>

        {/* Premium Features Highlight */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
          <h3 className="text-xl font-bold text-center mb-4">Why Go Premium?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-2">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-1">AI Tutoring</h4>
              <p className="text-muted-foreground">One-on-one sessions with adaptive AI</p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-2">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-1">Unlimited Access</h4>
              <p className="text-muted-foreground">No limits on uploads or analysis</p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-2">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold mb-1">Advanced Analytics</h4>
              <p className="text-muted-foreground">Deep insights into learning patterns</p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-orange-100 rounded-full w-fit mx-auto mb-2">
                <Crown className="h-6 w-6 text-orange-600" />
              </div>
              <h4 className="font-semibold mb-1">Priority Support</h4>
              <p className="text-muted-foreground">Get help when you need it most</p>
            </div>
          </div>
        </div>

        {/* Money Back Guarantee */}
        <div className="text-center mt-6 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            <Check className="h-4 w-4 inline mr-1" />
            30-day money-back guarantee • Cancel anytime • No hidden fees
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
