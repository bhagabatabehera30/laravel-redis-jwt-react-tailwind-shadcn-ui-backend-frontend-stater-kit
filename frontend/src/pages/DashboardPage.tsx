import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Loader } from '../components/ui/loader';
import { Users, DollarSign, Activity, TrendingUp } from 'lucide-react';

import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';
import { StatsCards } from '../components/dashboard/StatsCards';
import { OverviewCharts } from '../components/dashboard/OverviewCharts';

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  React.useEffect(() => {
    // Simulate network API fetching delay for demonstration
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = () => {
    setIsFetching(true);
    setTimeout(() => setIsFetching(false), 500);
  };

  // Sample API mock data mapped inside orchestrator context
  const stats = [
    { title: 'Total Users', value: '2,543', change: '+12%', icon: Users },
    { title: 'Revenue', value: '$45,231', change: '+8%', icon: DollarSign },
    { title: 'Active Sessions', value: '1,234', change: '+5%', icon: Activity },
    { title: 'Conversion Rate', value: '3.2%', change: '+2%', icon: TrendingUp },
  ];

  const barData = [
    { name: 'Jan', users: 400, revenue: 2400 },
    { name: 'Feb', users: 300, revenue: 1398 },
    { name: 'Mar', users: 200, revenue: 9800 },
    { name: 'Apr', users: 278, revenue: 3908 },
    { name: 'May', users: 189, revenue: 4800 },
    { name: 'Jun', users: 239, revenue: 3800 },
  ];

  const pieData = [
    { name: 'Desktop', value: 400, color: '#0088FE' },
    { name: 'Mobile', value: 300, color: '#00C49F' },
    { name: 'Tablet', value: 200, color: '#FFBB28' },
    { name: 'Other', value: 100, color: '#FF8042' },
  ];

  return (
    <Layout>
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 relative min-h-[60vh]">
          <Loader isLoading={isFetching} message="" className="z-50" />
          
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t('dashboard')}</h2>
              <p className="text-sm md:text-base text-muted-foreground">Welcome back! Here's what's happening with your app.</p>
            </div>
          </div>

          <StatsCards stats={stats} />

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:flex">
              <TabsTrigger value="overview" onClick={handleTabChange} className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="analytics" onClick={handleTabChange} className="text-xs sm:text-sm">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <OverviewCharts barData={barData} pieData={pieData} />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Detailed Analytics</CardTitle>
                  <CardDescription>Advanced metrics and insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm md:text-base">Analytics content goes here...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </Layout>
  );
};

export default DashboardPage;