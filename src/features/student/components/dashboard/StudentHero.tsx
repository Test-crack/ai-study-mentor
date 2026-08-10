import { format } from "date-fns";

interface StudentHeroProps {
  name: string;
}

export const StudentHero = ({ name }: StudentHeroProps) => {
  const currentDate = format(new Date(), "MMMM d, yyyy");

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-slate-950 text-white p-8 sm:p-10 shadow-xl border border-slate-800">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob dark:opacity-10"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-brand-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 dark:opacity-10"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-slate-400 font-medium mb-2 uppercase tracking-widest text-xs">
            {currentDate}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight text-white">
            Welcome back, <span className="bg-gradient-to-r from-brand-teal-400 to-brand-blue-400 bg-clip-text text-transparent">{name}</span>!
          </h1>
          <p className="text-slate-300 max-w-lg text-lg leading-relaxed">
            You've got <span className="text-white font-semibold">4 pending assignments</span> and <span className="text-white font-semibold">2 upcoming classes</span> this week. Stay focused!
          </p>
        </div>
        
        {/* Optional Action Button */}
        {/* <div className="hidden md:block">
          <Button className="bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl px-6">
            View Schedule
          </Button>
        </div> */}
      </div>
    </div>
  );
};
