import { Module } from '@nestjs/common';
// import { ElasticModule } from './modules/elastic/elastic.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    // ElasticModule,
    ChatModule
  ],
})
export class AppModule {}
