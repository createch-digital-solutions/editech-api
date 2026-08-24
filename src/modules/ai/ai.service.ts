import { Injectable } from '@nestjs/common';
import { openAiClient } from '../../common/clients/openai.client.js';
import { anthropicClient } from '../../common/clients/anthropic.client.js';

@Injectable()
export class AiService {
  getHealth() {
    return { status: 'ok', module: 'ai' };
  }

  // TODO: Connect OpenAI course generation workflow in Phase 6
  async generateCoursePlan(prompt: string) {
    return openAiClient.generateCourseOutline(prompt);
  }

  // TODO: Connect Anthropic Claude tutoring stream in Phase 6
  async streamTutor(messages: unknown[]) {
    return anthropicClient.streamTutorResponse(messages);
  }
}
