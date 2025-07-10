import { AIProvider } from './base-provider';
import {
  GenerateVideoRequest,
  GenerateVideoResponse,
  GenerateBlogRequest,
  GenerateBlogResponse,
  GenerationError,
  GenerationErrorCode,
  ProviderCapability,
  UsageInfo,
} from '../types';

interface MiniMaxAudioRequest {
  text: string;
  voice_id?: string;
  speed?: number;
  pitch?: number;
  language?: string;
  format?: 'mp3' | 'wav' | 'pcm';
}

interface MiniMaxAudioResponse {
  audio_url: string;
  duration: number;
  format: string;
  file_size: number;
}

interface MiniMaxMusicRequest {
  prompt: string;
  duration: number;
  style?: string;
  mood?: string;
  instruments?: string[];
}

interface MiniMaxMusicResponse {
  music_url: string;
  duration: number;
  format: string;
  file_size: number;
}

export class MiniMaxProvider extends AIProvider {
  private apiKey: string;
  private baseUrl = 'https://api.minimax.chat/v1';

  constructor(config: { apiKey: string }) {
    super({
      name: 'MiniMax',
      version: '1.0.0',
      capabilities: [ProviderCapability.AUDIO],
    });
    this.apiKey = config.apiKey;
  }

  /**
   * Generate voiceover/narration audio
   */
  async generateVoiceover(request: {
    text: string;
    voice?: string;
    duration?: number;
  }): Promise<{
    audioUrl: string;
    duration: number;
    format: string;
  }> {
    this.validateConfig();

    try {
      const response = await fetch(`${this.baseUrl}/tts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: request.text,
          voice_id: request.voice || 'default',
          format: 'mp3',
        } as MiniMaxAudioRequest),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new GenerationError(
          error.message || 'MiniMax audio generation failed',
          GenerationErrorCode.PROVIDER_ERROR,
          { provider: 'MiniMax', details: error }
        );
      }

      const data: MiniMaxAudioResponse = await response.json();

      return {
        audioUrl: data.audio_url,
        duration: data.duration,
        format: data.format,
      };
    } catch (error) {
      if (error instanceof GenerationError) {
        throw error;
      }
      throw new GenerationError(
        'Failed to generate audio with MiniMax',
        GenerationErrorCode.PROVIDER_ERROR,
        { error }
      );
    }
  }

  /**
   * Generate background music
   */
  async generateBackgroundMusic(request: {
    prompt: string;
    duration: number;
    style?: string;
    mood?: string;
  }): Promise<{
    musicUrl: string;
    duration: number;
    format: string;
  }> {
    this.validateConfig();

    try {
      const response = await fetch(`${this.baseUrl}/music/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          duration: request.duration,
          style: request.style,
          mood: request.mood,
        } as MiniMaxMusicRequest),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new GenerationError(
          error.message || 'MiniMax music generation failed',
          GenerationErrorCode.PROVIDER_ERROR,
          { provider: 'MiniMax', details: error }
        );
      }

      const data: MiniMaxMusicResponse = await response.json();

      return {
        musicUrl: data.music_url,
        duration: data.duration,
        format: data.format,
      };
    } catch (error) {
      if (error instanceof GenerationError) {
        throw error;
      }
      throw new GenerationError(
        'Failed to generate music with MiniMax',
        GenerationErrorCode.PROVIDER_ERROR,
        { error }
      );
    }
  }

  /**
   * Generate audio effects or sound design
   */
  async generateSoundEffects(request: {
    description: string;
    duration?: number;
    category?: string;
  }): Promise<{
    soundUrl: string;
    duration: number;
    format: string;
  }> {
    this.validateConfig();

    try {
      const response = await fetch(`${this.baseUrl}/sfx/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.description,
          duration: request.duration || 5,
          category: request.category,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new GenerationError(
          error.message || 'MiniMax sound effect generation failed',
          GenerationErrorCode.PROVIDER_ERROR,
          { provider: 'MiniMax', details: error }
        );
      }

      const data = await response.json();

      return {
        soundUrl: data.sound_url,
        duration: data.duration,
        format: data.format,
      };
    } catch (error) {
      if (error instanceof GenerationError) {
        throw error;
      }
      throw new GenerationError(
        'Failed to generate sound effects with MiniMax',
        GenerationErrorCode.PROVIDER_ERROR,
        { error }
      );
    }
  }

  /**
   * Get available voices
   */
  async getAvailableVoices(): Promise<Array<{
    id: string;
    name: string;
    language: string;
    gender: string;
    preview_url?: string;
  }>> {
    this.validateConfig();

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new GenerationError(
          'Failed to fetch available voices',
          GenerationErrorCode.PROVIDER_ERROR
        );
      }

      const data = await response.json();
      return data.voices;
    } catch (error) {
      if (error instanceof GenerationError) {
        throw error;
      }
      throw new GenerationError(
        'Failed to get available voices',
        GenerationErrorCode.PROVIDER_ERROR,
        { error }
      );
    }
  }

  /**
   * Estimate audio generation cost
   */
  async estimateAudioCost(request: {
    text?: string;
    duration?: number;
    type: 'voiceover' | 'music' | 'sfx';
  }): Promise<UsageInfo> {
    // MiniMax pricing (example rates)
    const pricing = {
      voiceover: 0.006, // $0.006 per 1000 characters
      music: 0.02,      // $0.02 per second
      sfx: 0.01,        // $0.01 per second
    };

    let estimatedCost = 0;
    let credits = 0;

    switch (request.type) {
      case 'voiceover':
        const characters = request.text?.length || 0;
        credits = Math.ceil(characters / 1000);
        estimatedCost = credits * pricing.voiceover;
        break;
      case 'music':
      case 'sfx':
        const duration = request.duration || 30;
        credits = duration;
        estimatedCost = duration * pricing[request.type];
        break;
    }

    return {
      creditsUsed: credits,
      creditsRemaining: 0, // Would need to fetch from API
      costEstimate: estimatedCost,
    };
  }

  // These methods are required by AIProvider but not used for audio
  async generateVideo(request: GenerateVideoRequest): Promise<GenerateVideoResponse> {
    throw new GenerationError(
      'MiniMax provider does not support video generation',
      GenerationErrorCode.UNSUPPORTED_FEATURE
    );
  }

  async generateBlog(request: GenerateBlogRequest): Promise<GenerateBlogResponse> {
    throw new GenerationError(
      'MiniMax provider does not support blog generation',
      GenerationErrorCode.UNSUPPORTED_FEATURE
    );
  }

  protected validateConfig(): void {
    if (!this.apiKey) {
      throw new GenerationError(
        'MiniMax API key is required',
        GenerationErrorCode.INVALID_CONFIG
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getAvailableVoices();
      return true;
    } catch {
      return false;
    }
  }
}