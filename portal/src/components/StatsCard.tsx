import React from 'react';

interface Props {
  title: string;
  value: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'red' | 'yellow';
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600 border-blue-200',
  green: 'from-green-500 to-green-600 border-green-200', 
  purple: 'from-purple-500 to-purple-600 border-purple-200',
  red: 'from-red-500 to-red-600 border-red-200',
  yellow: 'from-yellow-500 to-yellow-600 border-yellow-200'
};

export function StatsCard({ title, value, icon, color }: Props) {
  return (
    <div className={`bg-gradient-to-r ${colorClasses[color]} text-white rounded-xl p-3 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-white/80">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="text-xl sm:text-3xl opacity-80">
          {icon}
        </div>
      </div>
    </div>
  );
} 