import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'bg-[#EDE5DC] text-[#6F5540]',
}) => {
  return (
    <div className="bg-white/80 border border-[#EDE5DC] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8C6F55]">{title}</p>
          <h4 className="text-2xl font-serif font-bold text-[#2C2725] mt-1">{value}</h4>
          {subtitle && <p className="text-xs text-[#8C6F55] mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl shrink-0 ${accentColor}`}>{icon}</div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-[#F6F2EC] flex items-center text-xs">
          <span className={`font-semibold mr-1.5 ${trend.isPositive ? 'text-[#24634B]' : 'text-[#9B2C1C]'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-[#8C6F55]">vs. período anterior</span>
        </div>
      )}
    </div>
  );
};
