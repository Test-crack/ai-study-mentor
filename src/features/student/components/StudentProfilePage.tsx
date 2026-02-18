import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { useToast } from '@/shared/hooks/use-toast';
import { getBackendUrl } from '@/shared/utils';
import { callBackend, uploadFileToBackend } from '@/features/auth/services/authClient';
import { 
  Loader2, Upload, Trash2, User, Mail, Phone, Calendar, 
  Shield, Bell, Settings, CheckCircle2, Camera 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';

export default function StudentProfilePage() {
  const navigate = useNavigate();
  const { profile, loading, profileLoading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'preferences'>('general');
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phoneNo: '',
    bio: '', // For future proofing or if student has bio
  });

  // Populate form on load
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phoneNo: profile.phoneNo || '',
        bio: profile.Instructor?.bio || '', // Just in case, though usually null for students
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
      // Assuming student profile update endpoint
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

  const getInitials = () => {
    if (formData.name) return formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return profile?.email?.[0].toUpperCase() || 'S';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar 
        activeTab="settings" 
        onTabChange={(tab) => {
            if (tab === 'dashboard') navigate('/student/dashboard');
            // Handle other navs
        }} 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Header Section */}
          <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800">
             {/* Cover / Banner Gradient */}
             <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 dark:from-indigo-900 dark:to-slate-900"></div>
             
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
                        <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{getInitials()}</span>
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
                     <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800">
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
                   { id: 'preferences', label: 'Preferences', icon: Settings },
                 ].map((tab) => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`py-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                       activeTab === tab.id 
                         ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
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
                          className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-slate-600 dark:text-slate-300">Phone Number</Label>
                        <Input 
                          id="phone"
                          value={formData.phoneNo}
                          onChange={(e) => handleInputChange('phoneNo', e.target.value)}
                          placeholder="+1 234 567 890"
                          className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-indigo-500"
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
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
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
              <Card className="border-none shadow-sm bg-indigo-600 dark:bg-indigo-900 text-white overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Shield className="h-32 w-32 rotate-12" />
                 </div>
                 <CardHeader>
                   <CardTitle className="relative z-10">Account Status</CardTitle>
                 </CardHeader>
                 <CardContent className="relative z-10 space-y-4">
                   <div className="flex justify-between items-center border-b border-indigo-500/30 pb-3">
                     <span className="text-indigo-100">Plan</span>
                     <span className="font-bold bg-white/20 px-2 py-1 rounded text-xs select-none">FREE TIER</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-indigo-500/30 pb-3">
                     <span className="text-indigo-100">Member Since</span>
                     <span className="font-medium">{profile?.createdAt ? new Date(profile.createdAt).getFullYear() : '2024'}</span>
                   </div>
                   <Button variant="secondary" className="w-full bg-white text-indigo-700 hover:bg-indigo-50">
                     Upgrade Plan
                   </Button>
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
                         <span className="text-indigo-600 dark:text-indigo-400">80%</span>
                       </div>
                       <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-600 w-[80%] rounded-full"></div>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
