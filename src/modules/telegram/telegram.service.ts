import { Injectable, OnModuleInit } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { ChatService } from '../chat/chat.service';
const botToken = '7446963235:AAE5ZH4hE5dIIac-ILyajuaDKh2rS4ZDNsE'

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: TelegramBot;

  constructor(
    private readonly chatService: ChatService,
  ) {}

  onModuleInit() {
    this.bot = new TelegramBot(botToken, { polling: true });
    console.log('✅ Telegram Bot запущен и слушает сообщения');

    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id; 
      const text = msg.text?.trim();

      if (!text) return;

      if (text === '/start') {
        await this.bot.sendMessage(chatId, 'Привет! Чем я могу помочь? 🤖');
        return;
      }

      await this.handleStreamAnswer(chatId, userId, text);
    });
  }


  private async handleStreamAnswer(chatId: number, userId: number, text: string) {
    try {
        const interval = setInterval(() => {
          this.bot.sendChatAction(chatId, 'typing');
        }, 2000);

        let message = await this.chatService.ask({ question: text , bank_id: String(userId), company_id: 'cf2b4bfb-382a-4702-b489-e8dda8cacc7b'})
        
      // let fullAnswer = ''; 
      // for await (const chunk of this.chatService.ask({ question: text , bank_id: String(userId), company_id: 'cf2b4bfb-382a-4702-b489-e8dda8cacc7b'})) {
      //   fullAnswer += chunk + ' ';
      //   // можно редактировать сообщение, а не спамить новыми
      //   if (!fullAnswer) continue;

      //   if (fullAnswer.length < 4096) {
      //     message += chunk;
      //   } else {
      //     // чтобы избежать лимита в 4096 символов
      //     await this.bot.sendMessage(chatId, '⚠️ Сообщение слишком длинное, обрезано.');
      //     break;
      //   }
      // }

      console.log('handleStreamAnswer message', message);
      
      clearInterval(interval);
      await this.bot.sendMessage(chatId, message);
      await this.bot.sendChatAction(chatId, 'cancel');
    } catch (err) {
      console.error('[Telegram Bot Error]', err);
      await this.bot.sendMessage(chatId, '❌ Ошибка при получении ответа от ИИ.');
    }
  }
}
