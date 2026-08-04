import { useState } from 'react';
import { CoursesNavbar } from './CoursesNavbar'; // Assuming you might use this later, left it imported
import { CoursesList } from './CoursesList';
import { Navbar } from '@/shared/components/layout';

const CoursesPage = () => {
  const [heroSearchQuery, setHeroSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Navbar */}
      <Navbar showNavItems={true} />
            
      {/* Hero Section */}
      <div className="bg-brand-teal-700 dark:bg-brand-teal-900 text-white transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white dark:text-slate-100">
            Learn without limits
          </h1>
          <p className="text-xl text-brand-blue-100 dark:text-brand-blue-200 max-w-2xl">
            Start, switch, or advance your career with thousands of courses, Professional Certificates, and degrees from world-class institutions.
          </p>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CoursesList initialSearchQuery={heroSearchQuery} />
      </main>
    </div>
  );
};

export default CoursesPage;