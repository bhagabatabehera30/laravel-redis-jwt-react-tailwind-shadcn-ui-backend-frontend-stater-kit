import React from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Settings, Shield, Key } from 'lucide-react';
import { Button } from '../../components/ui/button';

const UserSettings: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Configuration Settings</h2>
          <p className="text-sm md:text-base text-muted-foreground">Manage administrative preferences and global system variables.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader className="pb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Settings className="h-6 w-6" />
              </div>
              <CardTitle>General System</CardTitle>
              <CardDescription>Adjust localization timezone settings natively.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Configure</Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader className="pb-4">
              <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4 text-secondary">
                <Shield className="h-6 w-6" />
              </div>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>Scale global roles seamlessly over the active platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Configure</Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader className="pb-4">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-600">
                <Key className="h-6 w-6" />
              </div>
              <CardTitle>API Tokens</CardTitle>
              <CardDescription>Regulate active machine keys spanning connected accounts.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Configure</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default UserSettings;
