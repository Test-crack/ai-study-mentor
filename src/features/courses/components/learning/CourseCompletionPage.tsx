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
} from 'lucide-react';
import { CourseDetail } from '../../types';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface CourseCompletionPageProps {
  course: CourseDetail;
  completedAt: string;
}

export function CourseCompletionPage({ course, completedAt }: CourseCompletionPageProps) {
  const navigate = useNavigate();

  // Trigger confetti on mount
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#9333ea', '#6366f1', '#22c55e'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#9333ea', '#6366f1', '#22c55e'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
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
    return mins > 0 ? `${hours} hours ${mins} minutes` : `${hours} hours`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
            <Trophy className="h-10 w-10 text-yellow-300" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Congratulations! 🎉
          </h1>
          <p className="text-xl text-purple-100">
            You've successfully completed this course
          </p>
        </div>
      </div>

      {/* Certificate Card */}
      <div className="max-w-3xl mx-auto px-4 -mt-8">
        <Card className="bg-white shadow-2xl border-0 overflow-hidden">
          {/* Certificate Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Award className="h-6 w-6 text-yellow-400" />
              <span className="text-sm font-medium tracking-wider uppercase text-gray-300">
                Certificate of Completion
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">{course.title}</h2>
          </div>

          {/* Certificate Body */}
          <div className="p-8 md:p-12">
            {/* Course Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm text-gray-500">Modules</p>
                <p className="font-semibold text-gray-900">{course.modules.length}</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-semibold text-gray-900">
                  {formatDuration(course.duration_minutes)}
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-semibold text-green-600">Completed</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-2">
                  <Award className="h-5 w-5 text-indigo-600" />
                </div>
                <p className="text-sm text-gray-500">Completed On</p>
                <p className="font-semibold text-gray-900">{formatDate(completedAt)}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-200 my-8" />

            {/* Course Info */}
            <div className="text-center mb-8">
              {course.Domain && (
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
                  {course.Domain.name}
                </span>
              )}
              <p className="text-gray-600 max-w-xl mx-auto">
                {course.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
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
                className="w-full sm:w-auto"
                onClick={() => {
                  // TODO: Implement share functionality
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
        <div className="mt-8 text-center pb-12">
          <p className="text-gray-600 mb-4">Ready for your next challenge?</p>
          <Button
            onClick={() => navigate('/courses')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Explore More Courses
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
