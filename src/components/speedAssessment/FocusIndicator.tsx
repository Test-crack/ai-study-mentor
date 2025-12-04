import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";

interface FocusIndicatorProps {
  isCurrentlyFocused: boolean;
  tabSwitches: number;
}

export const FocusIndicator = ({ isCurrentlyFocused, tabSwitches }: FocusIndicatorProps) => {
  return (
    <div className="flex items-center space-x-2">
      {isCurrentlyFocused ? (
        <div className="flex items-center space-x-1 text-green-600">
          <Eye className="h-4 w-4" />
          <span className="text-sm font-medium">Focused</span>
        </div>
      ) : (
        <div className="flex items-center space-x-1 text-red-600">
          <EyeOff className="h-4 w-4" />
          <span className="text-sm font-medium">Tab Hidden</span>
        </div>
      )}
      {tabSwitches > 0 && (
        <Badge variant="outline" className="text-xs">
          {tabSwitches} switch{tabSwitches > 1 ? 'es' : ''}
        </Badge>
      )}
    </div>
  );
};
