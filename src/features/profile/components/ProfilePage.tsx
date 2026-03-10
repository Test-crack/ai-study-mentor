import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Separator } from '@/shared/components/ui/separator';
import { Badge } from '@/shared/components/ui/badge';
import { Textarea } from '@/shared/components/ui/textarea';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from '@/shared/hooks/use-toast';
import { getBackendUrl } from '@/shared/utils';
import { callBackend, uploadFileToBackend } from '@/features/auth/services/authClient';

// Navigation Imports
import { InstructorSidebar } from '@/features/instructor/components/dashboard/InstructorSidebar';
import { InstructorTopbar } from '@/features/instructor/components/dashboard/InstructorTopbar';

import { InstituteOwnerSidebar } from '@/features/InstituteOwner/components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '@/features/InstituteOwner/components/InstituteOwnerTopbar';

import {
  User, Mail, Loader2, Upload, Trash2, Shield, Calendar, 
  Settings, Bell, BookOpen, Linkedin, Twitter, Github, CheckCircle2
} from 'lucide-react';
import { SuperAdminTopbar } from '@/features/TestCrackSuperAdmin/Components/Superadmintopbar';
import { SuperAdminSidebar } from '@/features/TestCrackSuperAdmin/Components/SuperadminSidebar';
import { InstituteTopbar } from '@/features/Institute/components/InstituteTopbar';
import { InstituteSidebar } from '@/features/Institute/components/InstituteSidebar';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, loading, profileLoading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    countryCode: '',
    phoneNo: '',
    bio: '',
    specialization: '',
    linkedin: '',
    twitter: '',
    github: '',
  });
  
  const [activeTab, setActiveTab] = useState<'profile' | 'instructor' | 'security' | 'notifications' | 'preferences'>('profile');
  const hasPopulatedForm = useRef(false);
  const hasShownWelcome = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Determine user role (Verify these match your backend exact strings)
  const isSuperAdmin = profile?.role === 'SUPERADMIN'; 
  const isOwner = profile?.role === 'INSTITUTE_OWNER';
  const isInstituteAdmin = profile?.role === 'INSTITUTE_ADMIN';

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
      toast({ title: 'Upload failed', description: 'Could not upload image. Please try again.', variant: 'destructive' });
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
      toast({ title: 'Action failed', description: 'Could not remove image.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("welcome") === "true" && !hasShownWelcome.current) {
      hasShownWelcome.current = true;
      toast({ title: "Welcome to AI Study Mentor! 🎉", description: "Your email has been verified." });
      navigate("/profile", { replace: true });
    }
  }, [searchParams, toast, navigate]);

  useEffect(() => {
    if (profile && !hasPopulatedForm.current) {
      setFormData({
        name: profile.name || '',
        countryCode: profile.countryCode || '',
        phoneNo: profile.phoneNo || '',
        bio: profile.Instructor?.bio || '',
        specialization: profile.Instructor?.specialization || '',
        linkedin: profile.Instructor?.socialLinks?.linkedin || '',
        twitter: profile.Instructor?.socialLinks?.twitter || '',
        github: profile.Instructor?.socialLinks?.github || '',
      });
      hasPopulatedForm.current = true;
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const backendUrl = getBackendUrl();
      const isInstructor = profile?.role === 'INSTRUCTOR';
      const endpoint = isInstructor ? `${backendUrl}/api/instructor/profile` : `${backendUrl}/api/profile`;
      const payload = isInstructor ? {
        name: formData.name || null, countryCode: formData.countryCode || null, phoneNo: formData.phoneNo || null,
        bio: formData.bio || null, specialization: formData.specialization || null,
        socialLinks: { linkedin: formData.linkedin || null, twitter: formData.twitter || null, github: formData.github || null }
      } : { name: formData.name || null, countryCode: formData.countryCode || null, phoneNo: formData.phoneNo || null };

      const data = await callBackend(endpoint, { method: 'PUT', body: JSON.stringify(payload) });
      if (data.user || (data.data?.user)) {
        await refreshProfile();
        toast({ title: 'Profile updated', description: 'Changes saved successfully.' });
      }
    } catch (error) {
      toast({ title: 'Update failed', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getInitials = () => {
    if (formData.name) return formData.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    return profile?.email?.[0].toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090E] transition-colors duration-300 selection:bg-indigo-500/30 font-sans">
      
      {/* Conditionally Render Sidebar Navigation */}
      {isSuperAdmin ? (
        <SuperAdminSidebar
          activeTab="settings"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      ) : isOwner ? (
        <InstituteOwnerSidebar
          activeTab="settings"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      ) : isInstituteAdmin ? (
        <InstituteSidebar
          activeTab="settings"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      ) : (
        <InstructorSidebar
          activeTab="settings"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      )}

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'} flex flex-col min-h-screen relative z-10`}>
        
        {/* Conditionally Render Topbar */}
        {isSuperAdmin ? (
          <SuperAdminTopbar />
        ) : isOwner ? (
          <InstituteOwnerTopbar />
        ) : isInstituteAdmin ? (
          <InstituteTopbar />
        ) : (
          <InstructorTopbar />
        )}

        <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {(loading || profileLoading) ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Main Header Card */}
              <Card className="border-slate-200 dark:border-[#1E1E2A] shadow-sm dark:shadow-none overflow-hidden bg-white dark:bg-[#12121A]">
                <CardContent className="p-0">
                  <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-900/80 dark:to-purple-900/80" />
                  <div className="px-6 sm:px-8 pb-8">
                    <div className="flex flex-col sm:flex-row items-end -mt-12 gap-6">
                      <div className="relative group">
                        <Avatar className="h-28 w-28 border-4 border-white dark:border-[#12121A] shadow-lg cursor-pointer transition-transform group-hover:scale-105" onClick={() => fileInputRef.current?.click()}>
                          {uploading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-10">
                              <Loader2 className="h-8 w-8 text-white animate-spin" />
                            </div>
                          ) : null}
                          {profile?.profileImage ? (
                             <img src={profile.profileImage} alt="Profile" className="h-full w-full object-cover" />
                          ) : (
                            <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-3xl font-bold border border-indigo-200 dark:border-indigo-800">
                              {getInitials()}
                            </AvatarFallback>
                          )}
                          
                          {/* Overlay for Edit */}
                          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload className="h-8 w-8 text-white" />
                          </div>
                        </Avatar>
                        
                        {/* Hidden Input */}
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          onChange={handleImageUpload}
                        />
                        
                        {/* Remove Button */}
                        {profile?.profileImage && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md z-20"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImageRemove();
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex-1 mb-2 text-center sm:text-left">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{formData.name || 'Set your name'}</h1>
                        <p className="text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-2 font-medium mt-1">
                          <Mail className="h-3.5 w-3.5" /> {profile?.email}
                        </p>
                      </div>
                      <div className="mb-2">
                        <Badge className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-4 py-1.5 rounded-md border border-indigo-200 dark:border-indigo-500/20 shadow-none font-bold tracking-wide">
                          {profile?.role || 'STUDENT'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Tabbed Nav */}
                  <div className="px-6 sm:px-8 border-t border-slate-200 dark:border-[#1E1E2A] bg-slate-50 dark:bg-[#1A1A24]">
                    <div className="flex overflow-x-auto no-scrollbar gap-8">
                      {[
                        { id: 'profile', label: 'General', icon: User },
                        ...(profile?.role === 'INSTRUCTOR' ? [{ id: 'instructor', label: 'Instructor Profile', icon: BookOpen }] : []),
                        { id: 'security', label: 'Security', icon: Shield },
                        { id: 'notifications', label: 'Alerts', icon: Bell },
                        { id: 'preferences', label: 'Settings', icon: Settings },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`py-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                            activeTab === tab.id 
                              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' 
                              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          <tab.icon className="h-4 w-4" />
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Section */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'profile' && (
                  <Card className="border-slate-200 dark:border-[#1E1E2A] shadow-sm dark:shadow-none bg-white dark:bg-[#12121A]">
                    <CardHeader>
                      <CardTitle className="text-lg text-slate-900 dark:text-white">Account Information</CardTitle>
                      <CardDescription className="text-slate-500 dark:text-slate-400">Basic details about your account identity.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-slate-700 dark:text-slate-300 font-semibold">Full Name</Label>
                          <Input 
                            value={formData.name} 
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="bg-slate-50 dark:bg-[#1A1A24] border-slate-200 dark:border-[#2A2A3A] focus:bg-white dark:focus:bg-[#1A1A24] text-slate-900 dark:text-white transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 dark:text-slate-300 font-semibold">Country Code</Label>
                          <Input 
                            value={formData.countryCode} 
                            onChange={(e) => handleInputChange('countryCode', e.target.value.toUpperCase())}
                            placeholder="+1"
                            className="bg-slate-50 dark:bg-[#1A1A24] border-slate-200 dark:border-[#2A2A3A] focus:bg-white dark:focus:bg-[#1A1A24] text-slate-900 dark:text-white transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 dark:text-slate-300 font-semibold">Phone Number</Label>
                          <Input 
                            value={formData.phoneNo} 
                            onChange={(e) => handleInputChange('phoneNo', e.target.value)}
                            className="bg-slate-50 dark:bg-[#1A1A24] border-slate-200 dark:border-[#2A2A3A] focus:bg-white dark:focus:bg-[#1A1A24] text-slate-900 dark:text-white transition-colors"
                          />
                        </div>
                        <div className="space-y-2 opacity-70">
                          <Label className="text-slate-700 dark:text-slate-300 font-semibold">Registration Date</Label>
                          <div className="h-10 flex items-center px-3 bg-slate-100 dark:bg-[#1A1A24] border border-slate-200 dark:border-[#2A2A3A] rounded-md text-sm text-slate-500 dark:text-slate-400 font-medium">
                            <Calendar className="h-4 w-4 mr-2" />
                            {profile?.createdAt ? new Date(profile.createdAt).toDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeTab === 'instructor' && profile?.role === 'INSTRUCTOR' && (
                   <Card className="border-slate-200 dark:border-[#1E1E2A] shadow-sm dark:shadow-none bg-white dark:bg-[#12121A]">
                      <CardHeader>
                        <CardTitle className="text-lg text-slate-900 dark:text-white">Instructor Workspace</CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400">Professional data used for your public course listings.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-slate-700 dark:text-slate-300 font-semibold">Teaching Specialization</Label>
                          <Input 
                            value={formData.specialization} 
                            onChange={(e) => handleInputChange('specialization', e.target.value)}
                            placeholder="e.g. Advanced Mathematics"
                            className="bg-slate-50 dark:bg-[#1A1A24] border-slate-200 dark:border-[#2A2A3A] focus:bg-white dark:focus:bg-[#1A1A24] text-slate-900 dark:text-white transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 dark:text-slate-300 font-semibold">Biography</Label>
                          <Textarea 
                            value={formData.bio} 
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            className="min-h-[120px] bg-slate-50 dark:bg-[#1A1A24] border-slate-200 dark:border-[#2A2A3A] focus:bg-white dark:focus:bg-[#1A1A24] text-slate-900 dark:text-white transition-colors resize-y"
                          />
                        </div>
                        <Separator className="bg-slate-200 dark:bg-[#2A2A3A]" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                             <Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold"><Linkedin className="h-4 w-4 text-blue-500" /> LinkedIn</Label>
                             <Input value={formData.linkedin} onChange={(e) => handleInputChange('linkedin', e.target.value)} className="bg-slate-50 dark:bg-[#1A1A24] border-slate-200 dark:border-[#2A2A3A] focus:bg-white dark:focus:bg-[#1A1A24] text-slate-900 dark:text-white text-sm" placeholder="URL..." />
                          </div>
                          <div className="space-y-2">
                             <Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold"><Twitter className="h-4 w-4 text-sky-500" /> Twitter</Label>
                             <Input value={formData.twitter} onChange={(e) => handleInputChange('twitter', e.target.value)} className="bg-slate-50 dark:bg-[#1A1A24] border-slate-200 dark:border-[#2A2A3A] focus:bg-white dark:focus:bg-[#1A1A24] text-slate-900 dark:text-white text-sm" placeholder="@handle..." />
                          </div>
                          <div className="space-y-2">
                             <Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold"><Github className="h-4 w-4 text-slate-900 dark:text-slate-200" /> GitHub</Label>
                             <Input value={formData.github} onChange={(e) => handleInputChange('github', e.target.value)} className="bg-slate-50 dark:bg-[#1A1A24] border-slate-200 dark:border-[#2A2A3A] focus:bg-white dark:focus:bg-[#1A1A24] text-slate-900 dark:text-white text-sm" placeholder="Username..." />
                          </div>
                        </div>
                      </CardContent>
                   </Card>
                )}

                {/* Placeholder for future sections */}
                {(activeTab === 'security' || activeTab === 'notifications' || activeTab === 'preferences') && (
                  <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#12121A] rounded-xl shadow-sm dark:shadow-none border border-slate-200 dark:border-[#1E1E2A]">
                    <Settings className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4 animate-spin-slow" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Feature Coming Soon</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs text-center font-medium">We're working hard to bring you more control over your experience.</p>
                  </div>
                )}
              </div>

              {/* Bottom Floating Save Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between sm:justify-end gap-4 pt-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {profile?.updatedAt && `Last synced on ${new Date(profile.updatedAt).toLocaleDateString()}`}
                </p>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 py-6 font-bold shadow-md shadow-indigo-600/20 transition-all hover:-translate-y-0.5"
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                  )}
                  {saving ? 'Saving...' : 'Save All Changes'}
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

    </div>
  );
}