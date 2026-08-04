import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Card } from "@/shared/components/ui/card";
import { BookOpen, History, User, TrendingUp } from "lucide-react";
import SpeedAssessment from "@/features/speed-assessment/components/SpeedAssessmentPage";
import { ReadingProfile } from "./ReadingProfile";
import { AssessmentHistory } from "./AssessmentHistory";
import { Navbar } from "@/shared/components/layout/Navbar";

const ReadingAssessment = () => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue-50 via-blue-50 to-brand-teal-100">
      {/* Navbar */}
      <Navbar showNavItems={true} />

      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-r from-brand-blue-500 to-blue-500 p-3 rounded-xl">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-blue-600 to-blue-600 bg-clip-text text-transparent">
                Reading Assessment
              </h1>
              <p className="text-gray-600 mt-1">
                Track your reading speed, comprehension, and progress
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/80 backdrop-blur-sm p-1 h-auto">
            <TabsTrigger 
              value="profile" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-brand-blue-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="assessment" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-brand-blue-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Take Assessment</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-brand-blue-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-0">
            <ReadingProfile onStartAssessment={() => setActiveTab("assessment")} />
          </TabsContent>

          <TabsContent value="assessment" className="mt-0">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <SpeedAssessment onComplete={() => setActiveTab("profile")} />
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <AssessmentHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReadingAssessment;
