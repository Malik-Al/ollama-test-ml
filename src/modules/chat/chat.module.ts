import { Module } from '@nestjs/common';
import { ElasticModule } from '../elastic/elastic.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { EmbeddingModule } from '../embedding/embedding.module';

@Module({
  imports: [
    ElasticModule, 
    EmbeddingModule
  ],
  providers: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
