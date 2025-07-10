import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { GenerationError, GenerationErrorCode } from '../types';

const execAsync = promisify(exec);

export interface VideoSynthesisOptions {
  videoUrl: string;
  audioUrl?: string;
  musicUrl?: string;
  soundEffects?: Array<{
    url: string;
    startTime: number;
    volume?: number;
  }>;
  outputFormat?: 'mp4' | 'mov' | 'webm';
  videoCodec?: string;
  audioCodec?: string;
  bitrate?: string;
}

export interface SynthesisResult {
  outputUrl: string;
  duration: number;
  fileSize: number;
  format: string;
}

export class VideoSynthesisService {
  private tempDir: string;
  private outputDir: string;

  constructor(config: {
    tempDir?: string;
    outputDir?: string;
  }) {
    this.tempDir = config.tempDir || '/tmp/burstlet/synthesis';
    this.outputDir = config.outputDir || '/tmp/burstlet/output';
  }

  /**
   * Combine video with audio tracks
   */
  async synthesizeVideo(options: VideoSynthesisOptions): Promise<SynthesisResult> {
    const sessionId = uuidv4();
    const sessionDir = path.join(this.tempDir, sessionId);
    
    try {
      // Create session directory
      await fs.mkdir(sessionDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });

      // Download files
      const videoPath = await this.downloadFile(options.videoUrl, sessionDir, 'video');
      const audioPaths: string[] = [];

      if (options.audioUrl) {
        audioPaths.push(await this.downloadFile(options.audioUrl, sessionDir, 'voiceover'));
      }

      if (options.musicUrl) {
        audioPaths.push(await this.downloadFile(options.musicUrl, sessionDir, 'music'));
      }

      // Get video info
      const videoInfo = await this.getVideoInfo(videoPath);
      
      // Process audio if multiple tracks
      let finalAudioPath: string | null = null;
      if (audioPaths.length > 0) {
        finalAudioPath = await this.mixAudioTracks(audioPaths, sessionDir, videoInfo.duration);
      }

      // Combine video and audio
      const outputPath = await this.combineVideoAudio(
        videoPath,
        finalAudioPath,
        sessionDir,
        options
      );

      // Get output info
      const outputInfo = await this.getVideoInfo(outputPath);

      // Move to output directory
      const finalOutputName = `${sessionId}.${options.outputFormat || 'mp4'}`;
      const finalOutputPath = path.join(this.outputDir, finalOutputName);
      await fs.rename(outputPath, finalOutputPath);

      // Cleanup temp files
      await this.cleanup(sessionDir);

      return {
        outputUrl: `/output/${finalOutputName}`,
        duration: outputInfo.duration,
        fileSize: outputInfo.fileSize,
        format: options.outputFormat || 'mp4',
      };
    } catch (error) {
      // Cleanup on error
      await this.cleanup(sessionDir).catch(() => {});
      
      throw new GenerationError(
        'Failed to synthesize video',
        GenerationErrorCode.PROCESSING_ERROR,
        { error }
      );
    }
  }

  /**
   * Download file from URL
   */
  private async downloadFile(url: string, dir: string, prefix: string): Promise<string> {
    const extension = path.extname(url) || '.mp4';
    const filename = `${prefix}_${Date.now()}${extension}`;
    const filepath = path.join(dir, filename);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    await fs.writeFile(filepath, Buffer.from(buffer));

    return filepath;
  }

  /**
   * Get video information using ffprobe
   */
  private async getVideoInfo(videoPath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    fps: number;
    fileSize: number;
  }> {
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`
    );

    const info = JSON.parse(stdout);
    const videoStream = info.streams.find((s: any) => s.codec_type === 'video');
    const stats = await fs.stat(videoPath);

    return {
      duration: parseFloat(info.format.duration),
      width: videoStream.width,
      height: videoStream.height,
      fps: eval(videoStream.r_frame_rate), // e.g., "30/1" -> 30
      fileSize: stats.size,
    };
  }

  /**
   * Mix multiple audio tracks
   */
  private async mixAudioTracks(
    audioPaths: string[],
    sessionDir: string,
    videoDuration: number
  ): Promise<string> {
    const outputPath = path.join(sessionDir, 'mixed_audio.mp3');

    if (audioPaths.length === 1) {
      // Single audio track - just ensure it matches video duration
      const command = `ffmpeg -i "${audioPaths[0]}" -t ${videoDuration} -c:a libmp3lame -b:a 192k "${outputPath}"`;
      await execAsync(command);
      return outputPath;
    }

    // Multiple audio tracks - mix them
    const inputs = audioPaths.map(p => `-i "${p}"`).join(' ');
    const filterComplex = audioPaths
      .map((_, i) => `[${i}:a]`)
      .join('') + `amix=inputs=${audioPaths.length}:duration=first:dropout_transition=3[out]`;

    const command = `ffmpeg ${inputs} -filter_complex "${filterComplex}" -map "[out]" -t ${videoDuration} -c:a libmp3lame -b:a 192k "${outputPath}"`;
    
    await execAsync(command);
    return outputPath;
  }

  /**
   * Combine video and audio
   */
  private async combineVideoAudio(
    videoPath: string,
    audioPath: string | null,
    sessionDir: string,
    options: VideoSynthesisOptions
  ): Promise<string> {
    const outputFormat = options.outputFormat || 'mp4';
    const outputPath = path.join(sessionDir, `output.${outputFormat}`);

    let command: string;

    if (audioPath) {
      // Video with audio
      command = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v ${options.videoCodec || 'libx264'} -c:a ${options.audioCodec || 'aac'} -b:v ${options.bitrate || '2M'} -shortest "${outputPath}"`;
    } else {
      // Video only (no audio)
      command = `ffmpeg -i "${videoPath}" -c:v ${options.videoCodec || 'libx264'} -b:v ${options.bitrate || '2M'} "${outputPath}"`;
    }

    await execAsync(command);
    return outputPath;
  }

  /**
   * Add watermark to video
   */
  async addWatermark(
    videoPath: string,
    watermarkPath: string,
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'bottom-right'
  ): Promise<string> {
    const outputPath = videoPath.replace(/\.[^.]+$/, '_watermarked.mp4');
    
    const positions = {
      'top-left': 'overlay=10:10',
      'top-right': 'overlay=W-w-10:10',
      'bottom-left': 'overlay=10:H-h-10',
      'bottom-right': 'overlay=W-w-10:H-h-10',
    };

    const command = `ffmpeg -i "${videoPath}" -i "${watermarkPath}" -filter_complex "${positions[position]}" -codec:a copy "${outputPath}"`;
    
    await execAsync(command);
    return outputPath;
  }

  /**
   * Optimize video for platform
   */
  async optimizeForPlatform(
    videoPath: string,
    platform: 'youtube' | 'tiktok' | 'instagram' | 'twitter'
  ): Promise<string> {
    const outputPath = videoPath.replace(/\.[^.]+$/, `_${platform}.mp4`);
    
    const platformSettings = {
      youtube: {
        resolution: '1920x1080',
        bitrate: '8M',
        fps: 30,
      },
      tiktok: {
        resolution: '1080x1920', // 9:16 vertical
        bitrate: '4M',
        fps: 30,
      },
      instagram: {
        resolution: '1080x1080', // 1:1 square
        bitrate: '5M',
        fps: 30,
      },
      twitter: {
        resolution: '1280x720',
        bitrate: '5M',
        fps: 30,
      },
    };

    const settings = platformSettings[platform];
    const command = `ffmpeg -i "${videoPath}" -vf "scale=${settings.resolution}:force_original_aspect_ratio=decrease,pad=${settings.resolution}:(ow-iw)/2:(oh-ih)/2" -r ${settings.fps} -b:v ${settings.bitrate} -c:a aac -b:a 192k "${outputPath}"`;
    
    await execAsync(command);
    return outputPath;
  }

  /**
   * Generate thumbnail from video
   */
  async generateThumbnail(
    videoPath: string,
    timestamp: number = 0
  ): Promise<string> {
    const thumbnailPath = videoPath.replace(/\.[^.]+$/, '_thumbnail.jpg');
    const command = `ffmpeg -i "${videoPath}" -ss ${timestamp} -vframes 1 -q:v 2 "${thumbnailPath}"`;
    
    await execAsync(command);
    return thumbnailPath;
  }

  /**
   * Cleanup temporary files
   */
  private async cleanup(dir: string): Promise<void> {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}