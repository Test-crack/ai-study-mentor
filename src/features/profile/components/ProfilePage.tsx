import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Separator } from '@/shared/components/ui/separator';
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
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  countryCode: string | null;
  phoneNo: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    countryCode: '',
    phoneNo: '',
  });
  const hasLoadedProfile = useRef(false);
  const hasShownWelcome = useRef(false);

  // Show welcome message for new signups
  useEffect(() => {
    if (searchParams.get("welcome") === "true" && !hasShownWelcome.current) {
      hasShownWelcome.current = true;
      toast({
        title: "Welcome to AI Study Mentor! 🎉",
        description: "Your email has been verified. Complete your profile to get started.",
      });
      // Clean up the URL
      navigate("/profile", { replace: true });
    }
  }, [searchParams, toast, navigate]);

  useEffect(() => {
    if (hasLoadedProfile.current || !user) {
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      try {
        const backendUrl = getBackendUrl();
        const data = await callBackend(`${backendUrl}/api/profile`, {
          method: 'GET',
        });

        if (data.user) {
          setProfile(data.user);
          setFormData({
            name: data.user.name || '',
            countryCode: data.user.countryCode || '',
            phoneNo: data.user.phoneNo || '',
          });
          hasLoadedProfile.current = true;
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Failed to load profile',
          description:
            error instanceof Error ? error.message : 'Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const backendUrl = getBackendUrl();
      const data = await callBackend(`${backendUrl}/api/profile`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name || null,
          countryCode: formData.countryCode || null,
          phoneNo: formData.phoneNo || null,
        }),
      });

      if (data.user) {
        setProfile(data.user);
        toast({
          title: 'Profile updated',
          description: data.message || 'Your profile has been saved successfully.',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getInitials = () => {
    if (formData.name) {
      return formData.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (profile?.email) {
      return profile.email[0].toUpperCase();
    }
    return 'U';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-lg font-semibold text-gray-900">Account Settings</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
              <p className="text-gray-600">Loading your profile...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Profile Summary */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <Card className="overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-purple-600 to-indigo-600" />
                <CardContent className="pt-0 -mt-12 text-center pb-6">
                  <Avatar className="h-24 w-24 mx-auto border-4 border-white shadow-lg">
                    <AvatarFallback className="bg-purple-600 text-white text-2xl font-bold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="mt-4 text-xl font-bold text-gray-900">
                    {formData.name || 'User'}
                  </h2>
                  <p className="text-sm text-gray-500">{profile?.email}</p>
                  {profile?.createdAt && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Member since {formatDate(profile.createdAt)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardContent className="p-0">
                  <nav className="divide-y">
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                      <User className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        Profile Information
                      </span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                      <Shield className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        Security
                      </span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                      <Bell className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        Notifications
                      </span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                      <Settings className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        Preferences
                      </span>
                    </button>
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Right Content - Edit Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader className="border-b bg-gray-50/50">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="h-11"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        className="h-11 pl-10 bg-gray-50 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Email address cannot be changed
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader className="border-b bg-gray-50/50">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Phone className="h-5 w-5 text-purple-600" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Country Code */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="countryCode"
                        className="text-sm font-medium text-gray-700"
                      >
                        Country Code
                      </Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="countryCode"
                          type="text"
                          placeholder="e.g., +91"
                          maxLength={5}
                          value={formData.countryCode}
                          onChange={(e) =>
                            handleInputChange('countryCode', e.target.value.toUpperCase())
                          }
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="phoneNo"
                        className="text-sm font-medium text-gray-700"
                      >
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="phoneNo"
                          type="tel"
                          placeholder="Enter phone number"
                          maxLength={20}
                          value={formData.phoneNo}
                          onChange={(e) => handleInputChange('phoneNo', e.target.value)}
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-gray-500">
                  {profile?.updatedAt && (
                    <>Last updated: {formatDate(profile.updatedAt)}</>
                  )}
                </p>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
