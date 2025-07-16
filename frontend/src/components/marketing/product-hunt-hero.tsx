'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  TrendingUp, 
  Video, 
  CheckCircle2,
  ArrowRight,
  Zap,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ProductHuntHero() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    {
      title: "Choose Viral Template",
      description: "MrBeast Challenge Selected",
      icon: Sparkles,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "AI Generates Video",
      description: "Creating your content...",
      icon: Video,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Ready to Go Viral!",
      description: "2.3M views predicted",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentStep === 1) {
      // Simulate progress during generation
      setProgress(0);
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 250);
      
      return () => clearInterval(progressInterval);
    }
  }, [currentStep]);

  return (
    <div className="w-[800px] h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 p-8 flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Create Viral Videos in 2 Minutes
        </h1>
        <p className="text-gray-600 text-lg">
          AI-powered content that gets millions of views
        </p>
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Step Indicators */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center ${
                index < steps.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div
                className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                  index <= currentStep
                    ? 'bg-gradient-to-r ' + step.color + ' text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <step.icon className="h-6 w-6" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 mx-2 bg-gray-200 rounded">
                  <div
                    className={`h-full bg-gradient-to-r ${step.color} rounded transition-all duration-1000`}
                    style={{
                      width: index < currentStep ? '100%' : '0%'
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Content Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl shadow-xl p-8"
          >
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Select a Template</h3>
                  <Badge variant="destructive" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    95% Viral
                  </Badge>
                </div>
                <Card className="p-4 border-2 border-purple-500 bg-purple-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <Video className="h-4 w-4 text-purple-600" />
                        MrBeast Style Challenge
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Epic challenge with surprising twists
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">1M-10M views</span>
                  </div>
                </Card>
                <Button className="w-full gap-2" size="lg">
                  <Zap className="h-4 w-4" />
                  Generate Video
                </Button>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center">Generating Your Video</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">HailuoAI</div>
                    <p className="text-sm text-gray-600">Video Generation</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">MiniMax</div>
                    <p className="text-sm text-gray-600">Audio Synthesis</p>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-500">
                  Estimated time: 2-3 minutes
                </p>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold">Video Ready!</h3>
                <div className="flex justify-center gap-4 my-4">
                  <Badge variant="outline" className="gap-1 px-3 py-1">
                    <Eye className="h-3 w-3" />
                    2.3M predicted views
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    Cost: $0.50
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-6">
                  {['TikTok', 'YouTube', 'Instagram', 'Twitter'].map((platform) => (
                    <Button key={platform} variant="outline" size="sm">
                      {platform}
                    </Button>
                  ))}
                </div>
                <Button className="w-full gap-2 mt-4" size="lg">
                  Publish to All Platforms
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Stats Bar */}
        <div className="flex justify-center gap-8 mt-8">
          <div className="text-center">
            <div className="text-2xl font-bold">500K+</div>
            <p className="text-sm text-gray-600">Videos Created</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">2.5B+</div>
            <p className="text-sm text-gray-600">Total Views</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">$0.50</div>
            <p className="text-sm text-gray-600">Per Video</p>
          </div>
        </div>
      </div>
    </div>
  );
}