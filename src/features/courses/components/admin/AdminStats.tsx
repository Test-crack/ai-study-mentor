import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Users, BookOpen, TrendingUp, DollarSign, ArrowUpRight } from "lucide-react";

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
    className="overflow-hidden relative border border-white bg-white/50 backdrop-blur-xl shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5 group"
    style={{ animation: `fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}s backwards` }}
  >
    <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
    
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
      <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
        {title}
      </CardTitle>
      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg shadow-${color.split('-')[1]}/20 transform group-hover:scale-110 transition-transform duration-500`}>
        <Icon className="h-4 w-4" />
      </div>
    </CardHeader>
    <CardContent className="relative z-10">
      <div className="text-3xl font-black text-gray-900 tracking-tight">{value}</div>
      <div className="flex items-center mt-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
          trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          {trendUp ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowUpRight className="h-3 w-3 mr-0.5 rotate-90" />}
          {trend}
        </span>
        <span className="text-[10px] text-gray-400 font-medium ml-2">from last month</span>
      </div>
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
      color: "from-blue-600 to-indigo-500",
    },
    {
      title: "Active Courses",
      value: "14",
      icon: BookOpen,
      trend: "+2.4%",
      trendUp: true,
      color: "from-purple-600 to-fuchsia-500",
    },
    {
      title: "Total Revenue",
      value: "$45,231",
      icon: DollarSign,
      trend: "+8.2%",
      trendUp: true,
      color: "from-emerald-600 to-teal-500",
    },
    {
      title: "Avg. Completion",
      value: "68%",
      icon: TrendingUp,
      trend: "+4.1%",
      trendUp: true,
      color: "from-orange-500 to-amber-500",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={stat.title} {...stat} delay={index * 0.1} />
      ))}
    </div>
  );
};
