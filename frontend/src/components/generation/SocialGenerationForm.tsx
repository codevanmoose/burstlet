'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Loader2, Share2, Twitter, Instagram, Video } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGenerateSocialPosts } from '@/hooks/api/use-generation';
import { toast } from 'react-hot-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const socialGenerationSchema = z.object({
  topic: z.string().min(5, 'Topic must be at least 5 characters'),
  platform: z.enum(['twitter', 'instagram', 'tiktok']),
  includeHashtags: z.boolean(),
  includeEmojis: z.boolean(),
  generateImage: z.boolean(),
  tone: z.enum(['professional', 'casual', 'funny', 'inspirational', 'educational']),
});

type SocialGenerationFormData = z.infer<typeof socialGenerationSchema>;

const platformLimits = {
  twitter: { text: 280, hashtags: 5 },
  instagram: { text: 2200, hashtags: 30 },
  tiktok: { text: 2200, hashtags: 10 },
};

export default function SocialGenerationForm() {
  const [selectedPlatform, setSelectedPlatform] = useState<'twitter' | 'instagram' | 'tiktok'>('twitter');
  const { mutate: generateSocial, isPending: isLoading } = useGenerateSocialPosts();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SocialGenerationFormData>({
    resolver: zodResolver(socialGenerationSchema),
    defaultValues: {
      platform: 'twitter',
      includeHashtags: true,
      includeEmojis: true,
      generateImage: false,
      tone: 'casual',
    },
  });

  const includeHashtags = watch('includeHashtags');
  const includeEmojis = watch('includeEmojis');
  const generateImage = watch('generateImage');

  const onSubmit = async (data: SocialGenerationFormData) => {
    try {
      generateSocial({
        topic: data.topic,
        platforms: [selectedPlatform],
        tone: data.tone,
        hashtags: data.includeHashtags,
        emojis: data.includeEmojis,
      }, {
        onSuccess: () => {
          toast.success(`${selectedPlatform} post generated! Check the history tab.`);
        },
        onError: (error) => {
          toast.error('Failed to generate social post. Please try again.');
        },
      });
    } catch (error) {
      console.error('Social generation error:', error);
    }
  };

  const platformIcon = {
    twitter: <Twitter className="h-4 w-4" />,
    instagram: <Instagram className="h-4 w-4" />,
    tiktok: <Video className="h-4 w-4" />,
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Share2 className="h-6 w-6" />
          Generate Social Media Posts
        </h2>
        <p className="text-muted-foreground">
          Create engaging posts for different social platforms
        </p>
      </div>

      <Tabs 
        value={selectedPlatform} 
        onValueChange={(value) => {
          setSelectedPlatform(value as any);
          setValue('platform', value as any);
        }}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="twitter" className="flex items-center gap-2">
            <Twitter className="h-4 w-4" />
            Twitter/X
          </TabsTrigger>
          <TabsTrigger value="instagram" className="flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            Instagram
          </TabsTrigger>
          <TabsTrigger value="tiktok" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            TikTok
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPlatform} className="mt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Post Topic</Label>
              <Textarea
                id="topic"
                placeholder={`What should your ${selectedPlatform} post be about?`}
                className="min-h-[100px]"
                {...register('topic')}
              />
              {errors.topic && (
                <p className="text-sm text-destructive">{errors.topic.message}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Character limit:</span>
                <Badge variant="secondary">
                  {platformLimits[selectedPlatform].text} characters
                </Badge>
                <span>•</span>
                <span>Max hashtags:</span>
                <Badge variant="secondary">
                  {platformLimits[selectedPlatform].hashtags}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Post Tone</Label>
              <select
                id="tone"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                {...register('tone')}
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="funny">Funny</option>
                <option value="inspirational">Inspirational</option>
                <option value="educational">Educational</option>
              </select>
            </div>

            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="includeHashtags">Include Hashtags</Label>
                  <p className="text-sm text-muted-foreground">
                    Add relevant hashtags to increase reach
                  </p>
                </div>
                <Switch
                  id="includeHashtags"
                  checked={includeHashtags}
                  onCheckedChange={(checked) => setValue('includeHashtags', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="includeEmojis">Include Emojis</Label>
                  <p className="text-sm text-muted-foreground">
                    Add emojis to make posts more engaging
                  </p>
                </div>
                <Switch
                  id="includeEmojis"
                  checked={includeEmojis}
                  onCheckedChange={(checked) => setValue('includeEmojis', checked)}
                />
              </div>

              {(selectedPlatform === 'instagram' || selectedPlatform === 'tiktok') && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="generateImage">Generate Cover Image</Label>
                    <p className="text-sm text-muted-foreground">
                      Create an AI-generated image for your post
                    </p>
                  </div>
                  <Switch
                    id="generateImage"
                    checked={generateImage}
                    onCheckedChange={(checked) => setValue('generateImage', checked)}
                  />
                </div>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Cost: <strong>$0.01</strong> per post
                {generateImage && ' + $0.02 for image generation'}
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating {selectedPlatform} Post...
                </>
              ) : (
                <>
                  {platformIcon[selectedPlatform]}
                  <span className="ml-2">Generate {selectedPlatform} Post</span>
                </>
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}