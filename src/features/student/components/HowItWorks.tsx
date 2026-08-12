import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { HeroOrbit } from './how-it-works/HeroOrbit';
import { ChaptersNavDesktop, ChaptersNavMobile } from './how-it-works/ChaptersNav';
import { ChapterView } from './how-it-works/ChapterView';
import { CHAPTERS } from './how-it-works/data';

export default function HowItWorks() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeChapter = CHAPTERS[activeIndex];

  const goTo = (index: number) => {
    setActiveIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar
        activeTab="how-it-works"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed((c) => !c)}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      />

      <div
        className={`transition-all duration-300 ease-in-out pl-0 ${
          isSidebarHovered ? 'md:pl-[288px]' : 'md:pl-[116px]'
        } flex flex-col min-h-screen`}
      >
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ChaptersNavMobile activeIndex={activeIndex} onSelect={goTo} />

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
              {/* Page header */}
              <div className="mb-5 sm:mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Platform guide
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  How TestCrack works
                </h1>
              </div>

              {/* Hero orbit summary */}
              <div className="mb-6 sm:mb-8">
                <HeroOrbit activeCaption={activeChapter.caption} activeNode={activeChapter.orbitNode} />
              </div>

              {/* Chapters + content */}
              <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 lg:gap-8">
                <ChaptersNavDesktop activeIndex={activeIndex} onSelect={goTo} />

                <ChapterView
                  chapter={activeChapter}
                  index={activeIndex}
                  total={CHAPTERS.length}
                  prevLabel={CHAPTERS[activeIndex - 1]?.label}
                  nextLabel={CHAPTERS[activeIndex + 1]?.label}
                  onPrev={() => goTo(Math.max(0, activeIndex - 1))}
                  onNext={() => goTo(activeIndex === CHAPTERS.length - 1 ? 0 : activeIndex + 1)}
                />
              </div>

              <div className="h-12 sm:h-16" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
