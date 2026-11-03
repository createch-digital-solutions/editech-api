import { Injectable, Logger } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

@Injectable()
export class AiProvider {
  private readonly logger = new Logger(AiProvider.name);
  private model: LanguageModel | null = null;
  private isConfigured = false;

  constructor() {
    this.initModel();
  }

  private initModel() {
    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes('placeholder') || apiKey.length < 10) {
      this.logger.warn(
        'Google Gemini API key is missing or set to placeholder. AI features will run in mock/stub mode.',
      );
      this.isConfigured = false;
      return;
    }

    try {
      const google = createGoogleGenerativeAI({ apiKey });
      const modelName = process.env.AI_MODEL_NAME || 'gemini-1.5-flash';
      this.model = google(modelName);
      this.isConfigured = true;
      this.logger.log(`AI Provider initialized successfully with model: ${modelName}`);
    } catch (err) {
      this.logger.error('Failed to initialize AI Provider', err);
      this.isConfigured = false;
    }
  }

  getModel(): LanguageModel | null {
    if (!this.model) {
      this.initModel();
    }
    return this.model;
  }

  hasValidKey(): boolean {
    return this.isConfigured && this.model !== null;
  }
}
