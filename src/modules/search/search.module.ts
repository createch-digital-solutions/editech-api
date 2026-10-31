import { Module, Global } from '@nestjs/common';
import { MeilisearchService } from './meilisearch.service.js';

@Global()
@Module({
  providers: [MeilisearchService],
  exports: [MeilisearchService],
})
export class SearchModule {}
