import { PostHog } from 'posthog-node';

/**
 * PostHog Server Telemetry Wrapper
 */
export class PostHogClientWrapper {
  private client: PostHog | null = null;

  constructor() {
    const apiKey = process.env.POSTHOG_API_KEY;
    const host = process.env.POSTHOG_HOST || 'https://app.posthog.com';
    if (apiKey && !apiKey.includes('placeholder')) {
      this.client = new PostHog(apiKey, { host });
    }
  }

  // TODO: Capture server-side events in Phase 6
  capture(params: {
    distinctId: string;
    event: string;
    properties?: Record<string, unknown>;
  }): void {
    if (this.client) {
      this.client.capture(params);
    }
  }
}

export const posthogClient = new PostHogClientWrapper();
