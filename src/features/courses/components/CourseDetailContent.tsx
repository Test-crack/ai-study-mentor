import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';
import {
  Clock,
  BarChart,
  BookOpen,
  Users,
  CheckCircle,
  PlayCircle,
  FileText,
} from 'lucide-react';
import { CourseDetail, DifficultyType } from '../types';
import { useEffect } from 'react';

interface CourseDetailContentProps {
  course: CourseDetail;
}

export function CourseDetailContent({ course }: CourseDetailContentProps) {

  useEffect(() => {
    // This forces the laptop browser to start at the very top (0,0)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);


  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Self-paced';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} minutes`;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
  };

  const getDifficultyLabel = (difficulty: DifficultyType | null) => {
    switch (difficulty) {
      case DifficultyType.BEGINNER:
        return 'Beginner';
      case DifficultyType.INTERMEDIATE:
        return 'Intermediate';
      case DifficultyType.ADVANCED:
        return 'Advanced';
      default:
        return 'All Levels';
    }
  };

  const getDifficultyColor = (difficulty: DifficultyType | null) => {
    switch (difficulty) {
      case DifficultyType.BEGINNER:
        return 'bg-green-100 text-green-800';
      case DifficultyType.INTERMEDIATE:
        return 'bg-yellow-100 text-yellow-800';
      case DifficultyType.ADVANCED:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalConcepts = course.modules.reduce(
    (acc, module) => acc + (module._count?.ModuleConcept || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Course Title - Desktop Only */}
      <div className="hidden lg:block">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{course.title}</h1>
        <p className="text-gray-600 text-lg">{course.description}</p>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
          <Clock className="h-5 w-5 text-brand-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Duration</p>
            <p className="font-semibold text-gray-900">
              {formatDuration(course.duration_minutes)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
          <BarChart className="h-5 w-5 text-brand-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Level</p>
            <p className="font-semibold text-gray-900">
              {getDifficultyLabel(course.difficulty)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
          <BookOpen className="h-5 w-5 text-brand-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Modules</p>
            <p className="font-semibold text-gray-900">
              {course.modules.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
          <Users className="h-5 w-5 text-brand-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Enrolled</p>
            <p className="font-semibold text-gray-900">
              {course._count?.UserCourseEnrollment || 0}
            </p>
          </div>
        </div>
      </div>

      {/* What You'll Learn */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            What you'll learn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {course.modules.slice(0, 6).map((module, index) => (
              <div key={module.id} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{module.title}</span>
              </div>
            ))}
            {course.modules.length > 6 && (
              <div className="flex items-start gap-2 text-brand-blue-600">
                <span className="text-sm font-medium">
                  +{course.modules.length - 6} more modules
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Course Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Course Content</CardTitle>
            <div className="text-sm text-gray-500">
              {course.modules.length} modules • {totalConcepts} concepts
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Accordion type="multiple" className="w-full">
            {course.modules.map((module, index) => (
              <AccordionItem
                key={module.id}
                value={module.id}
                className="border-b last:border-b-0"
              >
                <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 hover:no-underline">
                  <div className="flex items-center gap-4 text-left">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-blue-100 text-brand-blue-700 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{module.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {module._count?.ModuleConcept || 0} concepts
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="pl-12 space-y-2">
                    {module.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {module.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FileText className="h-4 w-4" />
                      <span>
                        {module._count?.ModuleConcept || 0} learning concepts
                      </span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-700">
                No prior experience required - we'll teach you everything you need to know
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-700">
                A computer with internet access
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-700">
                Dedication and willingness to learn
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Tags */}
      {course.Domain && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-sm">
            {course.Domain.name}
          </Badge>
          <Badge className={getDifficultyColor(course.difficulty)}>
            {getDifficultyLabel(course.difficulty)}
          </Badge>
        </div>
      )}
    </div>
  );
}
