import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  Bell, 
  Menu, 
  X, 
  Calendar, 
  ChevronDown, 
  Sparkles,
  Lock, 
  Unlock, 
  GraduationCap,
  LogOut,
  User,
  Activity,
  Layers,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const Navbar = () => {
  const { 
    currentSession, 
    currentUser, 
    setCurrentUser, 
    isMobileMenuOpen, 
    setIsMobileMenuOpen, 
    showToast,
    setActiveTab,
    logout,
    allocations = [],
    setShowConvenerPermissionsModal,
    setShowHODPermissionsModal,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Compute Real-Time Dynamic Notifications from live allocations
  const liveNotifications = useMemo(() => {
    const list = [];
    allocations.forEach(a => {
      if (a.status === 'under_review') {
        list.push({
          id: `rev-${a.id}`,
          type: 'review',
          title: `Allocation Review: ${a.courseCode}`,
          description: `${a.facultyAssigned} proposed for ${a.section}`,
          time: 'Awaiting HOD Sign-off',
          tab: 'allocations',
          severity: 'warning',
        });
      }
      if (a.workloadStatus === 'warning' || a.workloadImpact?.includes('Overloaded')) {
        list.push({
          id: `ovl-${a.id}`,
          type: 'overload',
          title: `Workload Alert: ${a.facultyAssigned}`,
          description: `${a.courseCode} exceeds statutory quota`,
          time: 'Critical Compliance Issue',
          tab: 'conflicts',
          severity: 'critical',
        });
      }
      if (a.facultyAssigned === 'Unassigned' || a.status === 'draft') {
        list.push({
          id: `draft-${a.id}`,
          type: 'unassigned',
          title: `Unallocated: ${a.courseCode}`,
          description: `${a.programme} Sem ${a.semester} (${a.section})`,
          time: 'Teacher Assignment Needed',
          tab: 'remaining',
          severity: 'info',
        });
      }
    });
    return list;
  }, [allocations]);

  const handleLogoutClick = () => {
    setIsUserMenuOpen(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-subtle">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-academic-600 flex items-center justify-center text-white shadow-sm group-hover:bg-academic-700 transition-colors">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  CS Workload &amp; Allocation
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-academic-100 text-academic-800 border border-academic-200">
                  Command Centre
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Department of Computer Science • Faculty Management System
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions & User Dropdown */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Active Session Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
            <Calendar size={14} className="text-academic-600" />
            <span>Session: <strong className="text-slate-900 font-semibold">{currentSession?.session_code || 'FA25'}</strong> ({currentSession?.name || 'Fall 2025'})</span>
            {currentSession?.is_locked ? (
              <span className="flex items-center gap-1 text-amber-700 ml-1">
                <Lock size={12} /> Locked
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold ml-1">
                <Unlock size={12} /> Active
              </span>
            )}
          </div>

          {/* Role Badge with Direct Policy & Permissions Trigger */}
          {currentUser?.role === 'hod' ? (
            <button
              onClick={() => setShowHODPermissionsModal(true)}
              title="Click to manage Convener role permissions & policies in real time"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 hover:border-amber-400 transition-all shadow-2xs group"
            >
              <ShieldCheck size={14} className="text-amber-600 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline text-slate-500 font-semibold">Role:</span>
              <span className="uppercase tracking-wide font-extrabold">HOD</span>
              <span className="text-[10px] bg-amber-200/90 text-amber-950 px-1.5 py-0.2 rounded font-semibold hidden md:inline ml-0.5">
                Manage Policy
              </span>
            </button>
          ) : (
            <button
              onClick={() => setShowConvenerPermissionsModal(true)}
              title="Click to view allowed & restricted features for your Convener role"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border bg-indigo-50 text-indigo-900 border-indigo-300 hover:bg-indigo-100 hover:border-indigo-400 transition-all shadow-2xs group"
            >
              <ShieldCheck size={14} className="text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline text-slate-500 font-semibold">Role:</span>
              <span className="uppercase tracking-wide font-extrabold">
                {currentUser?.role === 'convener' ? 'CONVENER' : 'FACULTY'}
              </span>
              <span className="text-[10px] bg-indigo-200/90 text-indigo-950 px-1.5 py-0.2 rounded font-semibold hidden md:inline ml-0.5">
                My Permissions
              </span>
            </button>
          )}

          {/* Real-time Conflict Notification Popover */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              title="Live Conflict & Activity Notifications"
              aria-expanded={isNotificationOpen}
            >
              <Bell size={19} />
              {liveNotifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white shadow-xs">
                  {liveNotifications.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-fadeIn">
                <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-academic-400" />
                    <span className="font-bold text-xs">Live System Alerts ({liveNotifications.length})</span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('conflicts');
                      setIsNotificationOpen(false);
                    }}
                    className="text-[11px] text-academic-300 hover:text-white font-semibold hover:underline"
                  >
                    Open Conflict Centre
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {liveNotifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                      <p className="font-bold text-slate-800">All Workloads Compliant</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">No active scheduling conflicts or pending reviews</p>
                    </div>
                  ) : (
                    liveNotifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setActiveTab(n.tab);
                          setIsNotificationOpen(false);
                        }}
                        className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 text-xs"
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                          n.severity === 'critical' 
                            ? 'bg-red-100 text-red-700' 
                            : n.severity === 'warning' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          <Activity size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-900 leading-tight">{n.title}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5">{n.description}</div>
                          <div className={`text-[10px] font-semibold mt-1 ${
                            n.severity === 'critical' ? 'text-red-600' : 'text-slate-400'
                          }`}>
                            {n.time}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setActiveTab('allocations');
                      setIsNotificationOpen(false);
                    }}
                    className="text-[11px] font-bold text-academic-700 hover:text-academic-900"
                  >
                    View All Course Allocations &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar with Dropdown Menu */}
          <div className="relative pl-2 sm:pl-3 border-l border-slate-200" ref={dropdownRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-all group"
              aria-expanded={isUserMenuOpen}
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center ring-2 ring-academic-100 shadow-xs">
                {currentUser.avatar || 'KM'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-none group-hover:text-academic-700 transition-colors">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 capitalize">
                  {currentUser.role === 'hod' ? 'Head of Department' : 'Team Convener'}
                </div>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-fadeIn">
                
                {/* User Header Profile */}
                <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-academic-600 text-white">
                      {currentUser.role === 'hod' ? 'HOD Command Mode' : 'Convener Mode'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Session Active" />
                  </div>
                  <div className="text-sm font-bold text-white pt-1">{currentUser.name}</div>
                  <div className="text-xs text-slate-300 font-mono truncate">{currentUser.email}</div>
                  <div className="text-[11px] text-slate-400 pt-0.5">{currentUser.department}</div>
                </div>

                {/* Navigation Links in Dropdown */}
                <div className="p-2 space-y-0.5 text-xs text-slate-700 font-medium">
                  <button
                    onClick={() => {
                      setActiveTab('dashboard');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors text-left"
                  >
                    <GraduationCap size={15} className="text-academic-600" />
                    <span>HOD Command Centre</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('allocations');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors text-left"
                  >
                    <Layers size={15} className="text-academic-600" />
                    <span>Allocation Workspace</span>
                  </button>

                  <button
                    onClick={() => {
                      if (currentUser?.role === 'hod') {
                        setShowHODPermissionsModal(true);
                      } else {
                        setShowConvenerPermissionsModal(true);
                      }
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors text-left"
                  >
                    <ShieldCheck size={15} className="text-academic-600" />
                    <span>{currentUser?.role === 'hod' ? 'Convener Role Governance Policy' : 'My Role Permissions & Scope'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('activity-log');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors text-left"
                  >
                    <Activity size={15} className="text-academic-600" />
                    <span>Activity Audit Trail</span>
                  </button>
                </div>

                {/* Logout Button */}
                <div className="p-2 border-t border-slate-100 bg-slate-50/70">
                  <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <LogOut size={15} className="text-red-500 group-hover:text-red-600" />
                      <span>Log out</span>
                    </div>
                    <span className="text-[10px] font-normal text-slate-400">Return to Landing</span>
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
