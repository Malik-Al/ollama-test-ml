import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { ElasticService } from '../elastic/elastic.service';
import { EmbeddingService } from '../embedding/embedding.service';

@Module({
  controllers: [UploadController],
  providers: [
    UploadService,
    ElasticService,
    EmbeddingService
  ]
})
export class UploadModule {}