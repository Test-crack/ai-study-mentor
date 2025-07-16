
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Index from "./pages/Index";
import SpeedAssessment from "./pages/SpeedAssessment";
import AssessmentResults from "./components/AssessmentResults";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const handleAssessmentComplete = (results: any) => {
    setAssessmentResults(results);
    setShowResults(true);
  };

  const handleRetakeAssessment = () => {
    setShowResults(false);
    setAssessmentCompleted(false);
    setAssessmentResults(null);
  };

  const handleContinueToDashboard = () => {
    setAssessmentCompleted(true);
    setShowResults(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                !assessmentCompleted ? (
                  showResults ? (
                    <AssessmentResults 
                      results={assessmentResults} 
                      onRetakeAssessment={handleRetakeAssessment}
                      onContinueToDashboard={handleContinueToDashboard}
                    />
                  ) : (
                    <SpeedAssessment onComplete={handleAssessmentComplete} />
                  )
                ) : (
                  <Index />
                )
              } 
            />
            <Route 
              path="/assessment" 
              element={
                showResults ? (
                  <AssessmentResults 
                    results={assessmentResults} 
                    onRetakeAssessment={handleRetakeAssessment}
                    onContinueToDashboard={handleContinueToDashboard}
                  />
                ) : (
                  <SpeedAssessment onComplete={handleAssessmentComplete} />
                )
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
