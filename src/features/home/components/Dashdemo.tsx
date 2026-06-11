import React from 'react';
import { UserRound } from 'lucide-react';

const Dashdemo: React.FC = () => {
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

        {/* BACK BUTTON */}
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

        {/* VIDEO */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          border: '1px solid #f1f5f9'
        }}>
          <div
            className="video-transition"
            style={{ borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000' }}
          >
            <iframe
              width="100%"
              style={{
                display: 'block',
                borderRadius: '8px',
                aspectRatio: '16/9',
                border: 'none'
              }}
              src="https://www.youtube.com/embed/AHnEKvZN0-o?si=-yNT4tjtsByUt__v&autoplay=1&mute=1"
              title="TestCrack Demo"
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