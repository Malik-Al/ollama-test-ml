// import { Controller, Post, Body } from '@nestjs/common';
// import { ChatService } from './chat.service';

// @Controller('chat')
// export class ChatController {
//   constructor(private readonly chatService: ChatService) {}

//   @Post()
//   async chat(@Body() body: { companyId: string, userId: string, question: string, locale: string }) {
//     const { companyId, userId, question, locale } = body;
//     return this.chatService.handleMessage(companyId, userId, question, locale);
//   }
// }




import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('rag')
export class ChatController {
  constructor(private readonly ragService: ChatService) {}

  @Post('ask')
  async ask(@Body('question') question: string) {
    const answer = await this.ragService.ask(question);
    return { answer };
  }

  @Post('add-profile')
  async addProfile(@Body() profile: any) {
    console.log('profile', profile);
    
    await this.ragService.saveProfile(profile);
    return { status: 'ok' };
  }
}


    // const text = `
    // Название: Оптима банк
    // Контакты: +996 312 90 59 59
    // Короткий номер: 9595
    // WhatsApp: 0990 90 59 59
    // Основные продукты: Visa, Элкарт, депозиты, кредиты
    // Мобильный банкинг: Optima24
    // Адрес: г. Бишкек, ул. Киевская 104а
    // `