"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Bell, Mail, MessageSquare, Video, TrendingUp, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface NotificationCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  settings: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
}

const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  {
    id: 'content',
    title: 'Content Generation',
    description: 'Updates about your generated videos, blogs, and social posts',
    icon: <Video className="h-5 w-5" />,
    settings: { email: true, push: true, inApp: true },
  },
  {
    id: 'social',
    title: 'Social Media',
    description: 'Publishing confirmations and engagement metrics',
    icon: <MessageSquare className="h-5 w-5" />,
    settings: { email: true, push: false, inApp: true },
  },
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    description: 'Weekly performance summaries and insights',
    icon: <TrendingUp className="h-5 w-5" />,
    settings: { email: true, push: false, inApp: false },
  },
  {
    id: 'system',
    title: 'System Notifications',
    description: 'Important updates, maintenance, and security alerts',
    icon: <AlertCircle className="h-5 w-5" />,
    settings: { email: true, push: true, inApp: true },
  },
  {
    id: 'billing',
    title: 'Billing & Subscription',
    description: 'Payment confirmations and subscription updates',
    icon: <CheckCircle className="h-5 w-5" />,
    settings: { email: true, push: false, inApp: true },
  },
];

export default function NotificationSettings() {
  const [categories, setCategories] = useState(NOTIFICATION_CATEGORIES);
  const [emailFrequency, setEmailFrequency] = useState('instant');
  const [isSaving, setIsSaving] = useState(false);

  const toggleNotification = (categoryId: string, type: 'email' | 'push' | 'inApp') => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { 
            ...cat, 
            settings: { 
              ...cat.settings, 
              [type]: !cat.settings[type] 
            } 
          }
        : cat
    ));
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      // TODO: Call API to save preferences
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: 'Preferences saved',
        description: 'Your notification preferences have been updated',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save notification preferences',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Global Preferences
          </CardTitle>
          <CardDescription>
            Manage how you receive notifications across all categories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-frequency">Email Digest Frequency</Label>
              <p className="text-sm text-muted-foreground">
                How often you want to receive email summaries
              </p>
            </div>
            <Select value={emailFrequency} onValueChange={setEmailFrequency}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Summary</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Category Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Categories</CardTitle>
          <CardDescription>
            Choose which notifications you want to receive and how
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Headers */}
            <div className="grid grid-cols-4 gap-4 text-sm font-medium">
              <div className="col-span-1"></div>
              <div className="text-center">
                <Mail className="h-4 w-4 mx-auto mb-1" />
                Email
              </div>
              <div className="text-center">
                <Bell className="h-4 w-4 mx-auto mb-1" />
                Push
              </div>
              <div className="text-center">
                <MessageSquare className="h-4 w-4 mx-auto mb-1" />
                In-App
              </div>
            </div>

            <Separator />

            {/* Categories */}
            {categories.map((category) => (
              <div key={category.id} className="space-y-4">
                <div className="grid grid-cols-4 gap-4 items-start">
                  <div className="col-span-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {category.icon}
                      <Label className="font-medium">{category.title}</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                  <div className="text-center">
                    <Switch
                      checked={category.settings.email}
                      onCheckedChange={() => toggleNotification(category.id, 'email')}
                    />
                  </div>
                  <div className="text-center">
                    <Switch
                      checked={category.settings.push}
                      onCheckedChange={() => toggleNotification(category.id, 'push')}
                    />
                  </div>
                  <div className="text-center">
                    <Switch
                      checked={category.settings.inApp}
                      onCheckedChange={() => toggleNotification(category.id, 'inApp')}
                    />
                  </div>
                </div>
                {category.id !== categories[categories.length - 1].id && (
                  <Separator />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}