'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Loader2, Video, Music } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGenerateVideo } from '@/hooks/api/use-generation';
import { toast } from 'react-hot-toast';

const videoGenerationSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  duration: z.enum(['5', '10']),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']),
  style: z.enum(['realistic', 'animation', 'abstract', 'artistic']),
  includeAudio: z.boolean(),
  audioType: z.enum(['tts', 'music', 'both']).optional(),
  ttsText: z.string().optional(),
  musicStyle: z.string().optional(),
});

type VideoGenerationFormData = z.infer<typeof videoGenerationSchema>;

export default function VideoGenerationForm() {
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const { mutate: generateVideo, isPending: isLoading } = useGenerateVideo();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VideoGenerationFormData>({
    resolver: zodResolver(videoGenerationSchema),
    defaultValues: {
      duration: '5',
      aspectRatio: '16:9',
      style: 'realistic',
      includeAudio: false,
      audioType: 'tts',
    },
  });

  const includeAudio = watch('includeAudio');
  const audioType = watch('audioType');
  const duration = watch('duration');

  const calculateCost = () => {
    let cost = 0;
    
    // Video generation cost
    cost += duration === '5' ? 0.5 : 1.0;
    
    // Audio costs
    if (includeAudio) {
      if (audioType === 'tts' || audioType === 'both') {
        cost += 0.1; // TTS cost
      }
      if (audioType === 'music' || audioType === 'both') {
        cost += 0.2; // Music generation cost
      }
    }
    
    setEstimatedCost(cost);
  };

  const onSubmit = async (data: VideoGenerationFormData) => {
    try {
      generateVideo({
        prompt: data.prompt,
        duration: parseInt(data.duration),
        aspectRatio: data.aspectRatio,
        style: data.style,
        includeAudio: data.includeAudio,
        audioOptions: data.includeAudio ? {
          voiceover: (data.audioType === 'tts' || data.audioType === 'both') ? {
            text: data.ttsText,
            useAutoScript: !data.ttsText,
          } : undefined,
          backgroundMusic: (data.audioType === 'music' || data.audioType === 'both') ? {
            style: data.musicStyle,
          } : undefined,
        } : undefined,
      }, {
        onSuccess: () => {
          toast.success('Video generation started! Check the history tab for progress.');
        },
        onError: (error) => {
          toast.error('Failed to generate video. Please try again.');
        },
      });
    } catch (error) {
      console.error('Video generation error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Video className="h-6 w-6" />
          Generate Video
        </h2>
        <p className="text-muted-foreground">
          Create AI-powered videos with HailuoAI and optional audio
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Video Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="Describe the video you want to create..."
            className="min-h-[100px]"
            {...register('prompt')}
          />
          {errors.prompt && (
            <p className="text-sm text-destructive">{errors.prompt.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select
              onValueChange={(value) => {
                setValue('duration', value as '5' | '10');
                calculateCost();
              }}
              defaultValue="5"
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 seconds</SelectItem>
                <SelectItem value="10">10 seconds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aspectRatio">Aspect Ratio</Label>
            <Select
              onValueChange={(value) => setValue('aspectRatio', value as any)}
              defaultValue="16:9"
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                <SelectItem value="1:1">1:1 (Square)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="style">Visual Style</Label>
          <Select
            onValueChange={(value) => setValue('style', value as any)}
            defaultValue="realistic"
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="realistic">Realistic</SelectItem>
              <SelectItem value="animation">Animation</SelectItem>
              <SelectItem value="abstract">Abstract</SelectItem>
              <SelectItem value="artistic">Artistic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="includeAudio" className="text-base font-medium flex items-center gap-2">
                <Music className="h-4 w-4" />
                Include Audio
              </Label>
              <p className="text-sm text-muted-foreground">
                Add narration or background music to your video
              </p>
            </div>
            <Switch
              id="includeAudio"
              checked={includeAudio}
              onCheckedChange={(checked) => {
                setValue('includeAudio', checked);
                calculateCost();
              }}
            />
          </div>

          {includeAudio && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="audioType">Audio Type</Label>
                <Select
                  onValueChange={(value) => {
                    setValue('audioType', value as any);
                    calculateCost();
                  }}
                  defaultValue="tts"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tts">Text-to-Speech</SelectItem>
                    <SelectItem value="music">Background Music</SelectItem>
                    <SelectItem value="both">Both TTS & Music</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(audioType === 'tts' || audioType === 'both') && (
                <div className="space-y-2">
                  <Label htmlFor="ttsText">Narration Text</Label>
                  <Textarea
                    id="ttsText"
                    placeholder="Enter the text for narration..."
                    className="min-h-[80px]"
                    {...register('ttsText')}
                  />
                </div>
              )}

              {(audioType === 'music' || audioType === 'both') && (
                <div className="space-y-2">
                  <Label htmlFor="musicStyle">Music Style</Label>
                  <Input
                    id="musicStyle"
                    placeholder="e.g., upbeat electronic, calm piano, epic orchestral"
                    {...register('musicStyle')}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Estimated cost: <strong>${estimatedCost.toFixed(2)}</strong> per video
          </AlertDescription>
        </Alert>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Video...
          </>
        ) : (
          'Generate Video'
        )}
      </Button>
    </form>
  );
}