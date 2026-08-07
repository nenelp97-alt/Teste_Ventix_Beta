import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, icon: Icon, color, subtitle, onClick }) {
  const colorMap = {
    primary: 'bg-muted text-muted-foreground',
    secondary: 'bg-muted text-muted-foreground',
    accent: 'bg-muted text-muted-foreground',
    destructive: 'bg-muted text-muted-foreground',
    muted: 'bg-muted text-muted-foreground'
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card p-6 border border-border shadow-sm hover:shadow-md transition-shadow rounded-[20px]",
        onClick && "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("p-3 rounded-xl", colorMap[color] || colorMap.primary)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}