import React from 'react';
import testcrackLogo from '@/assets/testcrack-logo.svg';

const Dashdemo: React.FC = () => {
  const handleGoBack = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-brand-bg font-plex text-brand-text antialiased">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-ink border-b border-brand-line-12 transform-gpu">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <img src={testcrackLogo} alt="TestCrack" className="h-9 w-9 object-contain" />
              <span className="font-manrope text-xl font-extrabold tracking-[-0.03em] text-brand-bg">TestCrack</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* BACK BUTTON */}
        <div className="mb-8">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 px-5 py-[11px] rounded-md border border-brand-line bg-white text-[14.5px] font-semibold text-brand-ink hover:border-brand-teal hover:text-brand-teal transition-colors duration-150"
          >
            <span aria-hidden="true">←</span> Back to Landing Page
          </button>
        </div>

        {/* HEADING */}
        <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-brand-ink text-center leading-[1.1] tracking-[-0.04em] mb-10">
          How We Work
        </h2>

        {/* VIDEO */}
        <div className="bg-white border border-brand-line p-5">
          <div className="overflow-hidden bg-black animate-in fade-in duration-500">
            <iframe
              width="100%"
              className="block aspect-video border-none"
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
