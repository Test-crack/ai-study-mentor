// src/features/Student/pages/StudentProfilePage.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/shared/components/ui/dialog';
import { useToast } from '@/shared/hooks/use-toast';
import { getBackendUrl } from '@/shared/utils';
import { callBackend, uploadFileToBackend } from '@/features/auth/services/authClient';
import {
  Loader2, Upload, Trash2, User, Mail, Phone, Calendar,
  Shield, Bell, Settings, CheckCircle2, Camera, Target, Pencil,
  TrendingUp, AlertTriangle, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Calendar as DayCalendar } from '@/shared/components/ui/calendar';
import { format } from 'date-fns';
import StudentLayout from './StudentLayout';

// ─── Band scale (IELTS): 4.0 → 9.0 in 0.5 steps ─────────────────────────────
const BAND_MIN = 4.0;
const BAND_MAX = 9.0;
const BAND_STEP = 0.5;
const BAND_OPTIONS = Array.from(
  { length: Math.round((BAND_MAX - BAND_MIN) / BAND_STEP) + 1 },
  (_, i) => Number((BAND_MIN + i * BAND_STEP).toFixed(1))
);

// Same rounding the dashboard uses (overallBand in StudentDashboardPage).
const roundToHalf = (n: number) => Math.round(n * 2) / 2;

// ─── Date helpers (local-time, no UTC day-shift) ────────────────────────────
// A date picked at local midnight, run through toISOString(), can roll back a day
// in western timezones. These stay in local terms end-to-end.
const ymdLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseYMD = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const startOfLocalDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

// Backend sends exam_date already as YYYY-MM-DD; keep a tolerant converter for reads.
const toDateInputValue = (d: Date) => ymdLocal(d);

// ─── Exam date bounds: tomorrow → ~2 years out ──────────────────────────────
const MIN_EXAM_DATE = ymdLocal(new Date(Date.now() + 86400000));
const MAX_EXAM_DATE = ymdLocal(new Date(Date.now() + 2 * 365 * 86400000));
const MIN_EXAM_DATE_OBJ = startOfLocalDay(new Date(Date.now() + 86400000));
const MAX_EXAM_DATE_OBJ = startOfLocalDay(new Date(Date.now() + 2 * 365 * 86400000));

export default function StudentProfilePage() {
  const navigate = useNavigate();
  const { profile, loading, profileLoading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'preferences'>('general');

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Target Band editor state ──────────────────────────────────────────────
  const [bandDialogOpen, setBandDialogOpen] = useState(false);
  const [selectedBand, setSelectedBand] = useState<number | null>(null);
  const [savingBand, setSavingBand] = useState(false);

  // ─── Exam Date editor state ────────────────────────────────────────────────
  const [examDate, setExamDateState] = useState<string | null>(null); // 'YYYY-MM-DD'
  const [examDateDraft, setExamDateDraft] = useState('');
  const [savingExamDate, setSavingExamDate] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Band data — same source of truth as the student dashboard:
  // GET /api/student/competency-scores → data[].band_score + target_band + exam_date
  const [bandsLoading, setBandsLoading] = useState(true);
  const [bandsError, setBandsError] = useState(false);
  const [currentBand, setCurrentBand] = useState<number | null>(null);
  const [targetBand, setTargetBandState] = useState<number | null>(null);

  const fetchBandData = useCallback(async () => {
    setBandsLoading(true);
    setBandsError(false);
    try {
      const backendUrl = getBackendUrl();
      const resData = await callBackend(`${backendUrl}/api/student/competency-scores`);
      if (resData.success && Array.isArray(resData.data) && resData.data.length > 0) {
        // Identical derivation to overallBand() on the dashboard: average of
        // the 4 skill band_scores, rounded to the nearest half band.
        const scores = resData.data.map((m: any) => Number(m.band_score) || 4.0);
        const avg = scores.reduce((s: number, n: number) => s + n, 0) / scores.length;
        setCurrentBand(roundToHalf(avg));
      } else {
        setCurrentBand(null);
      }
      const t = Number(resData.target_band);
      setTargetBandState(Number.isFinite(t) && t > 0 ? roundToHalf(t) : null);
      // Exam date — backend returns YYYY-MM-DD. Use it as-is when it already matches
      // that shape (no Date round-trip, so no timezone day-shift).
      const rawExam = resData.exam_date ?? resData.examDate ?? null;
      const iso =
        typeof rawExam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawExam)
          ? rawExam
          : rawExam
            ? ymdLocal(new Date(rawExam))
            : null;
      setExamDateState(iso);
      setExamDateDraft(iso ?? '');
    } catch (err) {
      console.error('[TargetBand] competency-scores fetch failed:', err);
      setBandsError(true);
      setCurrentBand(null);
      setTargetBandState(null);
      setExamDateState(null);
      setExamDateDraft('');
    } finally {
      setBandsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBandData();
  }, [fetchBandData]);

  const [formData, setFormData] = useState({
    name: '',
    phoneNo: '',
    bio: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phoneNo: profile.phoneNo || '',
        bio: profile.Instructor?.bio || '',
      });
    }
  }, [profile]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 5MB.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);
      const backendUrl = getBackendUrl();
      await uploadFileToBackend(`${backendUrl}/api/profile/image`, formData, 'PUT');
      await refreshProfile();
      toast({ title: 'Profile photo updated', description: 'Looking good!' });
    } catch (error) {
      console.error('Upload failed', error);
      toast({ title: 'Upload failed', description: 'Could not upload image.', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageRemove = async () => {
    if (!profile?.profileImage) return;
    setUploading(true);
    try {
      const backendUrl = getBackendUrl();
      await callBackend(`${backendUrl}/api/profile/image`, { method: 'DELETE' });
      await refreshProfile();
      toast({ title: 'Photo removed', description: 'Profile photo has been reset.' });
    } catch (error) {
      toast({ title: 'Action failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const backendUrl = getBackendUrl();
      const payload = {
        name: formData.name || null,
        phoneNo: formData.phoneNo || null,
      };
      const data = await callBackend(`${backendUrl}/api/profile`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (data.user || data.data?.user) {
        await refreshProfile();
        toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
      }
    } catch (error) {
      toast({ title: 'Update failed', description: 'Please try again later.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ─── Target Band handlers ──────────────────────────────────────────────────
  // Guard 1: chips render disabled. Fail closed while loading or on error.
  const isBandLocked = (band: number) => {
    if (bandsLoading || bandsError) return true;
    return currentBand != null && band < currentBand;
  };

  const targetTooLow =
    selectedBand != null && currentBand != null && selectedBand < currentBand;

  const openBandDialog = () => {
    // Pre-select saved target, clamped up to current band if legacy data sits below it.
    const base = targetBand ?? currentBand ?? null;
    const clamped =
      base != null && currentBand != null && base < currentBand ? currentBand : base;
    setSelectedBand(clamped);
    setBandDialogOpen(true);
  };

  const handleTargetBandSave = async () => {
    if (selectedBand == null) return;
    // Guard 3: re-validate at save time.
    if (bandsLoading || bandsError) {
      toast({
        title: 'Current band unavailable',
        description: 'We could not load your current band, so the target cannot be changed right now.',
        variant: 'destructive',
      });
      return;
    }
    if (currentBand != null && selectedBand < currentBand) {
      toast({
        title: 'Target too low',
        description: `Your target can't be below your current Band ${currentBand.toFixed(1)}.`,
        variant: 'destructive',
      });
      return;
    }
    setSavingBand(true);
    try {
      const backendUrl = getBackendUrl();
      // Contract: PUT /api/profile accepts `targetBand` (validated 4.0–9.0, snapped to 0.5)
      // and writes institute_students.target_band.
      await callBackend(`${backendUrl}/api/profile`, {
        method: 'PUT',
        body: JSON.stringify({ targetBand: selectedBand }),
      });

      // Verify against the same endpoint the dashboard reads, so a silently
      // ignored field surfaces as an error instead of a fake success.
      let persisted: number | null = null;
      let verified = false;
      try {
        const check = await callBackend(`${backendUrl}/api/student/competency-scores`);
        const t = Number(check?.target_band);
        persisted = Number.isFinite(t) && t > 0 ? roundToHalf(t) : null;
        verified = true;
      } catch {
        // Verification unavailable — proceed optimistically.
      }

      if (!verified || persisted === selectedBand) {
        setTargetBandState(selectedBand);
        setBandDialogOpen(false);
        toast({ title: 'Target updated', description: `You're now aiming for Band ${selectedBand.toFixed(1)}.` });
      } else {
        toast({
          title: 'Save did not persist',
          description: 'The server accepted the request but your target band did not update. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({ title: 'Update failed', description: 'Could not save your target band. Please try again.', variant: 'destructive' });
    } finally {
      setSavingBand(false);
    }
  };

  // ─── Exam Date handler ─────────────────────────────────────────────────────
  const handleExamDateSave = async () => {
    if (!examDateDraft) return;
    if (examDateDraft < MIN_EXAM_DATE || examDateDraft > MAX_EXAM_DATE) {
      toast({
        title: 'Invalid date',
        description: 'Exam date must be in the future (within 2 years).',
        variant: 'destructive',
      });
      return;
    }
    setSavingExamDate(true);
    try {
      const backendUrl = getBackendUrl();
      // Contract: PUT /api/profile accepts `examDate` (validated future date) and
      // writes institute_students.exam_date.
      await callBackend(`${backendUrl}/api/profile`, {
        method: 'PUT',
        body: JSON.stringify({ examDate: examDateDraft }),
      });

      // Verify against the endpoint the dashboard reads.
      let persisted: string | null = null;
      let verified = false;
      try {
        const check = await callBackend(`${backendUrl}/api/student/competency-scores`);
        const raw = check?.exam_date ?? check?.examDate ?? null;
        persisted =
          typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)
            ? raw
            : raw
              ? ymdLocal(new Date(raw))
              : null;
        verified = true;
      } catch {
        // Verification unavailable — proceed optimistically.
      }

      if (!verified || persisted === examDateDraft) {
        setExamDateState(examDateDraft);
        toast({ title: 'Exam date saved', description: `Locked in for ${examDateDraft}. Your dashboard readiness now uses it.` });
      } else {
        toast({
          title: 'Save did not persist',
          description: 'The server accepted the request but your exam date did not update. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({ title: 'Update failed', description: 'Could not save your exam date. Please try again.', variant: 'destructive' });
    } finally {
      setSavingExamDate(false);
    }
  };

  const getInitials = () => {
    if (formData.name) return formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return profile?.email?.[0].toUpperCase() || 'S';
  };

  return (
    <StudentLayout
      activeTab="settings"
      mainClassName="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      {/* Header Section */}
      <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800">
        {/* Cover / Banner Gradient */}
        <div className="h-32 bg-gradient-to-r from-brand-teal-600 via-brand-blue-600 to-brand-blue-600 dark:from-brand-teal-900 dark:to-slate-900"></div>

        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row items-end -mt-12 gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="h-28 w-28 rounded-full border-4 border-white dark:border-slate-900 shadow-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                {uploading ? (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                ) : null}

                {profile?.profileImage ? (
                  <img src={profile.profileImage} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-brand-teal-600 dark:text-brand-teal-400">{getInitials()}</span>
                )}

                {/* Upload Overlay */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer z-10"
                >
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Hidden Input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {profile?.name || 'Student'}
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {profile?.email}</span>
                <Badge variant="secondary" className="bg-brand-teal-50 text-brand-teal-700 dark:bg-brand-teal-900/30 dark:text-brand-teal-300 border-brand-teal-100 dark:border-brand-teal-800">
                  {profile?.role || 'STUDENT'}
                </Badge>
              </div>
            </div>

            {/* Remove Photo Action */}
            {profile?.profileImage && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleImageRemove}
                className="mb-2 hidden md:flex"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Remove Photo
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex gap-8 overflow-x-auto">
            {[
              { id: 'general', label: 'General Info', icon: User },
              { id: 'security', label: 'Security', icon: Shield },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-brand-teal-600 text-brand-teal-600 dark:text-brand-teal-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Main Form */}
        <div className="xl:col-span-2 space-y-6">
          {activeTab === 'general' && (
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Personal Information</CardTitle>
                <CardDescription className="dark:text-slate-400">Update your personal details here.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-600 dark:text-slate-300">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-brand-teal-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-600 dark:text-slate-300">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phoneNo}
                      onChange={(e) => handleInputChange('phoneNo', e.target.value)}
                      placeholder="+1 234 567 890"
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-brand-teal-500"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-600 dark:text-slate-300">Email Address</Label>
                    <div className="flex items-center px-3 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm">
                      <Mail className="h-4 w-4 mr-2" />
                      {profile?.email}
                      <Badge variant="outline" className="ml-auto text-green-600 border-green-200 bg-green-50 dark:bg-green-900/10 dark:text-green-400 dark:border-green-800">Verified</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-brand-teal-600 hover:bg-brand-teal-700 text-white min-w-[140px]"
                  >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Security Settings</CardTitle>
                <CardDescription className="dark:text-slate-400">Manage your password and account security.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Password</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Last changed 3 months ago</p>
                  </div>
                  <Button variant="outline" className="dark:border-slate-700 dark:text-slate-300">Change Password</Button>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between opacity-60">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Two-Factor Authentication</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Add an extra layer of security.</p>
                  </div>
                  <Button variant="outline" disabled className="dark:border-slate-700">Coming Soon</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Stats / Info */}
        <div className="space-y-6">
          {/* Goal Tracking — Target Band + Exam Date */}
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Target className="h-4 w-4 text-brand-teal-600 dark:text-brand-teal-400" />
                Goal Tracking
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={openBandDialog}
                disabled={bandsLoading || bandsError}
                className="dark:border-slate-700 dark:text-slate-300"
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">Current band</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {bandsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  ) : currentBand != null ? (
                    currentBand.toFixed(1)
                  ) : (
                    '—'
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">Target band</span>
                <span className="font-bold text-brand-teal-600 dark:text-brand-teal-400">
                  {bandsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  ) : targetBand != null ? (
                    targetBand.toFixed(1)
                  ) : (
                    'Not set'
                  )}
                </span>
              </div>

              {/* Exam date */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Exam date
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white text-sm">
                    {bandsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    ) : (
                      examDate ?? 'Not set'
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        disabled={bandsLoading}
                        className={`flex h-9 flex-1 items-center gap-2 rounded-lg border px-3 text-sm transition-colors
                          ${examDateDraft
                            ? 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                            : 'border-dashed border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500'}
                          bg-slate-50 dark:bg-slate-800 hover:border-brand-teal-400 dark:hover:border-brand-teal-500
                          focus:outline-none focus:ring-2 focus:ring-brand-teal-500/40 disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        <Calendar className="h-4 w-4 shrink-0 text-brand-teal-500 dark:text-brand-teal-400" />
                        <span className="truncate">
                          {examDateDraft ? format(parseYMD(examDateDraft), 'EEE, d MMM yyyy') : 'Pick a date'}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0 rounded-xl overflow-hidden">
                      <DayCalendar
                        mode="single"
                        selected={examDateDraft ? parseYMD(examDateDraft) : undefined}
                        defaultMonth={examDateDraft ? parseYMD(examDateDraft) : MIN_EXAM_DATE_OBJ}
                        onSelect={(d) => {
                          if (d) setExamDateDraft(ymdLocal(d));
                          setDatePickerOpen(false);
                        }}
                        disabled={{ before: MIN_EXAM_DATE_OBJ, after: MAX_EXAM_DATE_OBJ }}
                        classNames={{
                          day_selected:
                            'bg-brand-teal-600 text-white hover:bg-brand-teal-600 hover:text-white focus:bg-brand-teal-600 focus:text-white rounded-lg',
                          day_today: 'text-brand-teal-600 dark:text-brand-teal-400 font-semibold',
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    size="sm"
                    onClick={handleExamDateSave}
                    disabled={savingExamDate || bandsLoading || !examDateDraft || examDateDraft === examDate}
                    className="h-9 bg-brand-teal-600 hover:bg-brand-teal-700 text-white shrink-0"
                  >
                    {savingExamDate ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                  </Button>
                </div>
                {!bandsLoading && !examDate && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Your dashboard uses this to predict exam readiness.
                  </p>
                )}
              </div>

              {bandsError && (
                <div className="flex items-start justify-between gap-2 text-sm text-amber-600 dark:text-amber-400 pt-1">
                  <span className="flex items-start gap-1.5">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    Couldn't load your band data — editing is locked.
                  </span>
                  <button
                    onClick={fetchBandData}
                    className="inline-flex items-center gap-1 font-semibold text-brand-teal-600 dark:text-brand-teal-400 hover:text-brand-teal-700 shrink-0"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Retry
                  </button>
                </div>
              )}
              {!bandsLoading && !bandsError && currentBand != null && targetBand != null && targetBand > currentBand && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 pt-1">
                  <TrendingUp className="h-4 w-4" />
                  {(targetBand - currentBand).toFixed(1)} bands to go
                </div>
              )}
              {!bandsLoading && !bandsError && currentBand != null && targetBand != null && targetBand <= currentBand && (
                <p className="text-sm text-amber-600 dark:text-amber-400 pt-1">
                  You've reached your target — time to aim higher.
                </p>
              )}
              {!bandsLoading && !bandsError && targetBand == null && (
                <p className="text-sm text-slate-400 dark:text-slate-500 pt-1">
                  Set a target to track your progress.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-brand-teal-600 dark:bg-brand-teal-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Shield className="h-32 w-32 rotate-12" />
            </div>
            <CardHeader>
              <CardTitle className="relative z-10">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <div className="flex justify-between items-center border-b border-brand-teal-500/30 pb-3">
                <span className="text-brand-teal-100">Plan</span>
                <span className="font-bold bg-white/20 px-2 py-1 rounded text-xs select-none">FREE TIER</span>
              </div>
              <div className="flex justify-between items-center border-b border-brand-teal-500/30 pb-3">
                <span className="text-brand-teal-100">Member Since</span>
                <span className="font-medium">{profile?.createdAt ? new Date(profile.createdAt).getFullYear() : '2024'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Account Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-700 dark:text-slate-200">Profile Details</span>
                    <span className="text-brand-teal-600 dark:text-brand-teal-400">80%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-teal-600 w-[80%] rounded-full"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Target Band Edit Dialog */}
      <Dialog open={bandDialogOpen} onOpenChange={(open) => !savingBand && setBandDialogOpen(open)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">Update your target band</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              {bandsLoading || bandsError
                ? 'Your current band is unavailable, so editing is locked to prevent an invalid target.'
                : currentBand != null
                  ? `Bands below your current Band ${currentBand.toFixed(1)} are locked — no aiming backwards.`
                  : 'Pick the band score you want to work towards.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-2 py-2">
            {BAND_OPTIONS.map((band) => {
              const locked = isBandLocked(band);
              const isSelected = selectedBand === band;
              return (
                <button
                  key={band}
                  type="button"
                  disabled={locked}
                  aria-disabled={locked}
                  onClick={() => {
                    // Guard 2: no-op even if `disabled` is stripped in devtools.
                    if (!locked) setSelectedBand(band);
                  }}
                  title={
                    locked
                      ? currentBand != null
                        ? `Below your current Band ${currentBand.toFixed(1)}`
                        : 'Locked'
                      : `Band ${band.toFixed(1)}`
                  }
                  className={`py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                    isSelected
                      ? 'bg-brand-teal-600 border-brand-teal-600 text-white shadow-sm'
                      : locked
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed line-through'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-teal-400 dark:hover:border-brand-teal-500'
                  }`}
                >
                  {band.toFixed(1)}
                </button>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setBandDialogOpen(false)}
              disabled={savingBand}
              className="dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTargetBandSave}
              disabled={
                savingBand ||
                bandsLoading ||
                bandsError ||
                selectedBand == null ||
                selectedBand === targetBand ||
                targetTooLow
              }
              className="bg-brand-teal-600 hover:bg-brand-teal-700 text-white min-w-[120px]"
            >
              {savingBand ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Save Target
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
}