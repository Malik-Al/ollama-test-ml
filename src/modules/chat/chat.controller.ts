import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('rag')
export class ChatController {
  constructor(private readonly ragService: ChatService) {}

  @Post('ask')
  async ask(@Body() dto: any) {
    const {question} = dto
    const answer = await this.ragService.ask(question);
    return { answer };
  }
}