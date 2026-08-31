import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LoginModal } from '../components/auth/LoginModal';
import { 
  GraduationCap, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Scale, 
  Users, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  Activity, 
  Clock, 
  FileSpreadsheet,
  Cpu,
  BarChart3,
  Calendar
} from 'lucide-react';

export const LandingPage = () => {
  const { currentSession, isAuthenticated, setActiveTab } = useApp();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState('faculty'); // 'faculty' | 'hod'

  const openLogin = (mode = 'faculty') => {
    setLoginMode(mode);
    setIsLoginModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-academic-500 selection:text-white">
      
      {/* 1. Top Public Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          
          {/* Logo & Department Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-academic-600 flex items-center justify-center text-white shadow-sm">
              <GraduationCap size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-950 tracking-tight text-base sm:text-lg">
                  CS Workload &amp; Allocation
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-academic-100 text-academic-800 border border-academic-200">
                  Academic v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Department of Computer Science • Faculty Management System
              </p>
            </div>
          </div>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <Calendar size={14} className="text-academic-600" />
              <span>Session {currentSession?.session_code || 'FA25'}</span>
            </div>

            {isAuthenticated ? (
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-academic-600 hover:bg-academic-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <span>Enter Dashboard</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={() => openLogin('faculty')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Users size={14} />
                <span>Portal Login</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-white via-academic-50/40 to-slate-50">
        
        {/* Subtle decorative background circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-academic-100/50 rounded-full blur-3xl pointer-events-none -z-10" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          {/* Active Session & Department Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-academic-100/80 border border-academic-200 text-academic-900 text-xs font-bold shadow-sm">
            <Sparkles size={14} className="text-academic-600" />
            <span>Official Course Allocation &amp; Workload Command Platform</span>
            <span className="w-1.5 h-1.5 rounded-full bg-academic-600" />
            <span className="text-academic-700">{currentSession?.name || 'Fall Semester 2025'}</span>
          </div>

          {/* Main Hero Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.1]">
            Intelligent Faculty Allocation &amp; <br />
            <span className="bg-gradient-to-r from-academic-600 via-academic-700 to-indigo-800 bg-clip-text text-transparent">
              Workload Compliance Engine
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Streamlining degree programmes (<strong>BSCS</strong>, <strong>BSSE</strong>, <strong>MSCS</strong>) with multi-factor candidate matching, statutory credit-hour enforcement, and end-to-end HOD approval pipelines.
          </p>

          {/* 🌟 PROMINENT PRIMARY BUTTON IN THE CENTER: "Teacher / Team Member Login" */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => openLogin('faculty')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-academic-600 hover:bg-academic-700 text-white font-bold text-base shadow-lg shadow-academic-600/25 hover:shadow-xl hover:shadow-academic-600/30 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Users size={20} />
              <span>Teacher / Team Member Login</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle text-left">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Faculty Strength</span>
              <div className="text-xl font-bold text-slate-900 mt-0.5">24 Active</div>
              <span className="text-[11px] text-academic-700 font-medium">18 Permanent • 6 Visiting</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle text-left">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Programmes</span>
              <div className="text-xl font-bold text-slate-900 mt-0.5">BSCS, BSSE, MSCS</div>
              <span className="text-[11px] text-academic-700 font-medium">72 Course Sections</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle text-left">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Allocation Progress</span>
              <div className="text-xl font-bold text-slate-900 mt-0.5">94.1%</div>
              <span className="text-[11px] text-emerald-700 font-medium">68 / 72 Allocated</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle text-left">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Policy Compliance</span>
              <div className="text-xl font-bold text-slate-900 mt-0.5">HEC Verified</div>
              <span className="text-[11px] text-academic-700 font-medium">Statutory Hours Audited</span>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Core Engine Pillars */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
              Purpose-Built for Department Academic Governance
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Complete workflow integration from syllabus credit parsing to Dean export spreadsheets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 hover:border-academic-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-academic-100 text-academic-700 flex items-center justify-center font-bold">
                <Sparkles size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">AI Recommendation Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ranks instructors for each course section with dynamic % match scores based on past teaching cycles, subject specialization, and available workload capacity.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 hover:border-academic-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Scale size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Statutory Workload Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automatically calculates weighted contact loads: <strong>Theory × 1.0 + Lab × 0.5</strong>. Flags policy overloads and lab rank mismatches in real time.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 hover:border-academic-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                <Lock size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">3-Stage Approval &amp; Locking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strict governance: Draft &rarr; Under Review &rarr; HOD Approved. Approved sections are immediately locked against unauthorized edits.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 4. Footer with Discrete Link: "HOD Secure Login" */}
      <footer className="mt-auto bg-slate-900 text-white border-t border-slate-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-academic-600 flex items-center justify-center text-white font-bold text-sm">
              CS
            </div>
            <div>
              <div className="font-bold text-white text-sm">Department of Computer Science</div>
              <p className="text-xs text-slate-400">CS Course Allocation &amp; Faculty Workload Management System</p>
            </div>
          </div>

          {/* Center Copyright */}
          <div className="text-xs text-slate-500 text-center">
            &copy; 2026 Department of Computer Science. All Rights Reserved.
          </div>

          {/* 🔒 DISCRETE LINK AT THE BOTTOM: "HOD Secure Login" */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => openLogin('hod')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 border border-slate-700/60 transition-colors font-semibold"
            >
              <Lock size={12} className="text-amber-400" />
              <span>HOD Secure Login</span>
            </button>
          </div>

        </div>
      </footer>

      {/* 5. Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        initialMode={loginMode}
      />

    </div>
  );
};
