import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
  shortLabel?: string;
}

interface StepIndicatorProps {
  currentStep: string;
  steps: Step[];
  onStepClick?: (stepId: string) => void;
  allowNavigation?: boolean;
}

export function StepIndicator({
  currentStep,
  steps,
  onStepClick,
  allowNavigation = false,
}: StepIndicatorProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  const isStepCompleted = (index: number) => index < currentIndex;
  const isStepCurrent = (index: number) => index === currentIndex;
  const isStepClickable = (index: number) =>
    allowNavigation && (isStepCompleted(index) || isStepCurrent(index));

  return (
    <div className="w-full bg-white/80 backdrop-blur-sm border-b py-3 sm:py-4 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() =>
                    isStepClickable(index) && onStepClick?.(step.id)
                  }
                  disabled={!isStepClickable(index)}
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300",
                    isStepCompleted(index) &&
                      "bg-green-500 text-white shadow-lg",
                    isStepCurrent(index) &&
                      "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg ring-4 ring-purple-200",
                    !isStepCompleted(index) &&
                      !isStepCurrent(index) &&
                      "bg-gray-200 text-gray-500",
                    isStepClickable(index) &&
                      "cursor-pointer hover:scale-110 active:scale-95"
                  )}
                >
                  {isStepCompleted(index) ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    index + 1
                  )}
                </button>

                {/* Step Label */}
                <span
                  className={cn(
                    "mt-2 text-xs sm:text-sm font-medium text-center whitespace-nowrap",
                    isStepCurrent(index) && "text-purple-700 font-semibold",
                    isStepCompleted(index) && "text-green-700",
                    !isStepCompleted(index) &&
                      !isStepCurrent(index) &&
                      "text-gray-500"
                  )}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">
                    {step.shortLabel || step.label}
                  </span>
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-all duration-300",
                    isStepCompleted(index)
                      ? "bg-green-500"
                      : "bg-gray-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
