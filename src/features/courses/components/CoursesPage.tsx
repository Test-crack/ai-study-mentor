import { CoursesNavbar } from './CoursesNavbar';
import { CoursesList } from './CoursesList';
import { useState } from 'react';

const CoursesPage = () => {
  const [heroSearchQuery, setHeroSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-white">
      <CoursesNavbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Learn without limits
          </h1>
          <p className="text-xl text-purple-100 max-w-2xl">
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
