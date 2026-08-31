import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  BookCheck, 
  AlertTriangle, 
  Activity, 
  ArrowUpRight,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';

export const StatCards = ({ stats = {} }) => {
  const { setActiveTab } = useApp();

  const cards = [
    {
      id: 'faculty-stat',
      title: 'Faculty Strength',
      mainValue: stats.totalFaculty || '34',
      subValue: `${stats.permanentFaculty || '26'} Permanent • ${stats.visitingFaculty || '8'} Visiting`,
      icon: Users,
      trend: '+2 from Spring',
      trendPositive: true,
      onClick: () => setActiveTab('faculty'),
      colorScheme: 'border-blue-200 hover:border-academic-500 bg-white',
      iconBg: 'bg-academic-50 text-academic-700',
    },
    {
      id: 'allocations-stat',
      title: 'Allocations Progress',
      mainValue: `${stats.allocatedSections || '68'} / ${stats.totalSections || '72'}`,
      subValue: `${stats.remainingSections || '4'} Sections Remaining`,
      icon: BookCheck,
      trend: '94.4% Complete',
      trendPositive: true,
      onClick: () => setActiveTab('allocations'),
      colorScheme: 'border-blue-200 hover:border-academic-500 bg-white',
      iconBg: 'bg-emerald-50 text-emerald-700',
    },
    {
      id: 'conflicts-stat',
      title: 'Policy Conflicts',
      mainValue: stats.conflictCount || '2',
      subValue: `${stats.criticalConflicts || '1'} Critical Overload • ${stats.warningConflicts || '1'} Warning`,
      icon: AlertTriangle,
      trend: 'Action Required',
      trendPositive: false,
      onClick: () => setActiveTab('conflicts'),
      colorScheme: 'border-amber-200 hover:border-amber-500 bg-amber-50/40',
      iconBg: 'bg-amber-100 text-amber-800',
      highlightBadge: 'Audit Scan',
    },
    {
      id: 'workload-health-stat',
      title: 'Workload Distribution',
      mainValue: `${stats.optimalPercentage || '88.2'}%`,
      subValue: `${stats.balancedFaculty || '24'} Optimal • ${stats.overloadedFaculty || '2'} Overloaded`,
      icon: Activity,
      trend: 'Average 10.4 Cr/Faculty',
      trendPositive: true,
      onClick: () => setActiveTab('faculty'),
      colorScheme: 'border-blue-200 hover:border-academic-500 bg-white',
      iconBg: 'bg-academic-100 text-academic-800',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={card.onClick}
            className={`p-4 rounded-xl border ${card.colorScheme} shadow-subtle academic-card-hover cursor-pointer relative group transition-all`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.title}
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                  {card.mainValue}
                </h3>
              </div>
              <div className={`p-2.5 rounded-lg ${card.iconBg}`}>
                <Icon size={20} />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium truncate">
                {card.subValue}
              </span>
              <span className="flex items-center gap-0.5 text-academic-700 font-semibold group-hover:translate-x-0.5 transition-transform">
                <ArrowUpRight size={14} />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
