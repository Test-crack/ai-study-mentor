import { 
  Book, 
  Youtube, 
  BookOpen, 
  ArrowRight 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/shared/components/ui/card";

export const FeaturesGrid = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Book,
      title: 'Smart Notes',
      description: 'AI-powered summary & quiz generation',
      action: () => navigate('/dashboard/notes'),
      color: "bg-emerald-50 text-emerald-600",
      borderColor: "hover:border-emerald-200"
    },
    {
      icon: Youtube,
      title: 'YouTube Learning',
      description: 'Video summaries & interactive chat',
      action: () => navigate('/dashboard/youtube'),
      color: "bg-red-50 text-red-600",
      borderColor: "hover:border-red-200"
    },
    {
      icon: BookOpen,
      title: 'Study Guides',
      description: 'Personalized curriculum builder',
      action: () => navigate('/dashboard/guides'),
      color: "bg-blue-50 text-blue-600",
      borderColor: "hover:border-blue-200"
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {features.map((feature, index) => (
        <Card 
          key={index}
          onClick={feature.action}
          className={`border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer rounded-2xl group ${feature.borderColor} bg-white dark:bg-slate-900`}
        >
          <CardContent className="p-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color} dark:bg-opacity-10 transition-transform group-hover:scale-110 duration-300`}>
              <feature.icon className="h-6 w-6" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {feature.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
              {feature.description}
            </p>

            <div className="flex items-center text-xs font-semibold text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Launch Tool <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
