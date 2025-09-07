import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AddProfileDto, AskDto } from './dto';

@Controller('rag')
export class ChatController {
  constructor(private readonly ragService: ChatService) {}

  @Post('ask')
  async ask(
    @Body() dto: AskDto
  ) {
    try {
      const {question, userId, locale} = dto
      const answer = await this.ragService.ask(userId, question, locale);
      return { answer };
      
    } catch (error) {
        console.error('[ERROR] ChatController ask error', error);
        throw error
    }
  }

  @Post('add-profile')
  async addProfile(
    @Body() profile: AddProfileDto
  ) {
    try {
      await this.ragService.saveProfile(profile);
      return { status: 'ok' };
      
    } catch (error) {
        console.error('[ERROR] ChatController addProfile error', error);
        throw error
    }
  }
}
