import { Injectable, OnModuleInit } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { ChatService } from '../chat/chat.service';
const botToken = '7446963235:AAE5ZH4hE5dIIac-ILyajuaDKh2rS4ZDNsE'
import { translate } from '@vitalets/google-translate-api';


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

      // const firstName = msg.from?.first_name || '';
      // const username = msg.from?.username || '';

      if (!text) return;

      if (text === '/start') {
        await this.bot.sendMessage(chatId, 'Привет! Чем я могу помочь? 🤖');
        await this.bot.sendMessage(chatId, 'Hi! How can I help you? 🤖');
        await this.bot.sendMessage(chatId, 'Салам! Мен кантип жардам бере алам 🤖');
        return;
      }

      await this.handleStreamAnswer(chatId, userId, text);
    });
  }


  private async handleStreamAnswer(chatId: number, userId: number, question: string) {
    try {
        const interval = setInterval(() => {
          this.bot.sendChatAction(chatId, 'typing');
        }, 2000);

        // const result = translate(question, { to: 'ru' });
        // const {raw, text} = (await result)

        // const answerLang = raw.src;

        // console.log('Translated text:', text);
        // console.log('src', answerLang);
        console.log('question', question);

        let message = await this.chatService.ask({ question: question, bank_id: String(userId), company_id: 'cf2b4bfb-382a-4702-b489-e8dda8cacc7b'})

        // const resultMessage = translate(message, { to: answerLang });

        // const answer = (await resultMessage).text
        console.log('message', message);
        
        clearInterval(interval);

      await this.bot.sendMessage(chatId, message);
      await this.bot.sendChatAction(chatId, 'cancel');
    } catch (err) {
      console.error('[Telegram Bot Error]', err);
      await this.bot.sendMessage(chatId, '❌ Ошибка при получении ответа от ИИ.');
    }
  }
}
