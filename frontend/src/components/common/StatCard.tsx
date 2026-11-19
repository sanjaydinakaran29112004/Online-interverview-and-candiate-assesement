import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-indigo-50',
  iconColor = 'text-indigo-600'
}) => {
  return (
    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-3 rounded-2xl ${iconBgColor} ${iconColor}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
      <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-4 tracking-tight">
        {value}
      </div>
      {subtitle && (
        <span className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 inline-block">
          {subtitle}
        </span>
      )}
    </div>
  );
};
