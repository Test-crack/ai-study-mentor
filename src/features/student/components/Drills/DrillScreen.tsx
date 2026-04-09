import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StudentSidebar } from '../dashboard/StudentSidebar';
import { StudentTopbar } from '../dashboard/StudentTopbar'; 
import AudioResponseDrill from './AudioResponseDrill';
import ParagraphRepairDrill from './ParagraphRepairDrill';
import DrillResultCard from './DrillResultCard';
import { ArrowLeft, Target } from 'lucide-react';

export default function DrillScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const skill = searchParams.get('skill') || 'Speaking';
  const subSkill = searchParams.get('sub_skill') || 'Pronunciation';
  
  // Drill State
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [momentumScore, setMomentumScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const totalPrompts = 5;

  // Determine drill type based on sub-skill
  const drillType = skill.toLowerCase() === 'writing' ? 'paragraph_repair' : 'audio_response';

  // Mock Prompts (In the future, fetch this from your backend based on skill/subSkill)
  const prompts = Array.from({ length: 5 }).map((_, i) => ({
    id: i + 1,
    text: drillType === 'audio_response' 
      ? `Describe a time when you experienced something new. (Prompt ${i + 1})`
      : `Fix the missing linking words in this paragraph. (Prompt ${i + 1})`,
  }));

  const handleNextPrompt = () => {
    // Simulate earning 4 to 6 points for this specific prompt
    const pointsEarnedThisPrompt = Math.floor(Math.random() * 3) + 4;

    if (currentPromptIndex < totalPrompts - 1) {
      // Move to next prompt AND update the momentum score
      setCurrentPromptIndex(prev => prev + 1);
      setMomentumScore(prev => prev + pointsEarnedThisPrompt); 
    } else {
      // Final prompt: update score and mark as complete
      setMomentumScore(prev => prev + pointsEarnedThisPrompt);
      setIsComplete(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar activeTab="dashboard" isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'} flex flex-col min-h-screen`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="flex-1 p-6 max-w-4xl mx-auto w-full animate-in fade-in">
          {/* Back Button */}
          <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-800 dark:hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </button>

          {!isComplete ? (
            <>
              {/* Header */}
              <div className="mb-8 text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-100 text-rose-500 mb-2">
                  <Target className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-black text-slate-800 dark:text-white">
                  Today's Focus: {skill} {subSkill}
                </h1>
                <p className="text-slate-500 font-medium tracking-wide uppercase text-sm">
                  Prompt {currentPromptIndex + 1} of {totalPrompts}
                </p>
                {/* Momentum Score Bar (No Band Score shown) */}
                <div className="flex justify-center items-center gap-2 mt-4">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Momentum</span>
                  <div className="w-32 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${(momentumScore / (totalPrompts * 10)) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-amber-500">{momentumScore}</span>
                </div>
              </div>

              {/* Render Specific Drill Type */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                {drillType === 'audio_response' && (
                  <AudioResponseDrill prompt={prompts[currentPromptIndex]} onComplete={() => handleNextPrompt()} />
                )}
                {drillType === 'paragraph_repair' && (
                  <ParagraphRepairDrill prompt={prompts[currentPromptIndex]} onComplete={() => handleNextPrompt()} />
                )}
              </div>
            </>
         ) : (
            /* Result & Reflection Gate */
         <DrillResultCard 
  skill={skill} 
  subSkill={subSkill} 
  momentumScore={momentumScore} 
  feedback={[
    "Good attempt, but watch your syllable stress on 'development'.",
    "Clear intonation, try to maintain a steadier pace.",
    "Great use of linking words here.",
    "A bit hesitant; practice speaking without pausing mid-sentence.",
    "Excellent pronunciation of the target vocabulary."
  ]}
  onUnlockNext={() => {
    // Navigate to Apply Drill, passing context via URL
    navigate(`/student/apply-drill?skill=${skill}&sub_skill=${subSkill}&score=${momentumScore}`);
  }} 
/>
          )}
        </main>
      </div>
    </div>
  );
}