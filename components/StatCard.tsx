import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'teal' | 'orange' | 'red' | 'gray';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, color = 'teal' }) => {
  const colorClasses = {
    teal: 'bg-primary',
    orange: 'bg-accent',
    red: 'bg-error',
    gray: 'bg-secondary',
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full">
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</h3>
      <div className="mt-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
      </div>
      <div className={`h-1 w-full mt-4 rounded-full opacity-20 ${colorClasses[color]}`} />
    </div>
  );
};

export default StatCard;