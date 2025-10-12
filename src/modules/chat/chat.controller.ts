import { Controller, Post, Body, HttpException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatDto } from './dto';

@Controller('rag')
export class ChatController {
  constructor(
    private readonly ragService: ChatService
  ) {}

  @Post('ask')
  async ask(
    @Body() dto: ChatDto
  ) {
    try {
      const answer = await this.ragService.ask(dto);
      return { answer };
      
    } catch (error) {
       throw error
    }
  }
}