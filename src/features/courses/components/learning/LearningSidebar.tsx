import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  Lock,
  BookOpen,
  Award,
} from 'lucide-react';
import { ModuleDetail } from '../../types';
import { cn } from '@/shared/utils/utils';

interface LearningSidebarProps {
  courseTitle: string;
  modules: ModuleDetail[];
  currentModuleIndex: number;
  onModuleSelect: (index: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  progressPercent?: number;
  completedModules?: Set<number>;
  isCourseCompleted?: boolean;
  onViewCertificate?: () => void;
}

export function LearningSidebar({
  courseTitle,
  modules,
  currentModuleIndex,
  onModuleSelect,
  isCollapsed,
  onToggleCollapse,
  progressPercent = 0,
  completedModules = new Set(),
  isCourseCompleted = false,
  onViewCertificate,
}: LearningSidebarProps) {
  const canAccessModule = (index: number) => {
    // Can access current module, completed modules, or the next one after completed
    if (index === 0) return true;
    if (index === currentModuleIndex) return true;
    if (completedModules.has(index)) return true;
    if (completedModules.has(index - 1)) return true;
    return index <= currentModuleIndex;
  };

  return (
    <div
      className={cn(
        'bg-white border-r flex flex-col transition-all duration-300 h-full',
        isCollapsed ? 'w-16' : 'w-72'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-gray-50">
        {!isCollapsed && (
          <div className="flex-1 min-w-0 mr-2">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                Course
              </span>
            </div>
            <h2 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
              {courseTitle}
            </h2>
            <div className="flex items-center gap-2 mt-3">
              <Progress value={progressPercent} className="h-1.5 flex-1" />
              <span className="text-xs font-medium text-gray-600">
                {progressPercent}%
              </span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="flex-shrink-0 h-8 w-8 p-0 hover:bg-gray-200"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Module List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {!isCollapsed && (
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-3 py-2">
              Modules ({modules.length})
            </p>
          )}
          {modules.map((module, index) => {
            const isActive = index === currentModuleIndex;
            const isCompleted = completedModules.has(index);
            const canAccess = canAccessModule(index);
            const conceptCount = module._count?.ModuleConcept || 0;

            return (
              <button
                key={module.id}
                onClick={() => canAccess && onModuleSelect(index)}
                disabled={!canAccess}
                className={cn(
                  'w-full text-left rounded-lg transition-all mb-1',
                  isCollapsed ? 'p-2 flex justify-center' : 'p-3',
                  isActive
                    ? 'bg-purple-100 border border-purple-300'
                    : isCompleted
                    ? 'bg-green-50 border border-green-200 hover:bg-green-100'
                    : canAccess
                    ? 'hover:bg-gray-100 border border-transparent'
                    : 'opacity-50 cursor-not-allowed border border-transparent'
                )}
              >
                {isCollapsed ? (
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                      isActive
                        ? 'bg-purple-600 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : canAccess
                        ? 'bg-gray-200 text-gray-600'
                        : 'bg-gray-100 text-gray-400'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : !canAccess ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      index + 1
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5',
                        isActive
                          ? 'bg-purple-600 text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : canAccess
                          ? 'bg-gray-200 text-gray-600'
                          : 'bg-gray-100 text-gray-400'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-3.5 w-3.5" />
                      ) : !canAccess ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium leading-tight',
                          isActive
                            ? 'text-purple-700'
                            : isCompleted
                            ? 'text-green-700'
                            : canAccess
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        )}
                      >
                        {module.title}
                      </p>
                      <p
                        className={cn(
                          'text-xs mt-1',
                          isActive
                            ? 'text-purple-500'
                            : isCompleted
                            ? 'text-green-500'
                            : 'text-gray-500'
                        )}
                      >
                        {conceptCount} concept{conceptCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Certificate Button - shown when course is completed */}
      {isCourseCompleted && onViewCertificate && (
        <div className="p-3 border-t bg-gradient-to-r from-yellow-50 to-amber-50">
          {isCollapsed ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewCertificate}
              className="w-full h-10 p-0 hover:bg-yellow-100"
              title="View Certificate"
            >
              <Award className="h-5 w-5 text-yellow-600" />
            </Button>
          ) : (
            <Button
              onClick={onViewCertificate}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white"
            >
              <Award className="h-4 w-4 mr-2" />
              View Certificate
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
