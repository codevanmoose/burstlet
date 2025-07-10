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
import { AlertCircle, Loader2, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGenerateBlog } from '@/hooks/api/use-generation';
import { toast } from 'react-hot-toast';
import { Slider } from '@/components/ui/slider';

const blogGenerationSchema = z.object({
  topic: z.string().min(5, 'Topic must be at least 5 characters'),
  keywords: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'humorous', 'educational']),
  length: z.enum(['short', 'medium', 'long']),
  structure: z.enum(['standard', 'listicle', 'how-to', 'guide', 'opinion']),
  seoOptimized: z.boolean(),
  wordCount: z.number().min(300).max(3000),
});

type BlogGenerationFormData = z.infer<typeof blogGenerationSchema>;

export default function BlogGenerationForm() {
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [wordCount, setWordCount] = useState(800);
  const { mutate: generateBlog, isPending: isLoading } = useGenerateBlog();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BlogGenerationFormData>({
    resolver: zodResolver(blogGenerationSchema),
    defaultValues: {
      tone: 'professional',
      length: 'medium',
      structure: 'standard',
      seoOptimized: true,
      wordCount: 800,
    },
  });

  const length = watch('length');
  const seoOptimized = watch('seoOptimized');

  const calculateCost = (words: number) => {
    // Approximate cost based on tokens (1 word ≈ 1.3 tokens)
    const tokens = words * 1.3;
    const cost = (tokens / 1000) * 0.03; // GPT-4 pricing estimate
    setEstimatedCost(cost);
  };

  const handleWordCountChange = (value: number[]) => {
    const count = value[0];
    setWordCount(count);
    setValue('wordCount', count);
    calculateCost(count);
  };

  const onSubmit = async (data: BlogGenerationFormData) => {
    try {
      generateBlog({
        topic: data.topic,
        keywords: data.keywords?.split(',').map(k => k.trim()).filter(Boolean),
        tone: data.tone,
        length: data.length,
      }, {
        onSuccess: () => {
          toast.success('Blog post generation started! Check the history tab for progress.');
        },
        onError: (error) => {
          toast.error('Failed to generate blog post. Please try again.');
        },
      });
    } catch (error) {
      console.error('Blog generation error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Generate Blog Post
        </h2>
        <p className="text-muted-foreground">
          Create SEO-optimized blog posts with AI
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="topic">Blog Topic</Label>
          <Textarea
            id="topic"
            placeholder="What should the blog post be about?"
            className="min-h-[80px]"
            {...register('topic')}
          />
          {errors.topic && (
            <p className="text-sm text-destructive">{errors.topic.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="keywords">Keywords (Optional)</Label>
          <Input
            id="keywords"
            placeholder="SEO keywords, separated by commas"
            {...register('keywords')}
          />
          <p className="text-sm text-muted-foreground">
            Add specific keywords to optimize for search engines
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tone">Writing Tone</Label>
            <Select
              onValueChange={(value) => setValue('tone', value as any)}
              defaultValue="professional"
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="humorous">Humorous</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="structure">Blog Structure</Label>
            <Select
              onValueChange={(value) => setValue('structure', value as any)}
              defaultValue="standard"
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Article</SelectItem>
                <SelectItem value="listicle">Listicle</SelectItem>
                <SelectItem value="how-to">How-To Guide</SelectItem>
                <SelectItem value="guide">Complete Guide</SelectItem>
                <SelectItem value="opinion">Opinion Piece</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wordCount">
            Word Count: <span className="font-semibold">{wordCount}</span>
          </Label>
          <Slider
            id="wordCount"
            min={300}
            max={3000}
            step={100}
            value={[wordCount]}
            onValueChange={handleWordCountChange}
            className="py-4"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>300 words</span>
            <span>3000 words</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="length">Content Length</Label>
          <Select
            onValueChange={(value) => {
              setValue('length', value as any);
              // Update word count based on length
              const counts = { short: 500, medium: 800, long: 1500 };
              handleWordCountChange([counts[value as keyof typeof counts]]);
            }}
            defaultValue="medium"
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Short (300-600 words)</SelectItem>
              <SelectItem value="medium">Medium (600-1000 words)</SelectItem>
              <SelectItem value="long">Long (1000+ words)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Estimated cost: <strong>${estimatedCost.toFixed(3)}</strong> per blog post
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
            Generating Blog Post...
          </>
        ) : (
          'Generate Blog Post'
        )}
      </Button>
    </form>
  );
}