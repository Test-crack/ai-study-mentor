import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Users, BookOpen, TrendingUp, DollarSign } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  trendUp: boolean;
  color: string;
  delay: number;
}

const StatCard = ({ title, value, icon: Icon, trend, trendUp, color, delay }: StatCardProps) => (
  <Card 
    className="overflow-hidden relative border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
    style={{ animation: `fadeInUp 0.5s ease-out ${delay}s backwards` }}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10 group-hover:opacity-15 transition-opacity`} />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <div className={`p-2 rounded-full bg-gradient-to-br ${color} text-white shadow-md`}>
        <Icon className="h-4 w-4" />
      </div>
    </CardHeader>
    <CardContent className="relative z-10">
      <div className="text-2xl font-bold">{value}</div>
      <p className={`text-xs ${trendUp ? 'text-green-600' : 'text-red-600'} flex items-center mt-1 font-medium`}>
        {trendUp ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1 rotate-180" />}
        {trend}
        <span className="text-muted-foreground ml-1">vs last month</span>
      </p>
    </CardContent>
  </Card>
);

export const AdminStats = () => {
  const stats = [
    {
      title: "Total Students",
      value: "2,845",
      icon: Users,
      trend: "+12.5%",
      trendUp: true,
      color: "from-blue-500 to-cyan-400",
    },
    {
      title: "Active Courses",
      value: "14",
      icon: BookOpen,
      trend: "+2.4%",
      trendUp: true,
      color: "from-purple-500 to-pink-400",
    },
    {
      title: "Total Revenue",
      value: "$45,231",
      icon: DollarSign,
      trend: "+8.2%",
      trendUp: true,
      color: "from-emerald-500 to-green-400",
    },
    {
      title: "Avg. Completion",
      value: "68%",
      icon: TrendingUp,
      trend: "+4.1%",
      trendUp: true,
      color: "from-orange-500 to-amber-400",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={stat.title} {...stat} delay={index * 0.1} />
      ))}
    </div>
  );
};
