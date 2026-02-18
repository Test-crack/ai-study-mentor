import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  FileText
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { InstructorSidebar } from "../dashboard/InstructorSidebar";
import { InstructorTopbar } from "../dashboard/InstructorTopbar";

// Mock Data for MVP
const MOCK_ASSESSMENTS = [
  { id: 1, student: "Alice Johnson", course: "Speed Reading Mastery", module: "Basics of Scanning", wpm: 450, accuracy: 85, date: "2024-03-10", status: "Completed" },
  { id: 2, student: "Bob Smith", course: "Vocabulary Challenge", module: "Root Words", wpm: 210, accuracy: 92, date: "2024-03-09", status: "Completed" },
  { id: 3, student: "Charlie Davis", course: "Speed Reading Mastery", module: "Subvocalization", wpm: 320, accuracy: 78, date: "2024-03-09", status: "Review Needed" },
  { id: 4, student: "Diana Evans", course: "Speed Reading Mastery", module: "Basics of Scanning", wpm: 510, accuracy: 65, date: "2024-03-08", status: "Completed" },
  { id: 5, student: "Evan Wright", course: "Advanced Comprehension", module: "Critical Analysis", wpm: 180, accuracy: 95, date: "2024-03-08", status: "Completed" },
];

export default function InstructorAssessmentPage() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");

  const filteredAssessments = MOCK_ASSESSMENTS.filter(assessment => {
    const matchesSearch = assessment.student.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          assessment.module.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = filterCourse === "all" || assessment.course === filterCourse;
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <InstructorSidebar
        activeTab="assessments"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <InstructorTopbar />

        <main className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <FileText className="h-8 w-8 text-indigo-600" />
                Student Assessments
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Review student performance across all courses.</p>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" /> Export Data
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Search student or module..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <Select value={filterCourse} onValueChange={setFilterCourse}>
                        <SelectTrigger className="w-[200px]">
                            <Filter className="w-4 h-4 mr-2 text-slate-400" />
                            <SelectValue placeholder="Filter by Course" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Courses</SelectItem>
                            <SelectItem value="Speed Reading Mastery">Speed Reading Mastery</SelectItem>
                            <SelectItem value="Vocabulary Challenge">Vocabulary Challenge</SelectItem>
                            <SelectItem value="Advanced Comprehension">Advanced Comprehension</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                        <TableRow>
                            <TableHead className="font-semibold">Student</TableHead>
                            <TableHead className="font-semibold">Course & Module</TableHead>
                            <TableHead className="font-semibold text-center">WPM</TableHead>
                            <TableHead className="font-semibold text-center">Accuracy</TableHead>
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAssessments.length > 0 ? (
                            filteredAssessments.map((assessment) => (
                                <TableRow key={assessment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <TableCell className="font-medium">{assessment.student}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{assessment.module}</span>
                                            <span className="text-xs text-slate-500">{assessment.course}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{assessment.wpm}</TableCell>
                                    <TableCell className="text-center font-mono">
                                        <Badge variant={assessment.accuracy >= 80 ? "default" : assessment.accuracy >= 60 ? "secondary" : "destructive"} className="font-normal">
                                            {assessment.accuracy}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-500">{assessment.date}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={assessment.status === 'Completed' ? 'text-green-600 border-green-200 bg-green-50' : 'text-amber-600 border-amber-200 bg-amber-50'}>
                                            {assessment.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Eye className="w-4 h-4 text-slate-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                    No assessments found matching your filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-slate-500">Showing {filteredAssessments.length} results</p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
