import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Bell, Database, Users } from 'lucide-react';

const Settings = () => {
  return (
    <div className="h-full flex flex-col">
      <header className="border-b bg-card">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Configure your application preferences and settings
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-4xl space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>User Preferences</CardTitle>
                  <CardDescription>Manage your personal preferences and account settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                User preference settings will be available in a future update.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-chart-2/10 p-2 rounded-lg">
                  <Bell className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Configure email and system notifications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Notification settings will be available in a future update.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-chart-3/10 p-2 rounded-lg">
                  <Database className="h-5 w-5 text-chart-3" />
                </div>
                <div>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Import, export, and manage your data</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Data management tools will be available in a future update.
              </p>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-lg">
                  <SettingsIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>Application version and system details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version:</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Database:</span>
                  <span className="font-medium">Supabase</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Environment:</span>
                  <span className="font-medium">Production</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
