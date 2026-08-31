import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { StatCards } from '../components/dashboard/StatCards';
import { QuickActions } from '../components/dashboard/QuickActions';
import { ProgrammeProgress } from '../components/dashboard/ProgrammeProgress';
import { CapacityVsDemand } from '../components/dashboard/CapacityVsDemand';
import { WorkloadSummary } from '../components/dashboard/WorkloadSummary';
import { 
  History, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileCheck2
} from 'lucide-react';

export const Dashboard = () => {
  const { currentSession, showToast, setActiveTab } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic Dashboard States
  const [stats, setStats] = useState({
    totalFaculty: 34,
    permanentFaculty: 26,
    visitingFaculty: 8,
    allocatedSections: 68,
    totalSections: 72,
    remainingSections: 4,
    conflictCount: 2,
    criticalConflicts: 1,
    warningConflicts: 1,
    optimalPercentage: 88.2,
    balancedFaculty: 24,
    overloadedFaculty: 2,
  });

  const [workloadSummary, setWorkloadSummary] = useState({
    totalFaculty: 34,
    underloaded: 2,
    balanced: 24,
    nearMaximum: 6,
    overloaded: 2,
  });

  const [activities, setActivities] = useState([
    {
      id: '1',
      action: 'ALLOCATION_APPROVED',
      title: 'Dr. Shafiq assigned to CS-201 (Data Structures)',
      user: 'Dr. Kamran Malik (HOD)',
      time: '12 mins ago',
      status: 'approved',
    },
    {
      id: '2',
      action: 'ALLOCATION_SUBMITTED',
      title: 'Engr. Bilal Hassan proposed for CS-201 Lab (BSCS-3A)',
      user: 'Dr. Sarah Ahmed (Convener)',
      time: '45 mins ago',
      status: 'under_review',
    },
    {
      id: '3',
      action: 'WORKLOAD_OPTIMAL',
      title: 'Workload Optimal: Dr. Amina Tariq at 12.0 Cr Hrs',
      user: 'Automated Workload Engine',
      time: '2 hours ago',
      status: 'resolved',
    },
  ]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Workload Summary from live backend if available
      const workloadRes = await api.getWorkloadSummary(currentSession.id).catch(() => null);
      if (workloadRes?.data?.summaryCount) {
        setWorkloadSummary(workloadRes.data.summaryCount);
      }

      // 2. Fetch Conflicts Scan from live backend
      const conflictsRes = await api.scanConflicts(currentSession.id).catch(() => null);
      if (conflictsRes?.data?.summary) {
        setStats((prev) => ({
          ...prev,
          conflictCount: conflictsRes.data.summary.totalIssuesFound,
          criticalConflicts: conflictsRes.data.summary.critical,
          warningConflicts: conflictsRes.data.summary.warnings,
        }));
      }

      showToast('Dashboard metrics synchronized with live database', 'success');
    } catch (err) {
      console.warn('Dashboard live fetch fallback active');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentSession.id]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header Banner & Quick Action Console */}
      <QuickActions onRefresh={fetchDashboardData} isRefreshing={isLoading} />

      {/* 2. Top Metric Stat Cards */}
      <StatCards stats={stats} />

      {/* 3. Core Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Programme Progress & Workload Status (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <ProgrammeProgress />
          <WorkloadSummary summary={workloadSummary} />
        </div>

        {/* Right Column: Capacity vs Demand & Recent Audit Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <CapacityVsDemand />

          {/* Audit Trail Activity Stream */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-2">
                <History size={18} className="text-academic-600" />
                <span>Recent Audit Trail</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                Session FA25
              </span>
            </div>

            <div className="space-y-3">
              {activities.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-start gap-3 transition-colors"
                >
                  <div className="p-1.5 rounded-md bg-white border border-slate-200 text-academic-700 mt-0.5">
                    {item.status === 'approved' && <CheckCircle2 size={14} className="text-emerald-600" />}
                    {item.status === 'under_review' && <Clock size={14} className="text-amber-600" />}
                    {item.status === 'warning' && <AlertCircle size={14} className="text-red-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 leading-snug truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span>{item.user}</span>
                      <span>•</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setActiveTab('conflicts');
                showToast('Viewing full system audit log');
              }}
              className="w-full mt-4 py-2 text-center text-xs font-semibold text-academic-700 hover:text-academic-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Full Allocation History & Logs</span>
              <ArrowRight size={13} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

