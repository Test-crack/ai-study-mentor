import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  GraduationCap,
  BookOpen,
  Brain,
  Zap,
  ArrowRight,
  Play,
  Star,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [processingAuth, setProcessingAuth] = useState(false);

  // Handle auth callbacks (email confirmation, password reset) that land on root URL
  useEffect(() => {
    const handleAuthCallback = async () => {
      const hash = window.location.hash;
      
      if (!hash || !hash.includes("access_token")) {
        return;
      }

      setProcessingAuth(true);
      
      const hashParams = new URLSearchParams(hash.substring(1));
      const type = hashParams.get("type");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      console.log("Auth callback detected, type:", type);

      if (!accessToken) {
        setProcessingAuth(false);
        return;
      }

      try {
        // Set the session from URL tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (error) {
          console.error("Error setting session:", error);
          navigate("/auth?error=invalid_token");
          return;
        }

        // Clear the hash from URL
        window.history.replaceState(null, "", window.location.pathname);

        // Redirect based on auth type
        if (type === "recovery") {
          navigate("/reset-password", { replace: true });
        } else if (type === "signup" || type === "magiclink" || type === "email") {
          navigate("/profile?welcome=true", { replace: true });
        } else if (data.session) {
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setProcessingAuth(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  // Show loading while processing auth callback
  if (processingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600">Verifying your account...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Learning',
      description:
        'Personalized study paths that adapt to your learning style and pace.',
    },
    {
      icon: BookOpen,
      title: 'Smart Notes',
      description:
        'Upload your materials and get AI-generated summaries, flashcards, and quizzes.',
    },
    {
      icon: Zap,
      title: 'Speed Reading',
      description:
        'Improve your reading speed with scientifically-backed assessments and training.',
    },
    {
      icon: GraduationCap,
      title: 'Expert Courses',
      description:
        'Structured courses with modules, assessments, and progress tracking.',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Active Learners' },
    { value: '500+', label: 'Courses' },
    { value: '95%', label: 'Satisfaction Rate' },
    { value: '24/7', label: 'AI Support' },
  ];

  const testimonials = [
    {
      name: 'Sarah M.',
      role: 'Medical Student',
      content:
        'This platform transformed how I study. The AI summaries save me hours every week!',
      rating: 5,
    },
    {
      name: 'James K.',
      role: 'Software Engineer',
      content:
        'The structured courses helped me transition into a new tech stack seamlessly.',
      rating: 5,
    },
    {
      name: 'Priya R.',
      role: 'Graduate Student',
      content:
        'Speed reading training improved my research efficiency by 3x. Highly recommend!',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Test Crack
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/courses')}
                className="text-gray-600 hover:text-gray-900"
              >
                Courses
              </Button>
              {user ? (
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/auth')}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-purple-100 text-purple-700 hover:bg-purple-100">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered Education Platform
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Learn Smarter, Not Harder with{' '}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Transform your learning experience with personalized AI tutoring,
              smart notes, speed reading training, and expert-curated courses.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate(user ? '/dashboard' : '/auth')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-6"
              >
                {user ? 'Go to Dashboard' : 'Start Learning Free'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/courses')}
                className="text-lg px-8 py-6"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Browse Courses
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <div className="text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform combines cutting-edge AI with proven
              learning methodologies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-2 hover:border-purple-200 hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl w-fit mb-4">
                    <feature.icon className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Get started in minutes and transform your learning journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Your Account',
                description:
                  'Sign up for free and set your learning goals and preferences.',
              },
              {
                step: '02',
                title: 'Choose Your Path',
                description:
                  'Browse courses, upload notes, or start with a reading assessment.',
              },
              {
                step: '03',
                title: 'Learn & Grow',
                description:
                  'Track your progress, earn achievements, and master new skills.',
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Loved by Learners
            </h2>
            <p className="text-lg text-gray-600">
              Join thousands of students achieving their goals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-lg text-purple-100 mb-8">
            Join thousands of learners already using AI to study smarter.
          </p>
          <Button
            size="lg"
            onClick={() => navigate(user ? '/dashboard' : '/auth')}
            className="bg-white text-purple-600 hover:bg-purple-50 text-lg px-8 py-6"
          >
            {user ? 'Go to Dashboard' : 'Get Started Free'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-purple-200 text-sm mt-4">
            No credit card required • Free forever plan available
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Test Crack</span>
            </div>
            <p className="text-sm">
              © 2025 Test Crack. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
