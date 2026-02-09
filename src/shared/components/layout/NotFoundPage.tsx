import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "lucide-react";

const NotFoundPage = () => {
  const location = useLocation();

  useEffect(() => {
    console.log(
      "Feature Request/Interest tracked for:",
      location.pathname
    );
  }, [location.pathname]);
  return (
 <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white text-gray-800">
      <div className="text-center px-6">
        {/* Visual Badge */}
        <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-widest text-indigo-600 uppercase bg-indigo-100 rounded-full">
          Under Construction
        </span>
        
        <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
          Coming Soon
        </h1>
        
        <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto">
          We're currently crafting something amazing for <span className="font-mono text-indigo-600">Daily Streak Results</span>. 
          Check back soon!
        </p>

        <div className="space-x-4">
          <Link 
            to="/dashboard" 
            className=" bg-indigo-600  ">
            Back to Home
       </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
