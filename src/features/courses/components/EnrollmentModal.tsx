import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { CheckCircle, Loader2, CreditCard, Shield } from 'lucide-react';
import { CourseDetail } from '../types';
import { coursesService } from '../services/coursesService';
import { toast } from '@/shared/hooks/use-toast';

interface EnrollmentModalProps {
  course: CourseDetail;
  isOpen: boolean;
  onClose: () => void;
  onEnrollmentSuccess: () => void;
}

export function EnrollmentModal({
  course,
  isOpen,
  onClose,
  onEnrollmentSuccess,
}: EnrollmentModalProps) {
  const [enrolling, setEnrolling] = useState(false);

  const formatPrice = (price: number | null) => {
    if (!price || price === 0) return 'Free';
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      // userId is extracted from JWT token in backend middleware
      await coursesService.enrollInCourse(course.id);

      toast.success({
        title: 'Successfully enrolled!',
        description: `You are now enrolled in "${course.title}"`,
      });

      onEnrollmentSuccess();
      onClose();
    } catch (error) {
      console.error('Enrollment failed:', error);
      toast.error({
        title: 'Enrollment failed',
        description:
          error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setEnrolling(false);
    }
  };

  const isFree = !course.price || course.price === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-blue-600 to-brand-teal-600 px-5 py-4 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              {isFree ? 'Enroll for Free' : 'Complete Enrollment'}
            </DialogTitle>
            <DialogDescription className="text-brand-blue-100 text-sm line-clamp-1">
              {course.title}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Course Summary - Compact */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">
              What you'll get:
            </h4>
            <ul className="grid grid-cols-1 gap-1.5">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>{course.modules.length} modules with full access</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Certificate of completion</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Lifetime access</span>
              </li>
            </ul>
          </div>

          <Separator />

          {/* Price Summary - Compact */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Total</span>
            <span className="text-xl font-bold text-brand-blue-600">
              {formatPrice(course.price)}
            </span>
          </div>

          {/* Payment Placeholder - Only for paid courses */}
          {!isFree && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CreditCard className="h-3.5 w-3.5" />
                <span>Payment integration coming soon</span>
              </div>
            </div>
          )}

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
            <Shield className="h-3.5 w-3.5" />
            <span>Secure • 30-day money-back guarantee</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={enrolling}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEnroll}
              disabled={enrolling}
              className="flex-1 bg-brand-blue-600 hover:bg-brand-blue-700 text-white"
            >
              {enrolling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing
                </>
              ) : isFree ? (
                'Enroll Free'
              ) : (
                `Pay ${formatPrice(course.price)}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
