import { HailuoAIProvider } from './hailuoai';
import { MiniMaxProvider } from '../../../modules/ai-generation/providers/minimax-provider';
import { VideoSynthesisService } from '../../../modules/ai-generation/services/video-synthesis.service';
import { GenerationResult } from './base';
import { ProviderError } from '../types';

export interface VideoWithAudioParams {
  // Video parameters
  prompt: string;
  style?: string;
  duration?: number;
  aspectRatio?: string;
  quality?: string;
  
  // Audio parameters
  voiceover?: {
    text: string;
    voice?: string;
    language?: string;
  };
  backgroundMusic?: {
    prompt: string;
    mood?: string;
    style?: string;
  };
  soundEffects?: Array<{
    description: string;
    startTime: number;
    duration?: number;
  }>;
}

export class HailuoAIWithAudioProvider extends HailuoAIProvider {
  private minimax: MiniMaxProvider;
  private synthesizer: VideoSynthesisService;

  constructor(config: any) {
    super(config);
    
    this.minimax = new MiniMaxProvider({
      apiKey: process.env.MINIMAX_API_KEY!,
    });
    
    this.synthesizer = new VideoSynthesisService({
      tempDir: process.env.TEMP_DIR || '/tmp/burstlet/synthesis',
      outputDir: process.env.OUTPUT_DIR || '/tmp/burstlet/output',
    });
  }

  /**
   * Generate video with synchronized audio
   */
  async generateVideoWithAudio(params: VideoWithAudioParams): Promise<GenerationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    try {
      // Step 1: Generate the video
      console.log('Generating video with HailuoAI...');
      const videoResult = await this.generateVideo({
        prompt: params.prompt,
        style: params.style,
        duration: params.duration,
        aspectRatio: params.aspectRatio,
        quality: params.quality,
      });

      if (!videoResult.success || !videoResult.data?.id) {
        throw new ProviderError(
          'Failed to generate video',
          this.getName(),
          videoResult.error
        );
      }

      // Wait for video to be ready
      let videoStatus = videoResult.data;
      while (videoStatus.status === 'pending' || videoStatus.status === 'processing') {
        await this.sleep(5000); // Check every 5 seconds
        const statusResult = await this.getVideoStatus(videoResult.data.id);
        if (statusResult.success && statusResult.data) {
          videoStatus = statusResult.data;
        }
      }

      if (videoStatus.status !== 'completed' || !videoStatus.videoUrl) {
        throw new ProviderError(
          'Video generation failed',
          this.getName(),
          videoStatus.error
        );
      }

      // Step 2: Generate audio components
      const audioUrls: { type: string; url: string }[] = [];

      // Generate voiceover if requested
      if (params.voiceover?.text) {
        console.log('Generating voiceover with MiniMax...');
        try {
          const voiceoverResult = await this.minimax.generateVoiceover({
            text: params.voiceover.text,
            voice: params.voiceover.voice,
            duration: videoStatus.duration,
          });
          audioUrls.push({ type: 'voiceover', url: voiceoverResult.audioUrl });
        } catch (error) {
          errors.push(`Voiceover generation failed: ${error}`);
        }
      }

      // Generate background music if requested
      if (params.backgroundMusic?.prompt) {
        console.log('Generating background music with MiniMax...');
        try {
          const musicResult = await this.minimax.generateBackgroundMusic({
            prompt: params.backgroundMusic.prompt,
            duration: videoStatus.duration || params.duration || 15,
            style: params.backgroundMusic.style,
            mood: params.backgroundMusic.mood,
          });
          audioUrls.push({ type: 'music', url: musicResult.musicUrl });
        } catch (error) {
          errors.push(`Music generation failed: ${error}`);
        }
      }

      // If no audio was generated, return the video as is
      if (audioUrls.length === 0) {
        const processingTime = Date.now() - startTime;
        return {
          success: true,
          data: videoStatus,
          metadata: {
            processingTime,
            cost: this.estimateTotalCost(params, videoStatus.duration || 15),
            provider: `${this.getName()} + MiniMax`,
            model: this.config.model,
            errors: errors.length > 0 ? errors : undefined,
          },
        };
      }

      // Step 3: Synthesize video with audio
      console.log('Synthesizing video with audio...');
      const synthesisResult = await this.synthesizer.synthesizeVideo({
        videoUrl: videoStatus.videoUrl,
        audioUrl: audioUrls.find(a => a.type === 'voiceover')?.url,
        musicUrl: audioUrls.find(a => a.type === 'music')?.url,
        outputFormat: 'mp4',
      });

      // Step 4: Optimize for platforms if needed
      const optimizedUrls: Record<string, string> = {};
      if (params.aspectRatio === '9:16') {
        // Optimize for TikTok/Instagram Reels
        const tiktokPath = await this.synthesizer.optimizeForPlatform(
          synthesisResult.outputUrl,
          'tiktok'
        );
        optimizedUrls.tiktok = tiktokPath;
      } else if (params.aspectRatio === '1:1') {
        // Optimize for Instagram feed
        const instagramPath = await this.synthesizer.optimizeForPlatform(
          synthesisResult.outputUrl,
          'instagram'
        );
        optimizedUrls.instagram = instagramPath;
      }

      // Generate thumbnail
      const thumbnailUrl = await this.synthesizer.generateThumbnail(
        synthesisResult.outputUrl,
        Math.floor(synthesisResult.duration / 2) // Middle of video
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          id: videoStatus.id,
          status: 'completed',
          videoUrl: synthesisResult.outputUrl,
          thumbnailUrl,
          duration: synthesisResult.duration,
          aspectRatio: params.aspectRatio,
          quality: params.quality,
          hasAudio: true,
          audioTracks: audioUrls.map(a => a.type),
          optimizedUrls,
          fileSize: synthesisResult.fileSize,
        },
        metadata: {
          processingTime,
          cost: this.estimateTotalCost(params, synthesisResult.duration),
          provider: `${this.getName()} + MiniMax`,
          model: this.config.model,
          errors: errors.length > 0 ? errors : undefined,
        },
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

      if (error instanceof ProviderError) {
        return {
          success: false,
          error: error.message,
          metadata: {
            processingTime,
            cost: 0,
            provider: `${this.getName()} + MiniMax`,
            errors,
          },
        };
      }

      throw error;
    }
  }

  /**
   * Generate script from prompt using AI
   */
  async generateScriptFromPrompt(prompt: string, duration: number): Promise<{
    narration: string;
    musicDescription: string;
    soundEffects: Array<{ description: string; timing: string }>;
  }> {
    // This would use OpenAI or another text AI to generate a script
    // For now, returning a simple example
    return {
      narration: `Welcome to an amazing journey. ${prompt}. This is just the beginning of something incredible.`,
      musicDescription: 'Upbeat, inspiring electronic music with a modern feel',
      soundEffects: [
        { description: 'Whoosh transition', timing: '0:02' },
        { description: 'Digital beep', timing: '0:05' },
      ],
    };
  }

  /**
   * Estimate total cost including video and audio
   */
  private estimateTotalCost(params: VideoWithAudioParams, duration: number): number {
    let totalCost = this.estimateCost(duration, params.quality || 'standard');

    // Add audio costs
    if (params.voiceover?.text) {
      const characters = params.voiceover.text.length;
      totalCost += (characters / 1000) * 0.006; // MiniMax TTS pricing
    }

    if (params.backgroundMusic) {
      totalCost += duration * 0.02; // MiniMax music pricing
    }

    if (params.soundEffects) {
      totalCost += params.soundEffects.length * 0.01; // MiniMax SFX pricing
    }

    // Add synthesis processing cost
    totalCost += 0.05; // Fixed cost for video processing

    return totalCost;
  }

  /**
   * Get supported audio features
   */
  getSupportedAudioFeatures(): {
    voiceover: boolean;
    backgroundMusic: boolean;
    soundEffects: boolean;
    languages: string[];
    voices: string[];
    musicStyles: string[];
  } {
    return {
      voiceover: true,
      backgroundMusic: true,
      soundEffects: true,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
      voices: ['male-1', 'male-2', 'female-1', 'female-2', 'child', 'narrator'],
      musicStyles: ['upbeat', 'calm', 'dramatic', 'electronic', 'acoustic', 'cinematic'],
    };
  }
}