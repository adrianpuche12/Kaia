/**
 * TTS Controller
 *
 * Handles text-to-speech conversion requests
 */

import { Request, Response } from 'express';
import { ttsService } from '../services/tts/TTSService';

const successResponse = (data: any, message?: string) => ({ success: true, message, data });
const asyncHandler = (fn: (req: Request, res: Response, next: any) => Promise<any>) =>
  (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export class TTSController {
  /**
   * POST /api/tts/speak - Convert text to speech
   * Body: { text: string, voice_id?: string, stability?: number, similarity_boost?: number }
   */
  static speak = asyncHandler(async (req: Request, res: Response) => {
    const { text, voice_id, stability, similarity_boost } = req.body;

    // Validate text
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text is required',
      });
    }

    // Call TTS service
    const result = await ttsService.speak(text, {
      voice_id,
      stability,
      similarity_boost,
    });

    // If client-fallback, return instruction
    if (result.provider === 'client-fallback') {
      return res.status(200).json({
        success: true,
        message: 'TTS not available - use client-side speech',
        data: {
          provider: 'client-fallback',
          text,
        },
      });
    }

    // Return audio file
    res.set({
      'Content-Type': result.contentType,
      'Content-Length': result.audio.length,
      'X-TTS-Provider': result.provider,
      'X-Characters-Used': result.charactersUsed.toString(),
    });

    res.send(result.audio);
  });

  /**
   * GET /api/tts/voices - Get available voices
   */
  static getVoices = asyncHandler(async (req: Request, res: Response) => {
    const voices = await ttsService.getAvailableVoices();
    res.status(200).json(successResponse({ voices }));
  });

  /**
   * GET /api/tts/status - Get TTS service status
   */
  static getStatus = asyncHandler(async (req: Request, res: Response) => {
    const isAvailable = ttsService.isAvailable();
    const provider = ttsService.getProviderName();
    const usage = ttsService.getUsageStats();

    res.status(200).json(
      successResponse({
        available: isAvailable,
        provider,
        usage,
      })
    );
  });
}

export default TTSController;
