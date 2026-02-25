import React, { useState } from 'react';
import { Search, Download, Plus, X, Check } from 'lucide-react';
import { InstituteSidebar } from '../components/InstituteSidebar';
import { InstituteTopbar } from '../components/InstituteTopbar';

// Define student structure
type Student = {
  id: string;
  name: string;
  joined: string;
  email: string;
  phone: string;
  batch: string;
  status: 'ACTIVE' | 'PENDING';
  initials: string;
};

// Initial mock data based on the video
const initialStudents: Student[] = [
  { id: '1', name: 'Rohit Verma', joined: '2026-01-15', email: 'rohit@gmail.com', phone: '+91 9876543210', batch: 'IELTS Batch 12', status: 'ACTIVE', initials: 'RV' },
  { id: '2', name: 'Sneha Patel', joined: '2026-01-20', email: 'sneha@gmail.com', phone: '+91 9876543211', batch: 'Spoken English A', status: 'ACTIVE', initials: 'SP' },
  { id: '3', name: 'Amit Shah', joined: '2026-02-10', email: 'amit@gmail.com', phone: '+91 9876543212', batch: 'Unassigned', status: 'PENDING', initials: 'AS' },
  { id: '4', name: 'Priya Nair', joined: '2026-02-01', email: 'priya@gmail.com', phone: '+91 9876543213', batch: 'IELTS Batch 12', status: 'ACTIVE', initials: 'PN' },
  { id: '5', name: 'Karthik Iyer', joined: '2026-02-20', email: 'karthik@gmail.com', phone: '+91 9876543214', batch: 'Unassigned', status: 'PENDING', initials: 'KI' },
];

export default function StudentOnboarding() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', batch: '' });
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // Handle Search Filtering
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show Toast Notification
  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast({ message: '', visible: false });
    }, 3000);
  };

  // Handle Add Student
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const newStudent: Student = {
      id: Date.now().toString(),
      name: formData.name,
      joined: new Date().toISOString().split('T')[0],
      email: formData.email,
      phone: formData.phone || 'N/A',
      batch: formData.batch || 'Unassigned',
      status: 'ACTIVE',
      initials: formData.name.substring(0, 2).toUpperCase()
    };

    setStudents([newStudent, ...students]);
    setIsModalOpen(false);
    setFormData({ name: '', email: '', phone: '', batch: '' });
    showToast(`Student "${formData.name}" enrolled successfully`);
  };

  // Handle Approve Student
  const handleApprove = (id: string, name: string) => {
    setStudents(students.map(s => s.id === id ? { ...s, status: 'ACTIVE' } : s));
    showToast(`${name} approved`);
  };

  // Helper for batch badge styling
  const getBatchBadgeStyle = (batch: string) => {
    if (batch === 'Unassigned') {
      return 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-500 dark:bg-[#2A1A15] dark:border-orange-500/30';
    }
    return 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-[#A78BFA] dark:bg-[#2E1A47] dark:border-[#A78BFA]/30';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0A10] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <InstituteSidebar 
          activeTab="students-onboard" // Highlight appropriate tab
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      </div>

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* Topbar */}
        <InstituteTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1200px] mx-auto space-y-6">
            
            {/* Top Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative w-full max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-transparent border border-slate-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] focus:ring-1 focus:ring-indigo-500 dark:focus:ring-[#8B5CF6] transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 shadow-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors bg-white dark:bg-transparent border border-slate-200 dark:border-transparent rounded-lg shadow-sm dark:shadow-none">
                  <Download className="w-4 h-4" />
                  CSV Import
                </button>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Student
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white dark:bg-transparent border border-slate-200 dark:border-transparent rounded-xl shadow-sm dark:shadow-none overflow-hidden">
              <div className="w-full overflow-x-auto px-4 py-2">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-gray-800 text-slate-500 dark:text-gray-500 text-sm">
                      <th className="pb-4 font-semibold dark:font-normal pl-2">Student</th>
                      <th className="pb-4 font-semibold dark:font-normal">Contact</th>
                      <th className="pb-4 font-semibold dark:font-normal">Batch</th>
                      <th className="pb-4 font-semibold dark:font-normal">Status</th>
                      <th className="pb-4 font-semibold dark:font-normal text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-800/50">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                        {/* Student Info */}
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-md bg-indigo-100 dark:bg-[#1C1A2F] text-indigo-700 dark:text-[#8B5CF6] flex items-center justify-center text-xs font-bold shrink-0">
                              {student.initials}
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-slate-900 dark:text-gray-200">{student.name}</div>
                              <div className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">Joined {student.joined}</div>
                            </div>
                          </div>
                        </td>

                        {/* Contact Info */}
                        <td className="py-4">
                          <div className="text-sm font-medium text-slate-700 dark:text-gray-200">{student.email}</div>
                          <div className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">{student.phone}</div>
                        </td>

                        {/* Batch Info */}
                        <td className="py-4">
                          <span className={`px-2.5 py-1 text-[11px] font-semibold rounded border ${getBatchBadgeStyle(student.batch)}`}>
                            {student.batch}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4">
                          <span className={`text-[11px] font-bold tracking-wider ${student.status === 'ACTIVE' ? 'text-emerald-600 dark:text-[#10B981]' : 'text-amber-600 dark:text-[#F59E0B]'}`}>
                            {student.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 text-right pr-4">
                          <div className="flex items-center justify-end gap-4">
                            {student.status === 'PENDING' && (
                              <button 
                                onClick={() => handleApprove(student.id, student.name)}
                                className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-[#7C3AED]/20 dark:hover:bg-[#7C3AED]/30 text-indigo-700 dark:text-[#A78BFA] text-xs font-semibold rounded transition-colors flex items-center gap-1.5 border border-indigo-200 dark:border-[#7C3AED]/30"
                              >
                                <Check className="w-3 h-3" /> Approve
                              </button>
                            )}
                            <button className="text-sm text-slate-400 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors font-medium">
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-gray-500">
                          No students found matching "{searchQuery}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        </main>

        {/* Modal Overlay & Content */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl w-full max-w-[600px] overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-[#26252D]">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Student Enrollment</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddStudent} className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-400">Full Name *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] focus:ring-1 focus:ring-indigo-500 dark:focus:ring-[#8B5CF6] transition-colors text-slate-900 dark:text-white placeholder-slate-400"
                      placeholder="Student name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-400">Email *</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] focus:ring-1 focus:ring-indigo-500 dark:focus:ring-[#8B5CF6] transition-colors text-slate-900 dark:text-white placeholder-slate-400"
                      placeholder="student@email.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-400">Phone</label>
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] focus:ring-1 focus:ring-indigo-500 dark:focus:ring-[#8B5CF6] transition-colors text-slate-900 dark:text-white placeholder-slate-400"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-400">Assign Batch</label>
                    <select 
                      value={formData.batch}
                      onChange={(e) => setFormData({...formData, batch: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] focus:ring-1 focus:ring-indigo-500 dark:focus:ring-[#8B5CF6] transition-colors text-slate-900 dark:text-gray-300"
                    >
                      <option value="" disabled>Select batch...</option>
                      <option value="IELTS Batch 12">IELTS Batch 12</option>
                      <option value="Spoken English A">Spoken English A</option>
                      <option value="Tech Prep Batch 5">Tech Prep Batch 5</option>
                      <option value="IELTS Evening">IELTS Evening</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end items-center gap-4 mt-8 pt-4 border-t border-slate-100 dark:border-transparent">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="text-sm font-medium text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    Enroll Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast.visible && (
          <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-fade-in-up z-50">
            <div className="bg-emerald-500/20 dark:bg-emerald-100 rounded-full p-1">
              <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            </div>
            <p className="text-sm font-medium pr-2">{toast.message}</p>
          </div>
        )}

      </div>
    </div>
  );
}