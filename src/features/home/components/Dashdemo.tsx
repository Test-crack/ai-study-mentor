import React, { useState } from 'react';
import { UserRound } from 'lucide-react';

interface TabData {
  id: string;
  label: string;
  embedUrl: string;
}

const Dashdemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('StudentView');

  const tabsData: TabData[] = [
    {
      id: 'StudentView',
      label: 'Student View',
      embedUrl: 'https://www.youtube.com/embed/91dBFnM7jHI?si=5J1kD5LzAVn5XsJ0',
    },
    {
      id: 'InstructorView',
      label: 'Instructor View',
      embedUrl: 'https://www.youtube.com/embed/tt8N7m6RjgE?si=Mo-vRfrb0AQydScW',
    },
    {
      id: 'InstituteAdminPortalView',
      label: 'Institute Admin Portal',
      embedUrl: 'https://www.youtube.com/embed/zz1EEjYcT5g?si=GcGY2OQAMlfqz295',
    },
    {
      id: 'InstituteOwnerPortalView',
      label: 'Institute Owner Portal',
      embedUrl: 'https://www.youtube.com/embed/xWWokRhKphs?si=MC9__ZgckV8qIF3P',
    },
  ];

  // Force a fallback to the first tab so we NEVER show an empty screen
  const currentTabData = tabsData.find((tab) => tab.id === activeTab) || tabsData[0];

  const handleGoBack = () => {
    window.location.href = '/'; 
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f4f7f9', 
      padding: '100px 20px 40px', 
      fontFamily: 'system-ui, -apple-system, sans-serif' 
    }}>
      {/* Injecting a small CSS animation directly to ensure the video 
        fades in smoothly when the key changes, eliminating the "rough transition".
      */}
      <style>
        {`
          @keyframes subtleFadeIn {
            from { opacity: 0; transform: scale(0.99); }
            to { opacity: 1; transform: scale(1); }
          }
          .video-transition {
            animation: subtleFadeIn 0.4s ease-out forwards;
          }
        `}
      </style>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transform-gpu">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-700 rounded-xl">
                  <UserRound className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-indigo-700">
                  TestCrack
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* TOP BAR: BACK BUTTON */}
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={handleGoBack}
            style={{
              display: 'inline-flex', 
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
          {/* Key ties to currentTabData.id, forcing a re-render which triggers the .video-transition animation */}
          <div 
            key={currentTabData.id} 
            className="video-transition"
            style={{ borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000' }}
          >
            <iframe 
              width="100%" 
              style={{ 
                display: 'block', 
                borderRadius: '8px', 
                aspectRatio: '16/9', /* Keeps the video perfectly responsive like the old video tag */
                border: 'none'
              }}
              src={`${currentTabData.embedUrl}&autoplay=1&mute=1`} 
              title={`${currentTabData.label} Demo Video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashdemo;