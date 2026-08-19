import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, ChevronRight, ChevronLeft, Building2, Users, BookOpen,
  CheckCircle2, XCircle, AlertTriangle, FileJson, Layers, ClipboardList,
  GraduationCap, BarChart3, Trash2, Eye, RotateCcw, Search, Filter,
  Loader2, ArrowLeft, Database, Zap, ShieldCheck, X, Download
} from 'lucide-react';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
import { SuperAdminTopbar } from '../Components/Superadmintopbar';
import type { ExamType, ExamSkill } from '@/shared/types/exam';
import { EXAM_REGISTRY, REGISTERED_EXAMS } from '@/shared/config/examRegistry';

// ─── Types ────────────────────────────────────────────────────────────────────

// ExamType and the skill list now come from the registry — never redeclared
// locally. TC-04 §0 principle 2 and TC-07: one exam vocabulary, one source.
type Skill = ExamSkill;
type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type Module = 'DRILLS' | 'INTERNAL_ASSESSMENT' | 'FULL_MOCK';
type QuestionType = 'MCQ' | 'TRUE_FALSE_NOT_GIVEN' | 'FORM' | 'ESSAY' | 'WRITING_PROMPT' | 'SPEAKING_PROMPT';
type BankStatus = 'active' | 'archived' | 'replaced';

interface Institute { id: string; name: string; studentCount: number; }
interface Batch { id: string; name: string; examType: ExamType; studentCount: number; }

interface ParsedQuestion {
  id: string; type: QuestionType; prompt_text: string;
  options?: Record<string, string>; correct_answer: string;
  explanation?: string; trap_type?: string; difficulty?: Difficulty;
  _valid: boolean; _errors: string[];
}

interface ValidationResult {
  total: number; valid: number; warnings: number; errors: number;
  questions: ParsedQuestion[];
  breakdown: Record<QuestionType, number>;
  missingExplanations: number;
}

interface BankRecord {
  id: string; uploadedAt: string; examType: ExamType; skill: Skill;
  difficulty: Difficulty; instituteName: string; batchName: string;
  modules: Module[]; questionCount: number; status: BankStatus;
  uploadedBy: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Skills per exam, read from the registry rather than duplicated here. */
const skillsFor = (exam: ExamType): readonly Skill[] => EXAM_REGISTRY[exam].skills;

/** Display label for an exam — TC-03 §5.1 Rule 2: never hand-typed or derived. */
const examLabel = (exam: ExamType): string => EXAM_REGISTRY[exam].shortLabel;

const TRAP_TYPES_IELTS = ['scope_distractor','true_but_irrelevant','extreme_language','paraphrase_confusion','temporal_distortion','inference_overreach'];
const TRAP_TYPES_GMAT  = ['correlation_causation','necessary_vs_sufficient','scope_shift','reverse_causality','extreme_language','out_of_scope'];

const MODULE_META: Record<Module, { label: string; icon: React.ReactNode; desc: string }> = {
  DRILLS:               { label: 'Daily Drills',          icon: <Zap className="w-4 h-4" />,          desc: 'Adaptive daily practice questions' },
  INTERNAL_ASSESSMENT:  { label: 'Internal Assessment',   icon: <ClipboardList className="w-4 h-4" />, desc: 'Mid-cycle formal assessments' },
  FULL_MOCK:            { label: 'Full Mock Assessment',   icon: <GraduationCap className="w-4 h-4" />, desc: 'Complete simulated exam sessions' },
};

const STATUS_STYLES: Record<BankStatus, string> = {
  active:   'text-emerald-600 bg-emerald-50 border-emerald-200',
  archived: 'text-brand-text-mute bg-brand-bg-alt border-brand-line',
  replaced: 'text-amber-600 bg-amber-50 border-amber-200',
};

// ─── Mock data for history table ──────────────────────────────────────────────

const MOCK_HISTORY: BankRecord[] = [
  { id: '1', uploadedAt: '2026-05-06T09:00:00Z', examType: 'IELTS', skill: 'READING', difficulty: 'INTERMEDIATE', instituteName: 'Prestige University', batchName: 'Batch B2 — May 2026', modules: ['DRILLS','INTERNAL_ASSESSMENT'], questionCount: 47, status: 'active', uploadedBy: 'Super Admin' },
  { id: '2', uploadedAt: '2026-05-04T14:30:00Z', examType: 'OET', skill: 'READING', difficulty: 'ADVANCED', instituteName: 'TechBridge Institute', batchName: 'OET Nursing — Apr 2026', modules: ['FULL_MOCK'], questionCount: 82, status: 'active', uploadedBy: 'Super Admin' },
  { id: '3', uploadedAt: '2026-04-28T11:00:00Z', examType: 'IELTS', skill: 'LISTENING', difficulty: 'BEGINNER', instituteName: 'Ace English Academy', batchName: 'Batch A1 — Mar 2026', modules: ['DRILLS'], questionCount: 35, status: 'replaced', uploadedBy: 'Super Admin' },
  { id: '4', uploadedAt: '2026-04-15T08:00:00Z', examType: 'SPOKEN', skill: 'SPEAKING', difficulty: 'INTERMEDIATE', instituteName: 'SpeakWell Institute', batchName: 'Corporate Batch — Apr 2026', modules: ['DRILLS','INTERNAL_ASSESSMENT','FULL_MOCK'], questionCount: 60, status: 'archived', uploadedBy: 'Super Admin' },
];

// ─── Client-side JSON validator ───────────────────────────────────────────────
// Accepts your backend seed format (flat array, no id, uses question_type):
// [{ "skill":"WRITING", "question_type":"MCQ", "prompt_text":"...",
//    "options":{...}, "correct_answer":"\"C\"", "difficulty":"BEGINNER" }]
// Also accepts wrapper format: { "questions": [...] }

function normaliseCorrectAnswer(raw: any): string {
  if (typeof raw !== 'string') return String(raw ?? '');
  return raw.replace(/^"+|"+$/g, '').replace(/\\"/g, '').trim();
}

function validateQuestionBank(raw: any): ValidationResult {
  const result: ValidationResult = {
    total: 0, valid: 0, warnings: 0, errors: 0,
    questions: [], breakdown: {} as Record<QuestionType, number>,
    missingExplanations: 0,
  };

  const questions: any[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.questions) ? raw.questions
    : Array.isArray(raw?.data?.questions) ? raw.data.questions
    : [];

  result.total = questions.length;

  questions.forEach((q: any, idx: number) => {
    const errors: string[] = [];
    let warns = 0;

    const qType: string  = (q.type ?? q.question_type ?? '').toUpperCase();
    const promptText: string = q.prompt_text ?? q.stem ?? q.question ?? '';
    const correctAnswer: string = normaliseCorrectAnswer(q.correct_answer ?? q.answer ?? '');
    const qId: string = q.id ?? q.question_id ?? `row_${idx + 1}`;

    if (!qType)         errors.push('Missing question_type field');
    if (!promptText)    errors.push('Missing prompt_text field');
    // WRITING_PROMPT and SPEAKING_PROMPT are open-ended — correct_answer is intentionally null
    const isOpenEnded = qType === 'WRITING_PROMPT' || qType === 'SPEAKING_PROMPT';
    if (!correctAnswer && !isOpenEnded) errors.push('Missing correct_answer field');

    const validQTypes: QuestionType[] = ['MCQ','TRUE_FALSE_NOT_GIVEN','FORM','ESSAY','WRITING_PROMPT','SPEAKING_PROMPT'];
    const normType: QuestionType = validQTypes.includes(qType as QuestionType)
      ? (qType as QuestionType) : 'MCQ';

    if (normType === 'MCQ') {
      const optCount = q.options ? Object.keys(q.options).length : 0;
      if (optCount < 2) errors.push('MCQ requires at least 2 options');
    }

    if (!q.explanation) warns++;

    result.breakdown[normType] = (result.breakdown[normType] ?? 0) + 1;

    const parsed: ParsedQuestion = {
      id: qId, type: normType, prompt_text: promptText,
      options: q.options, correct_answer: correctAnswer,
      explanation: q.explanation ?? undefined,
      trap_type: q.trap_type ?? undefined,
      difficulty: q.difficulty ?? undefined,
      _valid: errors.length === 0, _errors: errors,
    };

    if (errors.length > 0) result.errors++;
    else if (warns > 0) { result.warnings++; if (!q.explanation) result.missingExplanations++; }
    else result.valid++;
    result.questions.push(parsed);
  });

  return result;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StepDot = ({ n, current, label }: { n: number; current: number; label: string }) => {
  const done    = n < current;
  const active  = n === current;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all duration-300 shrink-0 ${
        done   ? 'bg-brand-teal-600 border-brand-teal-600 text-white' :
        active ? 'bg-white border-brand-teal-600 text-brand-teal-600' :
                 'bg-white border-brand-line text-brand-text-mute'
      }`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : n}
      </div>
      <span className={`font-jetbrains text-[9px] sm:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${active ? 'text-brand-teal-600' : 'text-brand-text-mute'}`}>{label}</span>
    </div>
  );
};

const StepConnector = ({ active }: { active: boolean }) => (
  <div className={`flex-1 h-0.5 mb-6 min-w-[8px] transition-all duration-500 ${active ? 'bg-brand-teal-600' : 'bg-brand-line'}`} />
);

// ─── Preview Drawer ───────────────────────────────────────────────────────────

function PreviewDrawer({ bank, onClose }: { bank: BankRecord | null; onClose: () => void }) {
  if (!bank) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-lg sm:max-w-xl bg-white border-l border-brand-line flex flex-col shadow-sm animate-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between gap-3 p-5 sm:p-6 border-b border-brand-line">
          <div className="min-w-0">
            <h3 className="font-manrope font-bold text-brand-text text-lg">Question Bank Preview</h3>
            <p className="text-xs text-brand-text-mute mt-0.5 break-words">{bank.instituteName} — {bank.batchName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-brand-bg-alt transition-colors shrink-0">
            <X className="w-5 h-5 text-brand-text-mute" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Exam', value: bank.examType },
              { label: 'Skill', value: bank.skill },
              { label: 'Difficulty', value: bank.difficulty },
              { label: 'Questions', value: bank.questionCount },
              { label: 'Status', value: bank.status.toUpperCase() },
              { label: 'Uploaded', value: new Date(bank.uploadedAt).toLocaleDateString() },
            ].map(({ label, value }) => (
              <div key={label} className="bg-brand-bg-alt rounded-xl p-3">
                <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm font-bold text-brand-text">{value}</p>
              </div>
            ))}
          </div>
          <div className="bg-brand-bg-alt rounded-xl p-3">
            <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-widest mb-2">Modules</p>
            <div className="flex flex-wrap gap-1.5">
              {bank.modules.map(m => (
                <span key={m} className="text-xs font-bold px-2 py-1 rounded-full bg-brand-teal-50 text-brand-teal-700 border border-brand-teal-200">
                  {MODULE_META[m].label}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 break-words">
            Full question preview requires fetching from backend. Connect <code className="font-jetbrains bg-amber-100 px-1 rounded text-xs break-all">GET /api/superadmin/question-banks/{'{id}'}/questions</code>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuestionBankManager() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Stepper state
  const [step, setStep] = useState(1);

  // Step 1 — target selection
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [batches, setBatches]       = useState<Batch[]>([]);
  const [loadingInstitutes, setLoadingInstitutes] = useState(false);
  const [loadingBatches, setLoadingBatches]       = useState(false);
  const [selectedExam, setSelectedExam]           = useState<ExamType | ''>('');
  const [selectedInstitute, setSelectedInstitute] = useState<Institute | null>(null);
  const [selectedBatch, setSelectedBatch]         = useState<Batch | null>(null);

  // Step 2 — module + skill
  const [selectedModules, setSelectedModules]     = useState<Module[]>([]);
  const [selectedSkill, setSelectedSkill]         = useState<Skill | ''>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | ''>('');

  // Step 3 — file upload
  const [file, setFile]                           = useState<File | null>(null);
  const [validation, setValidation]               = useState<ValidationResult | null>(null);
  const [validating, setValidating]               = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 4 — confirm
  const [uploading, setUploading]                 = useState(false);
  const [uploadDone, setUploadDone]               = useState(false);

  // History table
  const [history, setHistory]                     = useState<BankRecord[]>(MOCK_HISTORY);
  const [searchQuery, setSearchQuery]             = useState('');
  const [filterExam, setFilterExam]               = useState<ExamType | ''>('');
  const [previewBank, setPreviewBank]             = useState<BankRecord | null>(null);
  const [activeView, setActiveView]               = useState<'upload' | 'history'>('upload');

  // Load institutes on mount
  useEffect(() => {
    setLoadingInstitutes(true);
    // Replace with real API call: fetchInstitutes()
    setTimeout(() => {
      setInstitutes([
        { id: '1', name: 'Prestige University', studentCount: 340 },
        { id: '2', name: 'TechBridge Institute', studentCount: 180 },
        { id: '3', name: 'Ace English Academy', studentCount: 220 },
        { id: '4', name: 'SpeakWell Institute', studentCount: 95 },
      ]);
      setLoadingInstitutes(false);
    }, 600);
  }, []);

  // Load batches when institute changes
  useEffect(() => {
    if (!selectedInstitute) { setBatches([]); return; }
    setLoadingBatches(true);
    setSelectedBatch(null);
    // Replace with: fetchBatches(selectedInstitute.id)
    setTimeout(() => {
      setBatches([
        { id: 'b1', name: 'Batch A1 — May 2026', examType: 'IELTS', studentCount: 42 },
        { id: 'b2', name: 'Batch B2 — May 2026', examType: 'IELTS', studentCount: 38 },
        { id: 'b3', name: 'Spoken English — Corporate, Apr 2026', examType: 'SPOKEN', studentCount: 21 },
      ]);
      setLoadingBatches(false);
    }, 500);
  }, [selectedInstitute]);

  // Validate file when selected
  const handleFileChange = useCallback(async (f: File) => {
    setFile(f);
    setValidation(null);
    setValidating(true);
    try {
      const text = await f.text();
      const raw  = JSON.parse(text);
      await new Promise(r => setTimeout(r, 400)); // slight delay so UI feels responsive
      setValidation(validateQuestionBank(raw));
    } catch {
      setValidation({ total: 0, valid: 0, warnings: 0, errors: 1, missingExplanations: 0, questions: [], breakdown: {} as Record<QuestionType, number> });
    }
    setValidating(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.json')) handleFileChange(f);
  }, [handleFileChange]);

  const handleUpload = async () => {
    setUploading(true);
    // Replace with real API: POST /api/superadmin/question-banks
    await new Promise(r => setTimeout(r, 1500));
    const newRecord: BankRecord = {
      id: String(Date.now()), uploadedAt: new Date().toISOString(),
      examType: selectedExam as ExamType, skill: selectedSkill as Skill,
      difficulty: selectedDifficulty as Difficulty,
      instituteName: selectedInstitute!.name, batchName: selectedBatch!.name,
      modules: selectedModules, questionCount: validation?.valid ?? 0,
      status: 'active', uploadedBy: 'Super Admin',
    };
    setHistory(prev => [newRecord, ...prev]);
    setUploading(false);
    setUploadDone(true);
  };

  const resetFlow = () => {
    setStep(1); setSelectedExam(''); setSelectedInstitute(null);
    setSelectedBatch(null); setSelectedModules([]); setSelectedSkill('');
    setSelectedDifficulty(''); setFile(null); setValidation(null);
    setUploadDone(false); setUploading(false);
  };

  // Step validity guards
  const step1Valid = selectedExam && selectedInstitute && selectedBatch;
  const step2Valid = selectedModules.length > 0 && selectedSkill && selectedDifficulty;
  const step3Valid = validation && validation.errors === 0 && validation.total > 0;

  const filteredHistory = history.filter(b => {
    const matchSearch = !searchQuery || b.instituteName.toLowerCase().includes(searchQuery.toLowerCase()) || b.batchName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchExam   = !filterExam || b.examType === filterExam;
    return matchSearch && matchExam;
  });

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">
      <div className="hidden lg:block">
        <SuperAdminSidebar
          activeTab="question-bank"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <SuperAdminTopbar />

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 max-w-[90rem] mx-auto pb-16">
          <div className="space-y-6">

            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-brand-ink-deep text-white border border-brand-line-16 p-6 sm:p-8 shadow-sm">
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="w-4 h-4 text-brand-on-ink-mute" />
                    <span className="font-jetbrains text-xs font-bold text-brand-on-ink-mute uppercase tracking-[0.15em]">Super Admin</span>
                  </div>
                  <h1 className="font-manrope text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">Question Bank Manager</h1>
                  <p className="text-sm text-brand-on-ink mt-2 font-medium">Upload and assign question banks to specific institutes, batches, and modules.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <button
                    onClick={() => { setActiveView('upload'); resetFlow(); }}
                    className={`w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeView === 'upload' ? 'bg-white text-brand-teal-700 shadow-sm' : 'bg-white/5 text-white hover:bg-white/10 border border-brand-line-16'}`}
                  >
                    <Upload className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Upload New
                  </button>
                  <button
                    onClick={() => setActiveView('history')}
                    className={`w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeView === 'history' ? 'bg-white text-brand-teal-700 shadow-sm' : 'bg-white/5 text-white hover:bg-white/10 border border-brand-line-16'}`}
                  >
                    <BarChart3 className="w-4 h-4 inline mr-1.5 -mt-0.5" /> History ({history.length})
                  </button>
                </div>
              </div>
            </div>

            {/* ── UPLOAD FLOW ─────────────────────────────────────────────── */}
            {activeView === 'upload' && (
              <div className="space-y-6">

                {/* Stepper */}
                {!uploadDone && (
                  <div className="bg-white border border-brand-line rounded-2xl p-4 sm:p-6 shadow-sm">
                    <div className="flex items-center gap-0">
                      <StepDot n={1} current={step} label="Target" />
                      <StepConnector active={step > 1} />
                      <StepDot n={2} current={step} label="Module" />
                      <StepConnector active={step > 2} />
                      <StepDot n={3} current={step} label="Upload" />
                      <StepConnector active={step > 3} />
                      <StepDot n={4} current={step} label="Confirm" />
                    </div>
                  </div>
                )}

                {/* ── STEP 1: Target Selection ── */}
                {step === 1 && (
                  <div className="bg-white border border-brand-line rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm space-y-6">
                    <div>
                      <h2 className="font-manrope text-lg font-bold text-brand-text mb-0.5">Select Target</h2>
                      <p className="text-sm text-brand-text-mute">Choose the exam type, institute, and batch to assign questions to.</p>
                    </div>

                    {/* Exam Type */}
                    <div>
                      <label className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] block mb-2">Exam Type</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {REGISTERED_EXAMS.map(exam => (
                          <button key={exam} onClick={() => { setSelectedExam(exam); setSelectedSkill(''); }}
                            className={`w-full min-h-[44px] py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${selectedExam === exam ? 'border-brand-teal-600 bg-brand-teal-50 text-brand-teal-700' : 'border-brand-line text-brand-text hover:border-brand-teal-300'}`}>
                            {examLabel(exam)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Institute */}
                    <div>
                      <label className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] block mb-2">Institute</label>
                      {loadingInstitutes ? (
                        <div className="flex items-center gap-2 py-4 text-brand-text-mute text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading institutes…</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {institutes.map(inst => (
                            <button key={inst.id} onClick={() => setSelectedInstitute(inst)}
                              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedInstitute?.id === inst.id ? 'border-brand-teal-600 bg-brand-teal-50' : 'border-brand-line hover:border-brand-teal-300'}`}>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 shrink-0 rounded-lg bg-brand-teal-100 flex items-center justify-center text-xs font-black text-brand-teal-700">
                                  {inst.name.split(' ').map(w=>w[0]).slice(0,2).join('')}
                                </div>
                                <div className="min-w-0">
                                  <p className={`text-sm font-bold ${selectedInstitute?.id === inst.id ? 'text-brand-teal-700' : 'text-brand-text'}`}>{inst.name}</p>
                                  <p className="text-xs text-brand-text-mute">{inst.studentCount} students</p>
                                </div>
                                {selectedInstitute?.id === inst.id && <CheckCircle2 className="w-4 h-4 text-brand-teal-600 ml-auto shrink-0" />}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Batch */}
                    {selectedInstitute && (
                      <div>
                        <label className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] block mb-2">Batch</label>
                        {loadingBatches ? (
                          <div className="flex items-center gap-2 py-4 text-brand-text-mute text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading batches…</div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {batches.map(batch => {
                              const mismatch = selectedExam && batch.examType !== selectedExam;
                              return (
                                <button key={batch.id} onClick={() => !mismatch && setSelectedBatch(batch)}
                                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedBatch?.id === batch.id ? 'border-brand-teal-600 bg-brand-teal-50' : mismatch ? 'border-brand-line opacity-40 cursor-not-allowed' : 'border-brand-line hover:border-brand-teal-300'}`}>
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className={`text-sm font-bold ${selectedBatch?.id === batch.id ? 'text-brand-teal-700' : 'text-brand-text'}`}>{batch.name}</p>
                                      <p className="text-xs text-brand-text-mute mt-0.5">{batch.studentCount} students</p>
                                    </div>
                                    <span className={`font-jetbrains text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${mismatch ? 'bg-rose-50 text-rose-500' : 'bg-brand-bg-alt text-brand-text-mute'}`}>
                                      {batch.examType.replace('_',' ')}
                                    </span>
                                  </div>
                                  {mismatch && <p className="text-[10px] text-rose-500 mt-1 font-bold">Exam type mismatch</p>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button disabled={!step1Valid} onClick={() => setStep(2)}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-brand-teal-600 hover:bg-brand-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-sm">
                        Continue <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Module & Skill ── */}
                {step === 2 && (
                  <div className="bg-white border border-brand-line rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm space-y-6">
                    <div>
                      <h2 className="font-manrope text-lg font-bold text-brand-text mb-0.5">Assign to Module</h2>
                      <p className="text-sm text-brand-text-mute">Choose which modules this question bank feeds into, and specify skill and difficulty.</p>
                    </div>

                    {/* Summary pill */}
                    <div className="flex flex-wrap gap-2">
                      {[selectedExam, selectedInstitute?.name, selectedBatch?.name].map((v, i) => v && (
                        <span key={i} className="text-xs font-bold px-3 py-1.5 bg-brand-teal-50 text-brand-teal-700 border border-brand-teal-200 rounded-full">
                          {v.replace('_',' ')}
                        </span>
                      ))}
                    </div>

                    {/* Modules */}
                    <div>
                      <label className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] block mb-2">Modules <span className="text-rose-500">*</span></label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(Object.entries(MODULE_META) as [Module, typeof MODULE_META[Module]][]).map(([key, meta]) => {
                          const selected = selectedModules.includes(key);
                          return (
                            <button key={key}
                              onClick={() => setSelectedModules(prev => selected ? prev.filter(m => m !== key) : [...prev, key])}
                              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selected ? 'border-brand-teal-600 bg-brand-teal-50' : 'border-brand-line hover:border-brand-teal-300'}`}>
                              <div className={`flex items-center gap-2 mb-1.5 ${selected ? 'text-brand-teal-600' : 'text-brand-text-mute'}`}>{meta.icon}<span className="font-jetbrains text-[10px] font-bold uppercase tracking-wider">{meta.label}</span></div>
                              <p className="text-xs text-brand-text-mute">{meta.desc}</p>
                              {selected && <div className="mt-2 flex items-center gap-1 text-brand-teal-600"><CheckCircle2 className="w-3 h-3" /><span className="font-jetbrains text-[10px] font-bold uppercase tracking-wider">Selected</span></div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Skill */}
                    <div>
                      <label className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] block mb-2">Skill <span className="text-rose-500">*</span></label>
                      <div className="flex flex-wrap gap-2">
                        {(selectedExam ? skillsFor(selectedExam) : []).map(skill => (
                          <button key={skill} onClick={() => setSelectedSkill(skill)}
                            className={`min-h-[44px] px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${selectedSkill === skill ? 'border-brand-teal-600 bg-brand-teal-50 text-brand-teal-700' : 'border-brand-line text-brand-text hover:border-brand-teal-300'}`}>
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] block mb-2">Difficulty <span className="text-rose-500">*</span></label>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {(['BEGINNER','INTERMEDIATE','ADVANCED'] as Difficulty[]).map(d => (
                          <button key={d} onClick={() => setSelectedDifficulty(d)}
                            className={`min-h-[44px] px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${selectedDifficulty === d
                              ? d === 'BEGINNER'     ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : d === 'INTERMEDIATE' ? 'border-amber-500 bg-amber-50 text-amber-700'
                              :                        'border-rose-500 bg-rose-50 text-rose-700'
                              : 'border-brand-line text-brand-text hover:border-brand-teal-300'}`}>
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2">
                      <button onClick={() => setStep(1)} className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-5 py-3 rounded-xl border-2 border-brand-line text-brand-text font-bold text-sm hover:border-brand-teal-300 transition-all">
                        <ChevronLeft className="w-4 h-4" /> Back
                      </button>
                      <button disabled={!step2Valid} onClick={() => setStep(3)}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-brand-teal-600 hover:bg-brand-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-sm">
                        Continue <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: JSON Upload ── */}
                {step === 3 && (
                  <div className="bg-white border border-brand-line rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm space-y-6">
                    <div>
                      <h2 className="font-manrope text-lg font-bold text-brand-text mb-0.5">Upload Question Bank</h2>
                      <p className="text-sm text-brand-text-mute">Upload a JSON file. It is validated in your browser before upload — no server round-trip needed.</p>
                    </div>

                    {/* Schema hint */}
                    <div className="bg-brand-bg-alt rounded-xl p-4 border border-brand-line">
                      <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-[0.15em] mb-2">Expected JSON Structure</p>
                      <pre className="text-xs text-brand-text-mute overflow-x-auto font-jetbrains leading-relaxed">{`{
  "exam_type": "${selectedExam || 'IELTS'}",
  "skill": "${selectedSkill || 'READING'}",
  "difficulty": "${selectedDifficulty || 'INTERMEDIATE'}",
  "questions": [
    {
      "id": "q_001",
      "type": "MCQ",
      "prompt_text": "Question text here...",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct_answer": "B",
      "explanation": "Because...",
      "trap_type": "scope_distractor"
    }
  ]
}`}</pre>
                    </div>

                    {/* Drop zone */}
                    <div
                      onDragOver={e => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileRef.current?.click()}
                      className={`w-full border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-all ${file ? 'border-brand-teal-400 bg-brand-teal-50' : 'border-brand-line hover:border-brand-teal-400 hover:bg-brand-teal-50/50'}`}
                    >
                      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0])} />
                      {validating ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-10 h-10 text-brand-teal-500 animate-spin" />
                          <p className="text-sm font-bold text-brand-text">Validating questions…</p>
                        </div>
                      ) : file ? (
                        <div className="flex flex-col items-center gap-2">
                          <FileJson className="w-10 h-10 text-brand-teal-500" />
                          <p className="text-sm font-bold text-brand-teal-700 break-all">{file.name}</p>
                          <p className="text-xs text-brand-text-mute">{(file.size / 1024).toFixed(1)} KB · Click to replace</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <Upload className="w-10 h-10 text-brand-text-mute" />
                          <div>
                            <p className="text-sm font-bold text-brand-text">Drop your JSON file here</p>
                            <p className="text-xs text-brand-text-mute mt-1">or click to browse — .json files only</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Validation result */}
                    {validation && !validating && (
                      <div className="space-y-3 animate-in fade-in duration-300">
                        {/* Summary */}
                        <div className={`rounded-xl p-4 border flex flex-wrap gap-4 items-center ${
                          validation.errors > 0
                            ? 'bg-rose-50 border-rose-200'
                            : validation.warnings > 0
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-emerald-50 border-emerald-200'
                        }`}>
                          {[
                            { label: 'Total',    value: validation.total,    color: 'text-brand-text' },
                            { label: 'Valid',    value: validation.valid,    color: 'text-emerald-600' },
                            { label: 'Warnings', value: validation.warnings, color: 'text-amber-600' },
                            { label: 'Errors',   value: validation.errors,   color: 'text-rose-600' },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="flex flex-col items-center gap-0.5 min-w-[60px] flex-1 sm:flex-none">
                              <span className={`text-2xl font-black ${color}`}>{value}</span>
                              <span className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-wider">{label}</span>
                            </div>
                          ))}
                        </div>

                        {/* Breakdown */}
                        {Object.keys(validation.breakdown).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(validation.breakdown).map(([type, count]) => (
                              <span key={type} className="font-jetbrains text-xs font-bold px-3 py-1.5 bg-brand-bg-alt text-brand-text-mute rounded-full border border-brand-line">
                                {type}: {count}
                              </span>
                            ))}
                            {validation.missingExplanations > 0 && (
                              <span className="text-xs font-bold px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                                ⚠ {validation.missingExplanations} missing explanations
                              </span>
                            )}
                          </div>
                        )}

                        {/* Error list */}
                        {validation.errors > 0 && (
                          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                            <p className="font-jetbrains text-[10px] font-bold text-rose-600 uppercase tracking-[0.15em] mb-2">Validation Errors — fix these before uploading</p>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {validation.questions.filter(q => !q._valid).map(q => (
                                <div key={q.id} className="flex items-start gap-2 text-xs text-rose-700">
                                  <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  <span className="break-words"><strong>id: {q.id}</strong> — {q._errors.join(', ')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2">
                      <button onClick={() => setStep(2)} className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-5 py-3 rounded-xl border-2 border-brand-line text-brand-text font-bold text-sm hover:border-brand-teal-300 transition-all">
                        <ChevronLeft className="w-4 h-4" /> Back
                      </button>
                      <button disabled={!step3Valid} onClick={() => setStep(4)}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-brand-teal-600 hover:bg-brand-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-sm">
                        Review &amp; Confirm <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 4: Confirm ── */}
                {step === 4 && !uploadDone && (
                  <div className="bg-white border border-brand-line rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm space-y-6">
                    <div>
                      <h2 className="font-manrope text-lg font-bold text-brand-text mb-0.5">Confirm Upload</h2>
                      <p className="text-sm text-brand-text-mute">Review the details below. Once confirmed, questions will be assigned to the selected batch immediately.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Exam Type',   value: selectedExam ? examLabel(selectedExam) : '' },
                        { label: 'Institute',   value: selectedInstitute?.name ?? '' },
                        { label: 'Batch',       value: selectedBatch?.name ?? '' },
                        { label: 'Skill',       value: selectedSkill },
                        { label: 'Difficulty',  value: selectedDifficulty },
                        { label: 'Questions',   value: `${validation?.valid} valid of ${validation?.total} parsed` },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-brand-bg-alt rounded-xl p-4 border border-brand-line">
                          <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-widest mb-1">{label}</p>
                          <p className="text-sm font-bold text-brand-text break-words">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-brand-bg-alt rounded-xl p-4 border border-brand-line">
                      <p className="font-jetbrains text-[10px] font-bold text-brand-text-mute uppercase tracking-widest mb-2">Modules</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedModules.map(m => (
                          <span key={m} className="text-xs font-bold px-3 py-1.5 bg-brand-teal-50 text-brand-teal-700 border border-brand-teal-200 rounded-full">
                            {MODULE_META[m].label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {validation?.warnings && validation.warnings > 0 ? (
                      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                          <strong>{validation.warnings} questions are missing explanations.</strong> They will upload successfully but students won't see explanation text for those questions. You can fix and re-upload later.
                        </p>
                      </div>
                    ) : null}

                    <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2">
                      <button onClick={() => setStep(3)} className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-5 py-3 rounded-xl border-2 border-brand-line text-brand-text font-bold text-sm hover:border-brand-teal-300 transition-all">
                        <ChevronLeft className="w-4 h-4" /> Back
                      </button>
                      <button onClick={handleUpload} disabled={uploading}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-8 py-3 rounded-xl bg-brand-teal-600 hover:bg-brand-teal-700 disabled:opacity-60 text-white font-black text-sm transition-all shadow-sm">
                        {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><ShieldCheck className="w-4 h-4" /> Confirm Upload</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── SUCCESS ── */}
                {uploadDone && (
                  <div className="bg-white border border-emerald-200 rounded-2xl p-8 sm:p-12 shadow-sm flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="font-manrope text-2xl font-black text-brand-text mb-1">Upload Successful!</h2>
                      <p className="text-brand-text-mute text-sm">
                        <strong>{validation?.valid} questions</strong> assigned to <strong>{selectedBatch?.name}</strong> at <strong>{selectedInstitute?.name}</strong>.
                        <br />Students in this batch will see questions from this bank in their next session.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full sm:w-auto">
                      <button onClick={resetFlow}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-brand-teal-600 hover:bg-brand-teal-700 text-white font-bold text-sm transition-all shadow-sm">
                        <Upload className="w-4 h-4" /> Upload Another
                      </button>
                      <button onClick={() => setActiveView('history')}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border-2 border-brand-line text-brand-text font-bold text-sm hover:border-brand-teal-300 transition-all">
                        <BarChart3 className="w-4 h-4" /> View History
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── HISTORY TABLE ───────────────────────────────────────────── */}
            {activeView === 'history' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-brand-text-mute absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search by institute or batch…"
                      className="w-full min-h-[44px] pl-9 pr-4 py-2.5 rounded-xl border border-brand-line bg-white text-sm text-brand-text placeholder-brand-text-mute outline-none focus:border-brand-teal-500 transition-colors"
                    />
                  </div>
                  <select value={filterExam} onChange={e => setFilterExam(e.target.value as ExamType | '')}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl border border-brand-line bg-white text-sm text-brand-text outline-none focus:border-brand-teal-500 transition-colors">
                    <option value="">All Exams</option>
                    {REGISTERED_EXAMS.map(e => <option key={e} value={e}>{examLabel(e)}</option>)}
                  </select>
                </div>

                {/* Table */}
                <div className="bg-white border border-brand-line rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[720px]">
                      <thead>
                        <tr className="border-b border-brand-line bg-brand-bg-alt">
                          {['Upload Date','Exam','Institute / Batch','Skill','Difficulty','Modules','Questions','Status','Actions'].map(h => (
                            <th key={h} className="font-jetbrains px-4 py-3 text-left text-[10px] font-black text-brand-text-mute uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-line">
                        {filteredHistory.length === 0 ? (
                          <tr><td colSpan={9} className="text-center py-12 text-brand-text-mute text-sm">No question banks found</td></tr>
                        ) : filteredHistory.map(bank => (
                          <tr key={bank.id} className="hover:bg-brand-teal-50/50 transition-colors">
                            <td className="px-4 py-3 text-xs text-brand-text-mute whitespace-nowrap">{new Date(bank.uploadedAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3"><span className="text-xs font-black text-brand-teal-600">{bank.examType.replace('_',' ')}</span></td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-brand-text text-xs">{bank.instituteName}</p>
                              <p className="text-[11px] text-brand-text-mute mt-0.5">{bank.batchName}</p>
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-brand-text-mute">{bank.skill}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                bank.difficulty === 'BEGINNER' ? 'bg-emerald-50 text-emerald-600' :
                                bank.difficulty === 'INTERMEDIATE' ? 'bg-amber-50 text-amber-600' :
                                'bg-rose-50 text-rose-600'
                              }`}>{bank.difficulty}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {bank.modules.map(m => (
                                  <span key={m} className="text-[9px] font-black px-1.5 py-0.5 rounded bg-brand-teal-50 text-brand-teal-600 border border-brand-teal-100">{m === 'DRILLS' ? 'Drills' : m === 'INTERNAL_ASSESSMENT' ? 'IA' : 'Mock'}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-black text-brand-text">{bank.questionCount}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${STATUS_STYLES[bank.status]}`}>{bank.status}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <button onClick={() => setPreviewBank(bank)}
                                  className="p-2 rounded-lg hover:bg-brand-teal-50 text-brand-text-mute hover:text-brand-teal-600 transition-colors" title="Preview">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button className="p-2 rounded-lg hover:bg-amber-50 text-brand-text-mute hover:text-amber-600 transition-colors" title="Replace">
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                                <button onClick={() => setHistory(prev => prev.map(b => b.id === bank.id ? { ...b, status: 'archived' } : b))}
                                  className="p-2 rounded-lg hover:bg-rose-50 text-brand-text-mute hover:text-rose-600 transition-colors" title="Archive">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="text-xs text-brand-text-mute text-center">Showing {filteredHistory.length} of {history.length} question banks</p>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Preview Drawer */}
      <PreviewDrawer bank={previewBank} onClose={() => setPreviewBank(null)} />
    </div>
  );
}