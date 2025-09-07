import { Module } from '@nestjs/common';
import { ElasticModule } from './modules/elastic/elastic.module';
import { ChatModule } from './modules/chat/chat.module';
import { EmbeddingModule } from './modules/embedding/embedding.module';

@Module({
  imports: [
    ElasticModule,
    EmbeddingModule,
    ChatModule
  ],
})
export class AppModule {}
