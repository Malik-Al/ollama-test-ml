import { Module } from '@nestjs/common';
import { ElasticModule } from '../elastic/elastic.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [ElasticModule], // подключаем ElasticService
  providers: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
