import { useState } from 'react';
import { Mic, Activity, Volume2, Clock } from 'lucide-react'; 
import { StudentSidebar } from './dashboard/StudentSidebar';
// 1. Import Topbar and PremiumModal
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { PremiumModal } from "@/features/payment/components/PremiumModal";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

// Simulated data remains the same...
const pitchData = [
  { time: '0s', value: 40 }, { time: '1s', value: 48 }, { time: '2s', value: 38 },
  { time: '3s', value: 52 }, { time: '4s', value: 41 }, { time: '5s', value: 45 }
];

const confidenceData = [
  { time: '0s', value: 65 }, { time: '1s', value: 68 }, { time: '2s', value: 72 },
  { time: '3s', value: 60 }, { time: '4s', value: 70 }, { time: '5s', value: 68 }
];

const latencyData = [
  { segment: 'Seg 1', delay: 0.4 }, { segment: 'Seg 2', delay: 0.2 }, 
  { segment: 'Seg 3', delay: 1.8 }, { segment: 'Seg 4', delay: 0.3 }, 
  { segment: 'Seg 5', delay: 0.5 }
];

const analysisData = {
  user: 'Arjun Mehta',
  scores: {
    score: { value: '62%', label: 'SCORE', icon: Activity, color: 'text-purple-600' },
    confidence: { value: '68 dB', label: 'CONFIDENCE', icon: Volume2, color: 'text-blue-500' },
    pitch: { value: '41%', label: 'PITCH', icon: Activity, color: 'text-orange-500' },
    latency: { value: '1.8s', label: 'LATENCY', icon: Clock, color: 'text-red-500' },
  },
  heatmap: {
    legend: { fluent: 33, mti: 5, hesitation: 4 },
    text: [
      { word: 'So', type: 'fluent' }, { word: 'basically', type: 'hesitation' }, { word: 'the', type: 'fluent' }, { word: 'main', type: 'fluent' }, { word: 'advantage', type: 'mti' }, { word: 'of', type: 'fluent' }, { word: 'using', type: 'fluent' }, { word: 'a', type: 'fluent' }, { word: 'binary', type: 'fluent' }, { word: 'search', type: 'fluent' }, { word: 'tree', type: 'fluent' }, { word: 'is', type: 'fluent' }, { word: 'that', type: 'fluent' }, { word: 'um', type: 'hesitation' }, { word: 'it', type: 'fluent' }, { word: 'provides', type: 'mti' }, { word: 'logarithmic', type: 'mti' }, { word: 'time', type: 'fluent' }, { word: 'complexity', type: 'fluent' }, { word: 'for', type: 'fluent' }, { word: 'searching', type: 'fluent' },
      { word: 'operations.', type: 'fluent' }, { word: 'So', type: 'fluent' }, { word: 'when', type: 'fluent' }, { word: 'we', type: 'fluent' }, { word: 'are', type: 'fluent' }, { word: 'actually', type: 'hesitation' }, { word: 'implementing', type: 'mti' }, { word: 'this', type: 'fluent' }, { word: 'in', type: 'fluent' }, { word: 'the', type: 'fluent' }, { word: 'real', type: 'fluent' }, { word: 'world', type: 'fluent' }, { word: 'scenario,', type: 'fluent' }, { word: 'uh...', type: 'hesitation' }, { word: 'we', type: 'fluent' }, { word: 'need', type: 'fluent' }, { word: 'to', type: 'fluent' }, { word: 'consider', type: 'fluent' }, { word: 'the', type: 'fluent' }, { word: 'balancing', type: 'fluent' }, { word: 'factor.', type: 'mti' }
    ]
  }
};

const SpeakingPractice = () => {
  const [activeTab, setActiveTab] = useState("speaking-practice");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // 2. Add Premium Modal State
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <StudentSidebar 
        activeTab='assessment' 
        onTabChange={setActiveTab} 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div 
        className={`min-h-screen flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* 3. Integrated Topbar */}
        <StudentTopbar onUpgradeClick={() => setShowPremiumModal(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center space-x-2">
                <Mic className="w-8 h-8 text-purple-600" />
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Speech Anatomy</h1>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Analysis for {analysisData.user}</p>
            </div>
            <button className="flex items-center px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-all active:scale-95">
              <Mic className="w-5 h-5 mr-2" />
              Start Mic
            </button>
          </div>

          {/* Score Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Object.entries(analysisData.scores).map(([key, { value, label, icon: Icon, color }]) => (
              <div key={key} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col transition-transform hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <span className={`text-3xl font-black ${color}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Phonetic Heatmap Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Phonetic Heatmap</h2>
            <div className="flex space-x-6 mb-4 text-xs font-bold uppercase tracking-wider">
              <div className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>Fluent ({analysisData.heatmap.legend.fluent})</div>
              <div className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>MTI ({analysisData.heatmap.legend.mti})</div>
              <div className="flex items-center"><span className="w-3 h-3 bg-orange-400 rounded-full mr-2"></span>Hesitation ({analysisData.heatmap.legend.hesitation})</div>
            </div>
            <div className="leading-relaxed text-slate-800 dark:text-slate-200">
              {analysisData.heatmap.text.map((item, index) => (
                <span
                  key={index}
                  className={`inline-block px-1.5 py-0.5 m-0.5 rounded-md font-medium text-sm transition-colors ${
                    item.type === 'fluent' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    item.type === 'mti' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                    'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                  }`}
                >
                  {item.word}
                </span>
              ))}
            </div>
          </div>

          {/* Acoustic Metrics Section */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Acoustic Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Pitch Chart */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-72 flex flex-col">
                <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">Pitch Variance</h3>
                <div className="flex-1 w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pitchData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff' }} 
                        itemStyle={{ color: '#fff' }}
                      />
                      <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Confidence Chart */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-72 flex flex-col">
                <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">Confidence (dB)</h3>
                <div className="flex-1 w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={confidenceData}>
                      <defs>
                        <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={['dataMin - 10', 'dataMax + 10']} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }} />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorConfidence)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Latency Chart */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-72 flex flex-col">
                <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">Latency (s)</h3>
                <div className="flex-1 w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={latencyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                      <XAxis dataKey="segment" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip cursor={{ fill: '#f1f5f9', opacity: 0.4 }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                      <Bar dataKey="delay" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* 4. Added Premium Modal component */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
};

export default SpeakingPractice;