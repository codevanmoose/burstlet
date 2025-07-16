'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Rocket, 
  Video, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTopViralTemplates } from '@/data/viral-templates';
import { useGenerateVideo } from '@/hooks/api/use-generation';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

export function QuickStartModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  const { mutate: generateVideo } = useGenerateVideo();

  useEffect(() => {
    // Check if user is new (no videos generated yet)
    const hasGeneratedVideo = localStorage.getItem('hasGeneratedVideo');
    if (!hasGeneratedVideo) {
      setIsOpen(true);
    }
  }, []);

  const topTemplates = getTopViralTemplates(3);

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setStep(1);
  };

  const handleGenerateVideo = () => {
    if (!selectedTemplate) return;
    
    setIsGenerating(true);
    
    generateVideo(
      {
        prompt: selectedTemplate.prompt,
        duration: '5',
        aspectRatio: '9:16', // Optimal for social media
        style: 'realistic',
        includeAudio: true,
        audioType: 'music',
        musicStyle: selectedTemplate.audio?.style || 'epic_buildup',
      },
      {
        onSuccess: () => {
          localStorage.setItem('hasGeneratedVideo', 'true');
          setStep(2);
          
          // Trigger confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
          
          toast.success('Your first viral video is being created!');
          
          setTimeout(() => {
            setIsOpen(false);
            router.push('/dashboard/content');
          }, 3000);
        },
        onError: () => {
          setIsGenerating(false);
          toast.error('Failed to generate video. Please try again.');
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 p-8 text-white">
          <div className="absolute inset-0 bg-black/20" />
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-3xl font-bold flex items-center gap-3">
              <Rocket className="h-8 w-8 animate-pulse" />
              Create Your First Viral Video in 60 Seconds!
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-8">
          <Progress value={(step + 1) * 33.33} className="mb-8" />

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">
                    Choose a Proven Viral Template
                  </h3>
                  <p className="text-muted-foreground">
                    These templates have generated millions of views. Pick one to start!
                  </p>
                </div>

                <div className="grid gap-4">
                  {topTemplates.map((template) => (
                    <Card 
                      key={template.id}
                      className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 hover:border-purple-500"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Video className="h-5 w-5 text-purple-500" />
                              {template.name}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {template.description}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="destructive" className="gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {template.viral_score}% Viral
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {template.estimated_views}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-center pt-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsOpen(false)}
                    className="text-muted-foreground"
                  >
                    I'll explore on my own
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 1 && selectedTemplate && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">
                    Ready to Create Your Viral Video?
                  </h3>
                  <p className="text-muted-foreground">
                    We'll generate your video using the "{selectedTemplate.name}" template
                  </p>
                </div>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-lg">What will be created:</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>AI-generated video based on viral template</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>Professional music and effects</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>Optimized for TikTok/YouTube Shorts (9:16)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <span>Ready in 2-3 minutes</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(0)}
                    disabled={isGenerating}
                  >
                    Back
                  </Button>
                  <Button 
                    className="flex-1 gap-2" 
                    onClick={handleGenerateVideo}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Generate My First Viral Video
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-8"
              >
                <div className="flex justify-center">
                  <div className="h-20 w-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="h-12 w-12 text-white" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    Awesome! Your Video is Being Created
                  </h3>
                  <p className="text-muted-foreground">
                    You're about to join creators getting millions of views!
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                  Redirecting to your content dashboard...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}