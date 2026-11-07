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

    const modelName = this.getModelName();

    if (!apiKey || apiKey.includes('placeholder') || apiKey.length < 10) {
      this.logger.warn(
        `Google Gemini API key is missing or set to placeholder. AI features will run in mock/stub mode. (Expected model: ${modelName})`,
      );
      this.isConfigured = false;
      return;
    }

    try {
      const google = createGoogleGenerativeAI({ apiKey });
      this.model = google(modelName);
      this.isConfigured = true;
      this.logger.log(`AI Provider initialized successfully with model: ${modelName} (Key prefix: ${apiKey.slice(0, 6)}...)`);
    } catch (err) {
      this.logger.error(`Failed to initialize AI Provider with model ${modelName}`, err);
      this.isConfigured = false;
    }
  }

  getModel(): LanguageModel | null {
    if (!this.model && this.isConfigured) {
      this.initModel();
    }
    return this.model;
  }

  getModelName(): string {
    return process.env.AI_MODEL_NAME || 'gemini-2.5-flash';
  }

  hasValidKey(): boolean {
    return this.isConfigured && this.model !== null;
  }
}
