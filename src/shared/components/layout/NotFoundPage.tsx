import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  const location = useLocation();

  useEffect(() => {
    console.log(
      "Feature Request/Interest tracked for:",
      location.pathname
    );
  }, [location.pathname]);
  return (
<div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-teal-100/50 blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-3xl animate-pulse delay-700" />

      <div className="relative z-10 w-full max-w-2xl px-6">
        <div className="backdrop-blur-sm bg-white/60 border border-white/20 p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-brand-teal-50 border border-brand-teal-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-teal-500"></span>
            </span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-brand-teal-700 uppercase">
              Phase 01: In Development
            </span>
          </div>

          {/* Typography */}
          <h1 className="text-6xl md:text-7xl font-black mb-6 tracking-tighter text-slate-900">
            Hold <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-teal-600 to-blue-500">Tight.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-sm mx-auto leading-relaxed">
            We're polishing the <span className="font-semibold text-slate-800 italic">Work</span> experience. It’s going to be worth the wait.
          </p>

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/dashboard" 
              className="group relative px-8 py-4 bg-slate-900 text-white rounded-2xl font-semibold transition-all duration-300 hover:bg-brand-teal-600 hover:shadow-xl hover:shadow-brand-teal-200 active:scale-95"
            >
              Take Me Home
              <span className="inline-block ml-2 transition-transform group-hover:-translate-x-1">←</span>
            </Link>
            
            {/* <button  className="px-8 py-4 text-slate-500 font-medium hover:text-brand-teal-600 transition-colors">
              Notify Me
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
