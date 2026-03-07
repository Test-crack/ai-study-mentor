import React, { useState } from 'react';
import { GraduationCap,UserRound } from 'lucide-react';

// Define the structure for our tab data
interface TabData {
  id: string;
  label: string;
  videoPath: string;
}

const Dashdemo: React.FC = () => {
  // Set the default active tab to 'studentView'
  const [activeTab, setActiveTab] = useState<string>('StudentView');

  // --- THIS IS WHERE YOU LINK YOUR VIDEOS ---
  const tabsData: TabData[] = [
    {
      id: 'StudentView',
      label: 'Student View',
      videoPath: '/videos/instr.mp4',
    },
    {
      id: 'InstructorView',
      label: 'Instructor View',
      videoPath: '/videos/',
    },
    {
      id: 'InstituteAdminPortalView',
      label: 'Institute Admin Portal',
      videoPath: '/videos/admin.mp4',
    },
    {
      id: 'InstituteOwnerPortalView',
      label: 'Institute Owner Portal',
      videoPath: '/videos/Owner.mp4',
    },
  ];

  const currentTabData = tabsData.find((tab) => tab.id === activeTab);

  // Simple back navigation (Update this if you are using Next.js or React Router)
  const handleGoBack = () => {
    window.location.href = '/'; // Adjust this path to match your landing page URL
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f4f7f9', 
      // FIX: Increased top padding to 100px to account for the fixed 64px (h-16) navbar
      padding: '100px 20px 40px', 
      fontFamily: 'system-ui, -apple-system, sans-serif' 
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
       {/* Navigation */}
<nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transform-gpu">
  {/* Changed max-w-7xl mx-auto to w-full */}
  <div className="w-full px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      
      {/* Logo Section - Now stays at the far left */}
      <div className="flex items-center space-x-2">
        <div className="p-2 bg-indigo-700 rounded-xl">
          {/* Replaced GraduationCap with UserRound */}
          <UserRound className="h-6 w-6 text-white" />
        </div>
        <span className="text-xl font-bold text-indigo-700">
          TestCrack
        </span>
      </div>

      {/* Buttons Section (Uncommented and kept to the right) */}
      {/* <div className="flex items-center gap-4">
        {user ? (
          <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-700 rounded-lg hover:bg-indigo-800">
            Dashboard
          </button>
        ) : (
          <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-700 rounded-lg hover:bg-indigo-800">
            Sign In
          </button>
        )}
      </div> */}
      
    </div>
  </div>
</nav>
        {/* TOP BAR: BACK BUTTON */}
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={handleGoBack}
            style={{
              display: 'inline-flex', // Changed to inline-flex so it doesn't stretch
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#4338ca',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              color: '#f2f3f6',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>←</span> Back to Landing Page
          </button>
        </div>

        {/* HEADING */}
        <h2 style={{ 
          textAlign: 'center', 
          fontSize: '2.5rem', 
          color: '#1e293b', 
          marginBottom: '40px',
          fontWeight: '800',
          letterSpacing: '-1px'
        }}>
          How We Work
        </h2>

        {/* TAB BUTTONS SECTION */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          flexWrap: 'wrap',
          gap: '12px', 
          marginBottom: '30px' 
        }}>
          {tabsData.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                cursor: 'pointer',
                border: activeTab === tab.id ? 'none' : '1px solid #cbd5e1',
                borderRadius: '9999px',
                backgroundColor: activeTab === tab.id ? '#2563eb' : '#ffffff',
                color: activeTab === tab.id ? '#ffffff' : '#475569',
                fontWeight: '600',
                fontSize: '0.95rem',
                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(37, 99, 235, 0.3)' : '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.3s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* VIDEO DISPLAY SECTION */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '16px', 
          padding: '20px', 
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          border: '1px solid #f1f5f9'
        }}>
          {currentTabData ? (
            <div style={{ borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000' }}>
              <video
                key={currentTabData.id} 
                width="100%"
                style={{ display: 'block', borderRadius: '8px' }}
                controls
                autoPlay
                muted
              >
                <source src={currentTabData.videoPath} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>
              Please select a view.
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashdemo;