'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import VideoGenerationForm from '@/components/generation/VideoGenerationForm';
import BlogGenerationForm from '@/components/generation/BlogGenerationForm';
import SocialGenerationForm from '@/components/generation/SocialGenerationForm';
import GenerationHistory from '@/components/generation/GenerationHistory';

export default function GeneratePage() {
  const [activeTab, setActiveTab] = useState('video');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Content Generation</h1>
        <p className="text-muted-foreground">
          Create videos, blog posts, and social media content with AI
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="blog">Blog Post</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
        </TabsList>

        <TabsContent value="video" className="space-y-4">
          <Card className="p-6">
            <VideoGenerationForm />
          </Card>
        </TabsContent>

        <TabsContent value="blog" className="space-y-4">
          <Card className="p-6">
            <BlogGenerationForm />
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Card className="p-6">
            <SocialGenerationForm />
          </Card>
        </TabsContent>
      </Tabs>

      <GenerationHistory />
    </div>
  );
}