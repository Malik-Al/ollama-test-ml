import { Module } from '@nestjs/common';
import { ElasticModule } from './modules/elastic/elastic.module';
import { ChatModule } from './modules/chat/chat.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    ElasticModule,
    UploadModule,
    ChatModule,
  ],
})
export class AppModule {}
