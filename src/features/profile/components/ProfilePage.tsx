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
import { callBackend } from '@/features/auth/services/authClient';
import {
  User,
  Mail,
  Phone,
  Globe,
  Save,
  Loader2,
  ArrowLeft,
  Shield,
  Calendar,
  LogOut,
  Settings,
  Bell,
  BookOpen,
  Linkedin,
  Twitter,
  Github,
  CheckCircle2
} from 'lucide-react';

// ... (Interfaces remain identical to your original code)

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, loading, profileLoading, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);
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

  // ... (Logic/useEffect/handleSave remain identical to your original code)
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
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-100/50 rounded-full blur-3xl" />
        <div className="absolute top-[60%] -right-[10%] w-[30%] h-[50%] bg-indigo-100/50 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-12">
        {/* Navigation Action */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-purple-600 hover:bg-white/50 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Study Area
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={signOut} className="text-gray-500 border-gray-200">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {(loading || profileLoading) ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Header Card */}
            <Card className="border-none shadow-xl shadow-purple-900/5 overflow-hidden backdrop-blur-md bg-white/80">
              <CardContent className="p-0">
                <div className="h-32 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700" />
                <div className="px-8 pb-8">
                  <div className="flex flex-col sm:flex-row items-end -mt-12 gap-6">
                    <Avatar className="h-28 w-28 border-4 border-white shadow-2xl">
                      <AvatarFallback className="bg-purple-600 text-white text-3xl font-bold">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 mb-2 text-center sm:text-left">
                      <h1 className="text-2xl font-bold text-gray-900">{formData.name || 'Set your name'}</h1>
                      <p className="text-gray-500 flex items-center justify-center sm:justify-start gap-2">
                        <Mail className="h-3.5 w-3.5" /> {profile?.email}
                      </p>
                    </div>
                    <div className="mb-2">
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 px-4 py-1 rounded-full border-none">
                        {profile?.role || 'STUDENT'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Horizontal Tabbed Nav */}
                <div className="px-8 border-t bg-gray-50/50">
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
                        className={`py-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                          activeTab === tab.id 
                            ? 'border-purple-600 text-purple-600' 
                            : 'border-transparent text-gray-400 hover:text-gray-600'
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
                <Card className="border-none shadow-lg bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg">Account Information</CardTitle>
                    <CardDescription>Basic details about your account identity.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-gray-500">Full Name</Label>
                        <Input 
                          value={formData.name} 
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="bg-gray-50/50 border-gray-200 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-500">Country Code</Label>
                        <Input 
                          value={formData.countryCode} 
                          onChange={(e) => handleInputChange('countryCode', e.target.value.toUpperCase())}
                          placeholder="+1"
                          className="bg-gray-50/50 border-gray-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-500">Phone Number</Label>
                        <Input 
                          value={formData.phoneNo} 
                          onChange={(e) => handleInputChange('phoneNo', e.target.value)}
                          className="bg-gray-50/50 border-gray-200"
                        />
                      </div>
                      <div className="space-y-2 opacity-60">
                        <Label>Registration Date</Label>
                        <div className="h-10 flex items-center px-3 bg-gray-100 rounded-md text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2" />
                          {profile?.createdAt ? new Date(profile.createdAt).toDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'instructor' && profile?.role === 'INSTRUCTOR' && (
                 <Card className="border-none shadow-lg bg-white">
                    <CardHeader>
                      <CardTitle className="text-lg">Instructor Workspace</CardTitle>
                      <CardDescription>Professional data used for course listings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-gray-500">Teaching Specialization</Label>
                        <Input 
                          value={formData.specialization} 
                          onChange={(e) => handleInputChange('specialization', e.target.value)}
                          placeholder="e.g. Advanced Mathematics"
                          className="bg-gray-50/50 border-gray-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-500">Biography</Label>
                        <Textarea 
                          value={formData.bio} 
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          className="min-h-[120px] bg-gray-50/50 border-gray-200"
                        />
                      </div>
                      <Separator />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                           <Label className="flex items-center gap-2"><Linkedin className="h-3 w-3" /> LinkedIn</Label>
                           <Input value={formData.linkedin} onChange={(e) => handleInputChange('linkedin', e.target.value)} className="text-xs h-9" />
                        </div>
                        <div className="space-y-2">
                           <Label className="flex items-center gap-2"><Twitter className="h-3 w-3" /> Twitter</Label>
                           <Input value={formData.twitter} onChange={(e) => handleInputChange('twitter', e.target.value)} className="text-xs h-9" />
                        </div>
                        <div className="space-y-2">
                           <Label className="flex items-center gap-2"><Github className="h-3 w-3" /> GitHub</Label>
                           <Input value={formData.github} onChange={(e) => handleInputChange('github', e.target.value)} className="text-xs h-9" />
                        </div>
                      </div>
                    </CardContent>
                 </Card>
              )}

              {/* Placeholder for future sections */}
              {(activeTab === 'security' || activeTab === 'notifications' || activeTab === 'preferences') && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                  <Settings className="h-12 w-12 text-gray-200 mb-4 animate-spin-slow" />
<h3 className="text-lg font-bold text-gray-800">Feature Coming Soon</h3>
                    <p className="text-sm text-gray-500 max-w-xs text-center">We're working hard to bring you more control over your experience.</p>                </div>
              )}
            </div>

            {/* Bottom Floating Save Action */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <p className="text-xs text-gray-400 italic">
                {profile?.updatedAt && `Automatically synced on ${new Date(profile.updatedAt).toLocaleDateString()}`}
              </p>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 h-12 shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Updating...' : 'Save All Changes'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}