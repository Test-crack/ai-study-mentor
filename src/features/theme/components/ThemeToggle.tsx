import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/features/theme/ThemeProvider";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="theme-mode"
        checked={theme === "dark"}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        className="data-[state=checked]:bg-brand-teal-600"
      />
      <Label htmlFor="theme-mode" className="sr-only">Toggle theme</Label>
      {theme === "dark" ? (
        <Moon className="h-4 w-4 text-slate-400" />
      ) : (
        <Sun className="h-4 w-4 text-amber-500" />
      )}
    </div>
  );
}
