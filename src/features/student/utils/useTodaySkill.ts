import { useState, useEffect, useCallback } from 'react';

export const useTodaySkill = ({
  dailyDrillState,
  skillBands,
  moduleCompletedFromAPI
}: any) => {
  const [moduleCompletedLocal, setModuleCompletedLocal] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const cached = localStorage.getItem('skill_module_completed_today');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.date === today && parsed.completed) {
          setModuleCompletedLocal(true);
        }
      } catch (e) {
        console.error('Failed to parse localStorage module state', e);
      }
    }
  }, []);

  const markModuleComplete = useCallback(() => {
    setModuleCompletedLocal(true);
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('skill_module_completed_today', JSON.stringify({ completed: true, date: today, skill: 'reading' }));
  }, []);

  const moduleCompleted = moduleCompletedFromAPI || moduleCompletedLocal;

  let todaySkillId = 'reading';

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const rotation = ['reading', 'listening', 'writing', 'speaking'];
  todaySkillId = rotation[dayOfYear % 4];

  if (skillBands && skillBands.length > 0) {
    const weakest = [...skillBands].sort((a, b) => a.score - b.score)[0];
    todaySkillId = weakest.skill.toLowerCase();
  }

  if (dailyDrillState?.skill_module_skill_today) {
    todaySkillId = dailyDrillState.skill_module_skill_today.toLowerCase();
  }

  const labels: Record<string, string> = {
    reading:   'Reading',
    listening: 'Listening',
    writing:   'Writing',
    speaking:  'Speaking',
  };

  const routes: Record<string, string> = {
    reading:   '/student/reading?mode=gate',
    listening: '/student/listening?mode=gate',
    writing:   '/student/writing?mode=gate',
    speaking:  '/student/speaking-assessment?mode=gate',
  };

  return {
    todaySkillId,
    todaySkillLabel: labels[todaySkillId] || 'Reading',
    todaySkillRoute: routes[todaySkillId] || '/student/reading?mode=gate',
    moduleCompleted,
    markModuleComplete,
  };
};