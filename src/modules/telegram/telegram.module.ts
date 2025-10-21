import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { ChatService } from '../chat/chat.service';
import { ElasticService } from '../elastic/elastic.service';
import { EmbeddingService } from '../embedding/embedding.service';

@Module({
  providers: [
    TelegramService, 
    ChatService, 
    ElasticService,
    EmbeddingService
  ],
})
export class TelegramModule {}
