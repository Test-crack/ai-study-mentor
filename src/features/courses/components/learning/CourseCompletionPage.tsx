import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import {
  Trophy,
  Award,
  Share2,
  ArrowRight,
  BookOpen,
  Clock,
  CheckCircle,
  Download,
  Star,
  Sparkles,
} from 'lucide-react';
import { CourseDetail } from '../../types';
import confetti from 'canvas-confetti';
import { useEffect, useState } from 'react';

interface CourseCompletionPageProps {
  course: CourseDetail;
  completedAt: string;
}

export function CourseCompletionPage({ course, completedAt }: CourseCompletionPageProps) {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  // Trigger confetti and animate content on mount
  useEffect(() => {
    // Delay content appearance for dramatic effect
    const contentTimer = setTimeout(() => setShowContent(true), 500);

    // Confetti burst
    const duration = 4000;
    const end = Date.now() + duration;

    // Initial big burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#9333ea', '#6366f1', '#22c55e', '#f59e0b', '#ec4899'],
    });

    // Continuous side confetti
    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#9333ea', '#6366f1', '#22c55e'],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#9333ea', '#6366f1', '#22c55e'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    return () => clearTimeout(contentTimer);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Self-paced';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} minutes`;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative pt-12 pb-8 text-center">
        <div className={`transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full mb-6 shadow-2xl shadow-yellow-500/30 animate-bounce">
            <Trophy className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Congratulations! 🎉
          </h1>
          <p className="text-xl text-purple-200 max-w-md mx-auto">
            You've successfully completed the course
          </p>
        </div>
      </div>

      {/* Certificate Card */}
      <div className={`max-w-3xl mx-auto px-4 pb-12 transition-all duration-1000 delay-300 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <Card className="bg-white shadow-2xl border-0 overflow-hidden relative">
          {/* Decorative corner elements */}
          <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-purple-500 to-transparent opacity-20" />
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-indigo-500 to-transparent opacity-20" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-purple-500 to-transparent opacity-20" />
          <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-indigo-500 to-transparent opacity-20" />

          {/* Certificate Header */}
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                <span className="text-sm font-medium tracking-widest uppercase text-gray-300">
                  Certificate of Completion
                </span>
                <Sparkles className="h-5 w-5 text-yellow-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">{course.title}</h2>
              {course.Domain && (
                <span className="inline-block mt-3 px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300">
                  {course.Domain.name}
                </span>
              )}
            </div>
          </div>

          {/* Certificate Body */}
          <div className="p-8 md:p-12">
            {/* Achievement Stars */}
            <div className="flex justify-center gap-1 mb-8">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>

            {/* Course Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm text-gray-500">Modules</p>
                <p className="font-bold text-gray-900 text-lg">{course.modules.length}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-bold text-gray-900 text-lg">
                  {formatDuration(course.duration_minutes)}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-bold text-green-600 text-lg">Completed</p>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-xl">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-2">
                  <Award className="h-5 w-5 text-indigo-600" />
                </div>
                <p className="text-sm text-gray-500">Completed On</p>
                <p className="font-bold text-gray-900 text-lg">{formatDate(completedAt)}</p>
              </div>
            </div>

            {/* Divider with seal */}
            <div className="relative my-8">
              <div className="border-t border-dashed border-gray-200" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <Award className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            {/* Course Description */}
            <div className="text-center mb-8 mt-12">
              <p className="text-gray-600 max-w-xl mx-auto leading-relaxed">
                {course.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-2 hover:bg-gray-50"
                onClick={() => {
                  // TODO: Implement certificate download
                  alert('Certificate download coming soon!');
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Certificate
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-2 hover:bg-gray-50"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `I completed ${course.title}!`,
                      text: `I just completed the "${course.title}" course!`,
                      url: window.location.origin + `/courses/${course.slug}`,
                    });
                  } else {
                    navigator.clipboard.writeText(
                      `I just completed the "${course.title}" course! ${window.location.origin}/courses/${course.slug}`
                    );
                    alert('Link copied to clipboard!');
                  }
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Achievement
              </Button>
            </div>
          </div>
        </Card>

        {/* Continue Learning */}
        <div className="mt-8 text-center">
          <p className="text-purple-200 mb-4">Ready for your next challenge?</p>
          <Button
            size="lg"
            onClick={() => navigate('/courses')}
            className="bg-white text-purple-700 hover:bg-purple-50 shadow-xl hover:shadow-2xl transition-all"
          >
            Explore More Courses
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
