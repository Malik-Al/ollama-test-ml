import { Controller, Post, Body, HttpException, Sse, Query, Res } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatDto } from './dto';
import type { Response } from 'express';

@Controller('rag')
export class ChatController {
  constructor(
    private readonly ragService: ChatService
  ) {}

  @Post('ask')
  async ask(
    @Body() dto: ChatDto,
     @Res() res: Response
  ): Promise<any>  {
    console.log(`[START] ChatController method ask dto: ${JSON.stringify(dto)}`);
    try {
      const answer = await this.ragService.ask(dto);

      // return from(answer).pipe(map((chunk) => ({ data: chunk })));
      
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