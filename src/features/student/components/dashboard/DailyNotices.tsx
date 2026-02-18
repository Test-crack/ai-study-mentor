import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Bell } from "lucide-react";

export const DailyNotices = () => {
  return (
    <Card className="border-none shadow-sm bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Daily Notice</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-indigo-100/50 dark:border-indigo-900/30 transition-colors">
            <h4 className="font-semibold text-sm text-indigo-900 dark:text-indigo-300 mb-1">Prelim Payment Due</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
            </p>
            <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-2 hover:underline">See more</button>
          </div>
          
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-indigo-100/50 dark:border-indigo-900/30 transition-colors">
            <h4 className="font-semibold text-sm text-indigo-900 dark:text-indigo-300 mb-1">Exam Schedule Released</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
               Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-2 hover:underline">See more</button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
