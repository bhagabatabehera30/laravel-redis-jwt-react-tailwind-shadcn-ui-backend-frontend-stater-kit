import React from 'react';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader } from '../ui/card';

export const DashboardSkeleton: React.FC = () => {
  const chartHeights = ['40%', '80%', '30%', '100%', '50%', '70%'];
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4">
        <div>
          <Skeleton className="h-8 w-[200px] sm:w-[300px] mb-2" />
          <Skeleton className="h-4 w-[250px] sm:w-[450px]" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-0 shadow-sm h-[130px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[120px] mb-2 mt-2" />
              <Skeleton className="h-3 w-[150px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs and Content Skeleton */}
      <div className="space-y-4 pt-2">
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-10 w-[90px] rounded-md" />
          <Skeleton className="h-10 w-[90px] rounded-md" />
          <Skeleton className="h-10 w-[90px] rounded-md" />
        </div>
        
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-[200px] mb-2" />
              <Skeleton className="h-4 w-[250px]" />
            </CardHeader>
            <CardContent className="flex justify-around items-end h-[300px] gap-2 pb-4">
               {chartHeights.map((h, i) => (
                 <Skeleton key={i} className="w-12 rounded-t-sm" style={{ height: h }} />
               ))}
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-[200px] mb-2" />
              <Skeleton className="h-4 w-[250px]" />
            </CardHeader>
            <CardContent className="flex justify-center items-center h-[300px]">
              <Skeleton className="h-[200px] w-[200px] rounded-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
