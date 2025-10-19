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
    console.log(`[START] ChatController method ask dto: ${JSON.stringify(dto)}`);
    try {
      const answer = await this.ragService.ask(dto);
      
      return { 
        status: 200,
        success: true,
        data: answer 
      };
      
    } catch (error) {
       throw error
    }
  }
}