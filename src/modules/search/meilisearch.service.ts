import { Injectable, Logger } from '@nestjs/common';
import { Meilisearch } from 'meilisearch';

export interface CourseSearchDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  instructorName?: string;
  published: boolean;
}

@Injectable()
export class MeilisearchService {
  private readonly logger = new Logger(MeilisearchService.name);
  private client: Meilisearch | null = null;
  private readonly coursesIndex = 'courses';

  constructor() {
    const host = process.env.MEILISEARCH_HOST;
    const apiKey =
      process.env.MEILI_MASTER_KEY ||
      process.env.MEILISEARCH_KEY ||
      process.env.MEILISEARCH_API_KEY;

    if (host && apiKey && !apiKey.includes('placeholder')) {
      try {
        this.client = new Meilisearch({ host, apiKey });
        this.logger.log(`Meilisearch connected at: ${host}`);
      } catch (err) {
        this.logger.warn(`Could not connect to Meilisearch at ${host}: ${err}`);
      }
    } else {
      this.logger.log('Meilisearch running in development stub mode.');
    }
  }

  /**
   * Fast typo-tolerant search across indexed courses (Phase 14 Table 4)
   */
  async searchCourses(
    query: string,
    options: { limit?: number; offset?: number } = {},
  ) {
    if (!this.client) {
      this.logger.warn(`Meilisearch stub search called for query: "${query}"`);
      return {
        hits: [],
        query,
        limit: options.limit || 20,
        offset: options.offset || 0,
        estimatedTotalHits: 0,
        mode: 'stub',
      };
    }

    try {
      const index = this.client.index<CourseSearchDocument>(this.coursesIndex);
      return await index.search(query, {
        limit: options.limit || 20,
        offset: options.offset || 0,
      });
    } catch (err) {
      this.logger.error(`Meilisearch search error: ${err}`);
      return { hits: [], query, estimatedTotalHits: 0 };
    }
  }

  /**
   * Synchronize or update a course in the search index
   */
  async indexCourse(doc: CourseSearchDocument) {
    if (!this.client) {
      this.logger.log(`[Stub] Course indexed: ${doc.id} - "${doc.title}"`);
      return { success: true, stub: true };
    }

    try {
      const index = this.client.index<CourseSearchDocument>(this.coursesIndex);
      await index.addDocuments([doc], { primaryKey: 'id' });
      return { success: true };
    } catch (err) {
      this.logger.error(`Failed to index course ${doc.id}: ${err}`);
      return { success: false, error: String(err) };
    }
  }

  /**
   * Remove a course from the search index (e.g. unpublish or delete)
   */
  async removeCourse(courseId: string) {
    if (!this.client) return { success: true, stub: true };
    try {
      const index = this.client.index(this.coursesIndex);
      await index.deleteDocument(courseId);
      return { success: true };
    } catch (err) {
      this.logger.error(
        `Failed to remove course ${courseId} from index: ${err}`,
      );
      return { success: false };
    }
  }
}
