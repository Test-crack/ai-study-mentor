import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  Youtube,
  FileText,
  ArrowUpRight,
  BrainCircuit,
  Target,
  Clock,
  CheckCircle2
} from 'lucide-react';

// --- Types ---
type ResourceType = 'video' | 'article';

interface Suggestion {
  id: string;
  type: ResourceType;
  title: string;
  source: string;
  weaknessArea: string;
  duration: string;
  description: string;
  url: string;
  embedId?: string;
}

// --- Mock Data ---
const IDENTIFIED_WEAKNESSES = [
  { module: 'Reading', topic: 'True / False / Not Given', score: '45%' },
  { module: 'Listening', topic: 'Map Labeling', score: '50%' },
  { module: 'Writing', topic: 'Task 1 Overview', score: 'Band 5.5' }
];

const MOCK_SUGGESTIONS: Suggestion[] = [
  // ── GROUP 1 ──────────────────────────────────────────────────
  {
    id: 's1',
    type: 'video',
    title: 'Mastering True/False/Not Given in 10 Minutes',
    source: 'IELTS Advantage',
    weaknessArea: 'Reading: True / False / Not Given',
    duration: '12:45',
    description: 'A step-by-step breakdown of how to stop overthinking and find the exact evidence in the text.',
    url: 'https://www.youtube.com/watch?v=dHTpgdWp5tY',
    embedId: 'dHTpgdWp5tY'
  },
  {
    id: 's2',
    type: 'video',
    title: 'How to Write a Band 7+ Task 1 Overview',
    source: 'E2 IELTS',
    weaknessArea: 'Writing: Task 1 Overview',
    duration: '18:20',
    description: 'Discover the exact sentence structures needed to summarize main trends effectively without using numbers.',
    url: 'https://www.youtube.com/watch?v=MXBsy6sKP3Y',
    embedId: 'MXBsy6sKP3Y'
  },
  {
    id: 's3',
    type: 'video',
    title: 'IELTS Reading: Matching Headings Strategy',
    source: 'IELTS Liz',
    weaknessArea: 'Reading: Matching Headings',
    duration: '14:32',
    description: 'Learn how to efficiently match paragraph headings without reading every word — save time and boost accuracy.',
    url: 'https://www.youtube.com/watch?v=8VBAfXMDzHI',
    embedId: '8VBAfXMDzHI'
  },
  {
    id: 's4',
    type: 'video',
    title: 'IELTS Listening: Section 3 & 4 Strategies',
    source: 'IELTS Daily',
    weaknessArea: 'Listening: Academic Monologue',
    duration: '16:10',
    description: 'Tackle the hardest listening sections with prediction techniques and keyword spotting before the audio plays.',
    url: 'https://www.youtube.com/watch?v=opKPVqxE_QY',
    embedId: 'opKPVqxE_QY'
  },
  {
    id: 's5',
    type: 'video',
    title: 'IELTS Speaking Part 2: How to Never Run Out of Ideas',
    source: 'IELTS Ryan',
    weaknessArea: 'Speaking: Part 2 Long Turn',
    duration: '11:55',
    description: 'A simple mind-mapping framework that helps you speak for 2 minutes fluently on any cue card topic.',
    url: 'https://www.youtube.com/watch?v=R_UikSdjd7o',
    embedId: 'R_UikSdjd7o'
  },
  // ── GROUP 2 ──────────────────────────────────────────────────
  {
    id: 's6',
    type: 'video',
    title: 'IELTS Writing Task 2: Agree or Disagree Essay',
    source: 'E2 IELTS',
    weaknessArea: 'Writing: Task 2 Opinion Essay',
    duration: '20:05',
    description: 'Master the opinion essay structure with a clear thesis, supporting arguments, and a balanced conclusion for Band 7+.',
    url: 'https://www.youtube.com/watch?v=39PfYf8NodA',
    embedId: '39PfYf8NodA'
  },
  {
    id: 's7',
    type: 'video',
    title: 'IELTS Listening: Multiple Choice Traps Exposed',
    source: 'IELTS Advantage',
    weaknessArea: 'Listening: Multiple Choice',
    duration: '13:40',
    description: 'Understand how test-makers create distractor answers and never be tricked again by paraphrasing in recordings.',
    url: 'https://www.youtube.com/watch?v=eig1L1OMZmY',
    embedId: 'eig1L1OMZmY'
  },
  {
    id: 's8',
    type: 'video',
    title: 'Reading Skimming & Scanning Masterclass',
    source: 'IELTS Preparation',
    weaknessArea: 'Reading: Speed & Scanning',
    duration: '17:30',
    description: 'Develop two essential speed-reading techniques used by Band 8 students to locate answers in under 60 seconds.',
    url: 'https://www.youtube.com/watch?v=samIlXQFCfg',
    embedId: 'samIlXQFCfg'
  },
  {
    id: 's9',
    type: 'video',
    title: 'IELTS Vocabulary: Academic Word List in Context',
    source: 'IELTS Academic',
    weaknessArea: 'Writing & Reading: Vocabulary',
    duration: '22:15',
    description: 'Explore the most tested AWL words in real IELTS passages and learn how to use them naturally in your writing.',
    url: 'https://www.youtube.com/watch?v=NaNe5rwUXgw',
    embedId: 'NaNe5rwUXgw'
  },
  {
    id: 's10',
    type: 'video',
    title: 'IELTS Speaking: Linking Words & Discourse Markers',
    source: 'Ted IELTS',
    weaknessArea: 'Speaking: Coherence & Cohesion',
    duration: '09:58',
    description: 'Boost your fluency score by using natural connectors and discourse markers the way a native English speaker would.',
    url: 'https://www.youtube.com/watch?v=632CQZCxzUs',
    embedId: '632CQZCxzUs'
  },
  // ── GROUP 3 ──────────────────────────────────────────────────
  {
    id: 's11',
    type: 'video',
    title: 'Writing Task 1: Describing Bar Charts & Pie Charts',
    source: 'IELTS Simon',
    weaknessArea: 'Writing: Task 1 Data Description',
    duration: '15:00',
    description: 'Step-by-step guide to describing proportions and comparisons accurately using precise language for charts.',
    url: 'https://www.youtube.com/watch?v=lITCDZGepmg',
    embedId: 'lITCDZGepmg'
  },
  {
    id: 's12',
    type: 'video',
    title: 'IELTS Listening: Map & Plan Labelling Tips',
    source: 'IELTS Liz',
    weaknessArea: 'Listening: Map Labeling',
    duration: '10:22',
    description: 'Directional vocabulary and spatial orientation strategies to confidently complete any map labelling task.',
    url: 'https://www.youtube.com/watch?v=cwilnV_OrVs',
    embedId: 'cwilnV_OrVs'
  },
  {
    id: 's13',
    type: 'video',
    title: 'IELTS Grammar: Complex Sentences for Writing Band 7',
    source: 'IELTS Academic Pro',
    weaknessArea: 'Writing: Grammatical Range & Accuracy',
    duration: '18:45',
    description: 'Learn to construct relative clauses, conditionals, and passive voice naturally to impress examiners.',
    url: 'https://www.youtube.com/watch?v=zkg3kNBWWqM',
    embedId: 'zkg3kNBWWqM'
  },
  {
    id: 's14',
    type: 'video',
    title: 'Reading: Sentence Completion Strategies',
    source: 'IELTS Advantage',
    weaknessArea: 'Reading: Sentence Completion',
    duration: '12:10',
    description: 'How to use grammatical clues in sentence stems to predict the type of answer before searching the passage.',
    url: 'https://www.youtube.com/watch?v=XtpPmbOiqbw',
    embedId: 'XtpPmbOiqbw'
  },
  {
    id: 's15',
    type: 'video',
    title: 'IELTS Writing: Avoiding Common Task Response Errors',
    source: 'E2 IELTS',
    weaknessArea: 'Writing: Task Response',
    duration: '14:55',
    description: 'Understand what examiners mark down for and how to fully address all parts of the question every time.',
    url: 'https://www.youtube.com/watch?v=61izqh7ZBww',
    embedId: '61izqh7ZBww'
  },
  // ── GROUP 4 ──────────────────────────────────────────────────
  {
    id: 's16',
    type: 'video',
    title: 'IELTS Speaking Part 1: Answering with Depth',
    source: 'IELTS Ryan',
    weaknessArea: 'Speaking: Part 1 Short Answers',
    duration: '11:20',
    description: 'Go beyond one-sentence replies — use the AREA technique (Answer, Reason, Example, Alternative) for every question.',
    url: 'https://www.youtube.com/watch?v=k5igP_H-C90',
    embedId: 'k5igP_H-C90'
  },
  {
    id: 's17',
    type: 'video',
    title: 'IELTS Reading: Summary Completion Masterclass',
    source: 'IELTS Daily',
    weaknessArea: 'Reading: Summary Completion',
    duration: '13:30',
    description: 'How to identify paraphrased summary language and locate the right section of text to find your answers.',
    url: 'https://www.youtube.com/watch?v=wzdG66VK75c',
    embedId: 'wzdG66VK75c'
  },
  {
    id: 's18',
    type: 'video',
    title: 'IELTS Writing Task 2: Discussion Essay Template',
    source: 'IELTS Preparation',
    weaknessArea: 'Writing: Task 2 Discussion Essay',
    duration: '19:40',
    description: 'A reusable paragraph structure for discussing both sides of an argument, with examiner-approved transitions.',
    url: 'https://www.youtube.com/watch?v=SpAIW4p8wkw',
    embedId: 'SpAIW4p8wkw'
  },
  {
    id: 's19',
    type: 'video',
    title: 'IELTS Listening: Short Answer & Note Completion',
    source: 'IELTS Academic',
    weaknessArea: 'Listening: Short Answer Questions',
    duration: '10:05',
    description: 'Understand word limits, how synonyms are used in scripts, and why writing the exact word matters.',
    url: 'https://www.youtube.com/watch?v=VzYatXOP4cY',
    embedId: 'VzYatXOP4cY'
  },
  {
    id: 's20',
    type: 'video',
    title: 'IELTS Speaking: How to Improve Pronunciation Score',
    source: 'Ted IELTS',
    weaknessArea: 'Speaking: Pronunciation',
    duration: '16:33',
    description: 'Focus on word stress, sentence rhythm, and connected speech — the three areas examiners actually listen for.',
    url: 'https://www.youtube.com/watch?v=GeUtqiXLEWE',
    embedId: 'GeUtqiXLEWE'
  },
  // ── GROUP 5 ──────────────────────────────────────────────────
  {
    id: 's21',
    type: 'video',
    title: 'Reading: Identifying Writer\'s Views & Claims',
    source: 'IELTS Simon',
    weaknessArea: 'Reading: Views & Claims',
    duration: '14:18',
    description: 'How to distinguish the writer\'s opinion from factual statements — a critical skill for Yes/No/Not Given tasks.',
    url: 'https://www.youtube.com/watch?v=nv2IqOMJPRg',
    embedId: 'nv2IqOMJPRg'
  },
  {
    id: 's22',
    type: 'video',
    title: 'IELTS Writing Task 1: Process Diagrams Explained',
    source: 'IELTS Liz',
    weaknessArea: 'Writing: Task 1 Process Diagram',
    duration: '12:50',
    description: 'Use passive voice and sequencing language to describe any manufacturing or natural process clearly and accurately.',
    url: 'https://www.youtube.com/watch?v=WJ9IJrLGX6Q',
    embedId: 'WJ9IJrLGX6Q'
  },
  {
    id: 's23',
    type: 'video',
    title: 'IELTS Listening: Completing Tables & Forms',
    source: 'IELTS Advantage',
    weaknessArea: 'Listening: Table Completion',
    duration: '09:45',
    description: 'Predict the type of information needed for each cell before listening and follow the audio sequence carefully.',
    url: 'https://www.youtube.com/watch?v=YngqHl_BLOU',
    embedId: 'YngqHl_BLOU'
  },
  {
    id: 's24',
    type: 'video',
    title: 'IELTS Listening: Dialogue Conversations Decoded',
    source: 'IELTS Liz',
    weaknessArea: 'Listening: Section 1 Conversations',
    duration: '11:40',
    description: 'Practical drills for Section 1 — booking, registration, and inquiry conversations with real exam audio samples.',
    url: 'https://www.youtube.com/watch?v=cwilnV_OrVs',
    embedId: 'cwilnV_OrVs'
  },
  {
    id: 's25',
    type: 'video',
    title: 'IELTS Writing: Coherence & Cohesion Explained',
    source: 'E2 IELTS',
    weaknessArea: 'Writing: Coherence & Cohesion',
    duration: '17:22',
    description: 'See how paragraphing, referencing, and substitution work together to create a logically flowing essay.',
    url: 'https://www.youtube.com/watch?v=EftvWVUE09M',
    embedId: 'EftvWVUE09M'
  },
  // ── GROUP 6 ──────────────────────────────────────────────────
  {
    id: 's26',
    type: 'video',
    title: 'IELTS Speaking: Describing Photos & Images',
    source: 'IELTS Ryan',
    weaknessArea: 'Speaking: Descriptive Language',
    duration: '10:30',
    description: 'Build rich vocabulary for describing scenes, objects, and people using advanced hedging and speculating language.',
    url: 'https://www.youtube.com/watch?v=cBbQ9zB11fA',
    embedId: 'cBbQ9zB11fA'
  },
  {
    id: 's27',
    type: 'video',
    title: 'IELTS Reading: Paragraph Information Matching',
    source: 'IELTS Daily',
    weaknessArea: 'Reading: Paragraph Matching',
    duration: '13:15',
    description: 'An efficient approach to scanning paragraphs for specific details without re-reading the whole passage.',
    url: 'https://www.youtube.com/watch?v=o1-tfOjZjnw',
    embedId: 'o1-tfOjZjnw'
  },
  {
    id: 's28',
    type: 'video',
    title: 'IELTS Writing Task 2: Problem & Solution Essay',
    source: 'IELTS Preparation',
    weaknessArea: 'Writing: Task 2 Problem-Solution',
    duration: '20:00',
    description: 'A reliable 4-paragraph model for problem-solution questions with cohesive vocabulary and example sentences.',
    url: 'https://www.youtube.com/watch?v=nw0X025a2nA',
    embedId: 'nw0X025a2nA'
  },
  {
    id: 's29',
    type: 'video',
    title: 'IELTS Listening: Flowchart Completion Tips',
    source: 'IELTS Academic',
    weaknessArea: 'Listening: Flowchart Completion',
    duration: '08:55',
    description: 'How to follow a flowchart\'s logic while listening — predict word types and catch signal words for each arrow.',
    url: 'https://www.youtube.com/watch?v=VaKi09b19HY',
    embedId: 'VaKi09b19HY'
  },
  {
    id: 's30',
    type: 'video',
    title: 'IELTS Writing: Task Achievement vs Task Response',
    source: 'Ted IELTS',
    weaknessArea: 'Writing: Task Achievement',
    duration: '15:20',
    description: 'Understand the difference between Task 1 and Task 2 marking criteria and exactly what each band descriptor means.',
    url: 'https://www.youtube.com/watch?v=61izqh7ZBww',
    embedId: '61izqh7ZBww'
  },
  // ── GROUP 7 ──────────────────────────────────────────────────
  {
    id: 's31',
    type: 'video',
    title: 'IELTS Speaking Part 3: Discussion Techniques',
    source: 'IELTS Simon',
    weaknessArea: 'Speaking: Part 3 Discussion',
    duration: '14:10',
    description: 'Give developed answers to abstract Part 3 questions using a 3-step method: position, reason, and example.',
    url: 'https://www.youtube.com/watch?v=zvIHaNCIcR0',
    embedId: 'zvIHaNCIcR0'
  },
  {
    id: 's32',
    type: 'video',
    title: 'IELTS Reading: Time Management Strategies',
    source: 'IELTS Liz',
    weaknessArea: 'Reading: Time Management',
    duration: '11:00',
    description: 'Finish all 40 questions in 60 minutes with a strict time budget and question prioritization method.',
    url: 'https://www.youtube.com/watch?v=aSng9I0LwjY',
    embedId: 'aSng9I0LwjY'
  },
  {
    id: 's33',
    type: 'video',
    title: 'IELTS Writing: Lexical Resource for Band 7–8',
    source: 'IELTS Advantage',
    weaknessArea: 'Writing: Lexical Resource',
    duration: '16:45',
    description: 'Move beyond basic vocabulary with topic-specific collocations, less common words, and idiomatic expressions.',
    url: 'https://www.youtube.com/watch?v=qgMQb9u4S5E',
    embedId: 'qgMQb9u4S5E'
  },
  {
    id: 's34',
    type: 'video',
    title: 'IELTS Listening: Section 2 Monologue Strategies',
    source: 'E2 IELTS',
    weaknessArea: 'Listening: Section 2 Monologue',
    duration: '12:35',
    description: 'Handle one-speaker guides and tours in Section 2 by using signpost language to track where you are.',
    url: 'https://www.youtube.com/watch?v=IC3pTDnmgBY',
    embedId: 'IC3pTDnmgBY'
  },
  {
    id: 's35',
    type: 'video',
    title: 'IELTS Writing Task 1: Describing Line Graphs',
    source: 'IELTS Ryan',
    weaknessArea: 'Writing: Task 1 Line Graph',
    duration: '13:50',
    description: 'Vocabulary for trends, turning points, and comparisons across time — with model sentences for each chart feature.',
    url: 'https://www.youtube.com/watch?v=rlsqbSFOBCg',
    embedId: 'rlsqbSFOBCg'
  },
  // ── GROUP 8 ──────────────────────────────────────────────────
  {
    id: 's36',
    type: 'video',
    title: 'IELTS Reading: Locating Information Questions',
    source: 'IELTS Daily',
    weaknessArea: 'Reading: Locating Information',
    duration: '10:45',
    description: 'A scanning drill for quickly locating specific details in dense academic texts without reading everything.',
    url: 'https://www.youtube.com/watch?v=3oVjDNxd5wI',
    embedId: '3oVjDNxd5wI'
  },
  {
    id: 's37',
    type: 'video',
    title: 'IELTS Speaking: Expressing Opinions Naturally',
    source: 'IELTS Preparation',
    weaknessArea: 'Speaking: Expressing Opinions',
    duration: '09:20',
    description: 'Go beyond "I think" — use hedging phrases, emphasis markers, and opinion structures that sound academic.',
    url: 'https://www.youtube.com/watch?v=yle3Wytf_LE',
    embedId: 'yle3Wytf_LE'
  },
  {
    id: 's38',
    type: 'video',
    title: 'IELTS Writing Task 2: Causes & Effects Essay',
    source: 'IELTS Academic',
    weaknessArea: 'Writing: Task 2 Causes & Effects',
    duration: '18:00',
    description: 'Structure your causes-and-effects essays clearly using transitional phrases and avoiding repetition.',
    url: 'https://www.youtube.com/watch?v=ZMx27eocn1U',
    embedId: 'ZMx27eocn1U'
  },
  {
    id: 's39',
    type: 'video',
    title: 'IELTS Listening: Distractors & Speaker Corrections',
    source: 'Ted IELTS',
    weaknessArea: 'Listening: Distractors',
    duration: '11:15',
    description: 'Train your ear to catch speaker corrections, changes of mind, and rejected options that trick many students.',
    url: 'https://www.youtube.com/watch?v=RdL5fSkW2yg',
    embedId: 'RdL5fSkW2yg'
  },
  {
    id: 's40',
    type: 'video',
    title: 'IELTS Reading: Understanding Inference & Implication',
    source: 'IELTS Simon',
    weaknessArea: 'Reading: Inference Questions',
    duration: '14:00',
    description: 'Develop critical reading skills to draw conclusions from implied meaning — essential for top-band reading scores.',
    url: 'https://www.youtube.com/watch?v=0gRJXeK0UIc',
    embedId: '0gRJXeK0UIc'
  },
  // ── GROUP 9 ──────────────────────────────────────────────────
  {
    id: 's41',
    type: 'video',
    title: 'IELTS Writing Task 1: Maps & Plans Comparison',
    source: 'IELTS Liz',
    weaknessArea: 'Writing: Task 1 Map Description',
    duration: '16:20',
    description: 'How to compare two maps of the same area at different times using past tense and change vocabulary.',
    url: 'https://www.youtube.com/watch?v=dR5Muw6D5kQ',
    embedId: 'dR5Muw6D5kQ'
  },
  {
    id: 's42',
    type: 'video',
    title: 'IELTS Speaking: Fluency Over Perfection',
    source: 'IELTS Advantage',
    weaknessArea: 'Speaking: Fluency & Hesitation',
    duration: '10:10',
    description: 'Why fluency matters more than accuracy in the speaking exam — and how to sound natural even when you hesitate.',
    url: 'https://www.youtube.com/watch?v=oTe_2hmSHvw',
    embedId: 'oTe_2hmSHvw'
  },
  {
    id: 's43',
    type: 'video',
    title: 'IELTS Reading: Multiple Choice Question Tactics',
    source: 'E2 IELTS',
    weaknessArea: 'Reading: Multiple Choice',
    duration: '13:00',
    description: 'Use elimination, paraphrase detection, and answer order to confidently choose the right multiple-choice option.',
    url: 'https://www.youtube.com/watch?v=lnL0qvcVo1Q',
    embedId: 'lnL0qvcVo1Q'
  },
  {
    id: 's44',
    type: 'video',
    title: 'IELTS Writing: Paraphrasing the Question Correctly',
    source: 'IELTS Ryan',
    weaknessArea: 'Writing: Introduction Paraphrasing',
    duration: '09:35',
    description: 'Avoid copying the question verbatim — use synonyms and structural changes to write a strong introduction.',
    url: 'https://www.youtube.com/watch?v=VQluL1IRDbY',
    embedId: 'VQluL1IRDbY'
  },
  {
    id: 's45',
    type: 'video',
    title: 'IELTS Listening: Spelling & Number Practice Drills',
    source: 'IELTS Daily',
    weaknessArea: 'Listening: Spelling Accuracy',
    duration: '08:00',
    description: 'Common name, address, and number sequences from real exams — practice writing what you hear accurately.',
    url: 'https://www.youtube.com/watch?v=D5l_d60RkMQ',
    embedId: 'D5l_d60RkMQ'
  },
  
  // ── GROUP 10 ──────────────────────────────────────────────────
  {
    id: 's46',
    type: 'video',
    title: 'IELTS Writing Task 2: Advanced Linking Words',
    source: 'IELTS Preparation',
    weaknessArea: 'Writing: Cohesion Devices',
    duration: '14:40',
    description: 'Upgrade from basic connectors to sophisticated discourse markers that impress examiners and improve cohesion.',
    url: 'https://www.youtube.com/watch?v=q8qmJeBxk4Q',
    embedId: 'q8qmJeBxk4Q'
  },
  {
    id: 's47',
    type: 'video',
    title: 'IELTS Speaking: Handling Unknown Topics Gracefully',
    source: 'IELTS Academic',
    weaknessArea: 'Speaking: Unfamiliar Topics',
    duration: '11:30',
    description: 'Strategies for when you have no idea about the cue card topic — buy time, think aloud, and still sound fluent.',
    url: 'https://www.youtube.com/watch?v=AkW0IeF46cA',
    embedId: 'AkW0IeF46cA'
  },
  {
    id: 's48',
    type: 'video',
    title: 'IELTS Reading: Global & Gist Reading Practice',
    source: 'Ted IELTS',
    weaknessArea: 'Reading: Global Understanding',
    duration: '12:25',
    description: 'Read for the big picture first before diving into questions — a game-changing approach for complex academic texts.',
    url: 'https://www.youtube.com/watch?v=HYp08TMG5uw',
    embedId: 'HYp08TMG5uw'
  },
  {
    id: 's49',
    type: 'video',
    title: 'IELTS Writing Task 1: Tables — Selecting Key Data',
    source: 'IELTS Simon',
    weaknessArea: 'Writing: Task 1 Table Description',
    duration: '13:05',
    description: 'Learn to identify and compare the most significant values in tables without describing every single figure.',
    url: 'https://www.youtube.com/watch?v=twjWvYQ-saM',
    embedId: 'twjWvYQ-saM'
  },
  {
    id: 's50',
    type: 'video',
    title: 'IELTS Full Mock Test: Tips for Exam Day',
    source: 'IELTS Advantage',
    weaknessArea: 'General: Exam Strategy',
    duration: '25:00',
    description: 'Everything you need to know before sitting the real exam — timing, stationery, transfers, and mental preparation.',
    url: 'https://www.youtube.com/watch?v=_6jgygopp40',
    embedId: '_6jgygopp40'
  }
];

export default function Suggestions() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [completedResources, setCompletedResources] = useState<string[]>([]);

  const toggleComplete = (id: string) => {
    setCompletedResources(prev =>
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  const progressPercentage = Math.round(
    (completedResources.length / MOCK_SUGGESTIONS.length) * 100
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar
        activeTab="suggestion"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'
        } flex flex-col min-h-screen`}
      >
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* --- BANNER --- */}
          <div className="bg-[#7B61FF] rounded-2xl p-8 md:p-10 text-white shadow-md relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <h1 className="text-3xl font-bold mb-3 flex items-center gap-2">
                  Targeted Learning <BrainCircuit className="h-6 w-6 text-yellow-300" />
                </h1>
                <p className="text-indigo-50 text-base md:text-lg leading-relaxed">
                  We've analyzed your recent practice tests. Focus on these curated videos to strengthen your weak points and boost your overall band score.
                </p>
              </div>
            </div>
          </div>

          {/* --- WEAKNESS OVERVIEW --- */}
          <div className="mb-10">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-rose-500" /> Current Areas for Improvement
            </h3>
            <div className="flex flex-wrap gap-4">
              {IDENTIFIED_WEAKNESSES.map((weakness, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 font-bold text-sm">
                    {weakness.score}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{weakness.module}</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{weakness.topic}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- PROGRESS BAR --- */}
          <div className="mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
              <span>Your Learning Plan</span>
              <span className="text-[#7B61FF] dark:text-[#9b86ff]">
                {completedResources.length} of {MOCK_SUGGESTIONS.length} Completed
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#7B61FF] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* --- SUGGESTED RESOURCES GRID --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {MOCK_SUGGESTIONS.map((suggestion) => {
              const isCompleted = completedResources.includes(suggestion.id);

              return (
                <Card
                  key={suggestion.id}
                  className={`border transition-all duration-300 flex flex-col h-full overflow-hidden group
                    ${
                      isCompleted
                        ? 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 opacity-75'
                        : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-[#7B61FF]/50 dark:hover:border-[#7B61FF]/50'
                    }`}
                >
                  {/* Video git Embed */}
                  <div className="relative flex-shrink-0">
                    {suggestion.type === 'video' && suggestion.embedId ? (
                      <div className="w-full aspect-video">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${suggestion.embedId}`}
                          title={suggestion.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                          className="w-full h-full rounded-t-xl"
                        />
                      </div>
                    ) : (
                      <div
                        className="h-32 w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer"
                        onClick={() => window.open(suggestion.url, '_blank')}
                      >
                        <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    )}

                    {/* Resource Type Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <Badge
                        className={`backdrop-blur-md shadow-sm border-none ${
                          suggestion.type === 'video'
                            ? 'bg-black/40 text-white'
                            : 'bg-white/80 text-slate-800 dark:bg-slate-900/80 dark:text-slate-200'
                        }`}
                      >
                        {suggestion.type === 'video' ? (
                          <span className="flex items-center gap-1">
                            <Youtube className="w-3 h-3 text-rose-500" /> Video
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3 text-blue-500" /> Article
                          </span>
                        )}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="flex flex-col flex-grow p-5">
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-[#7B61FF] dark:text-[#9b86ff] bg-indigo-50 dark:bg-[#7B61FF]/10 px-2 py-1 rounded-md">
                        Targets: {suggestion.weaknessArea}
                      </span>
                    </div>

                    <h4
                      onClick={() => window.open(suggestion.url, '_blank')}
                      className={`text-lg font-bold mb-2 line-clamp-2 cursor-pointer ${
                        isCompleted
                          ? 'text-slate-500 dark:text-slate-400 line-through'
                          : 'text-slate-800 dark:text-slate-100 group-hover:text-[#7B61FF] dark:group-hover:text-[#9b86ff] transition-colors'
                      }`}
                    >
                      {suggestion.title}
                    </h4>

                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 flex-grow">
                      {suggestion.description}
                    </p>

                    <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {suggestion.duration}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          By {suggestion.source}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleComplete(suggestion.id)}
                          title={isCompleted ? 'Mark as unread' : 'Mark as completed'}
                          className={`rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 ${
                            isCompleted
                              ? 'text-emerald-500 hover:text-emerald-600'
                              : 'text-slate-300 hover:text-emerald-500'
                          }`}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(suggestion.url, '_blank')}
                          className="border-slate-200 dark:border-slate-700 hover:border-[#7B61FF] hover:text-[#7B61FF] dark:hover:border-[#9b86ff] dark:hover:text-[#9b86ff]"
                        >
                          View <ArrowUpRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

        </main>
      </div>
    </div>
  );
}