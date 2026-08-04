import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Timer, ArrowRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const SpeedReadingWidget = () => {
  const navigate = useNavigate();

  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-brand-teal-600 to-brand-blue-700 dark:from-brand-teal-900 dark:to-brand-blue-900 text-white rounded-2xl overflow-hidden relative transition-colors">
      {/* Decorative */}
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Timer className="h-32 w-32 rotate-12" />
      </div>
      
      <CardContent className="p-6 sm:p-8 relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium backdrop-blur-sm mb-4 border border-white/10">
            <Zap className="h-3 w-3 text-amber-300" />
            <span>AI Assessment</span>
          </div>
          <h3 className="text-2xl font-bold mb-2">Speed Reading Check</h3>
          <p className="text-brand-teal-100 text-sm max-w-xs leading-relaxed">
            Measure your reading speed and comprehension in under 2 minutes. Unlock personalized drills.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-center">
            <p className="text-xs text-brand-teal-200 uppercase tracking-wider font-semibold">Previous Best</p>
            <p className="text-2xl font-bold">240 <span className="text-sm font-normal text-brand-teal-200">WPM</span></p>
          </div>
          
          <Button 
            onClick={() => navigate('/assessment')}
            className="bg-white text-brand-teal-600 hover:bg-brand-teal-50 font-bold rounded-xl shadow-lg shadow-brand-teal-900/20 transition-all hover:-translate-y-0.5"
          >
            Start Test <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
