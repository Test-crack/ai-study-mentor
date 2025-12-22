import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Navbar } from "@/shared/components/layout/Navbar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useToast } from "@/shared/hooks/use-toast";
import { getBackendUrl } from "@/shared/utils";
import { callBackend } from "@/features/auth/services/authClient";
import { User, Mail, Phone, Globe, Camera, Save, Loader2 } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  countryCode: string | null;
  phoneNo: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    countryCode: "",
    phoneNo: "",
  });
  const hasLoadedProfile = useRef(false);

  // Load profile data from backend
  useEffect(() => {
    // Only load once
    if (hasLoadedProfile.current || !user) {
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      try {
        const backendUrl = getBackendUrl();
        const data = await callBackend(`${backendUrl}/api/profile`, {
          method: "GET",
        });

        if (data.user) {
          setProfile(data.user);
          setFormData({
            name: data.user.name || "",
            countryCode: data.user.countryCode || "",
            phoneNo: data.user.phoneNo || "",
          });
          hasLoadedProfile.current = true;
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast({
          title: "Failed to load profile",
          description: error instanceof Error ? error.message : "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  const handleSave = async () => {
    setSaving(true);
    try {
      const backendUrl = getBackendUrl();
      const data = await callBackend(`${backendUrl}/api/profile`, {
        method: "PUT",
        body: JSON.stringify({
          name: formData.name || null,
          countryCode: formData.countryCode || null,
          phoneNo: formData.phoneNo || null,
        }),
      });

      if (data.user) {
        setProfile(data.user);
        toast({
          title: "Profile updated",
          description: data.message || "Your profile has been saved successfully.",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
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
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (profile?.email) {
      return profile.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <Navbar showNavItems={true} />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
            Your Profile
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your account information and preferences
          </p>
        </div>

        {loading ? (
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Profile Picture Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                  {/* Profile Picture */}
                  <div className="relative">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-lg">
                      {getInitials()}
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border-2 border-purple-200 hover:bg-purple-50 transition-colors">
                      <Camera className="h-4 w-4 text-purple-600" />
                    </button>
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                      {formData.name || "User"}
                    </h2>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                  <User className="h-5 w-5 text-purple-600" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>Full Name</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="bg-white"
                  />
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>Email Address</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className="bg-gray-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                {/* Country Code */}
                <div className="space-y-2">
                  <Label htmlFor="countryCode" className="text-sm font-medium flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span>Country Code</span>
                  </Label>
                  <Input
                    id="countryCode"
                    type="text"
                    placeholder="e.g., US, IN, UK"
                    maxLength={5}
                    value={formData.countryCode}
                    onChange={(e) => handleInputChange("countryCode", e.target.value.toUpperCase())}
                    className="bg-white"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNo" className="text-sm font-medium flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>Phone Number</span>
                  </Label>
                  <Input
                    id="phoneNo"
                    type="tel"
                    placeholder="Enter your phone number"
                    maxLength={20}
                    value={formData.phoneNo}
                    onChange={(e) => handleInputChange("phoneNo", e.target.value)}
                    className="bg-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-6 text-base shadow-lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
