import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export interface StatItem {
  title: string;
  value: string | number;
  change: string;
  icon: React.ElementType;
}

interface StatsCardsProps {
  stats: StatItem[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <stat.icon className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">{stat.change}</span> from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
