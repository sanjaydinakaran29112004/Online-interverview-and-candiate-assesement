import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionTo?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  actionTo,
  onAction
}) => {
  return (
    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center mb-4 border border-slate-100">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="font-bold text-lg text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{description}</p>
      {actionText && (
        <div className="mt-6">
          {actionTo ? (
            <Link
              to={actionTo}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 transition inline-block"
            >
              {actionText}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 transition"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
