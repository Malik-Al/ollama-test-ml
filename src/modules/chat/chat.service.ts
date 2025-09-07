import { Injectable } from '@nestjs/common';
import { ElasticService } from '../elastic/elastic.service';
import { EmbeddingService } from '../embedding/embedding.service';
import ollama from 'ollama';
const chatModel = 'mistral';


@Injectable()
export class ChatService {
  constructor(
    private readonly elasticService: ElasticService,
    private readonly embedding: EmbeddingService
    
  ) {}


  async saveChat(userId: string, question: string, answer: string, locale: string) {
    try {
      await this.elasticService.addedIndex(
        {
        userId,
        question,
        answer,
        locale,
        timestamp: new Date(),
      },
      )
      
    } catch (error) {
        console.error('[ERROR] saveChat error', error);
        throw error
    }
  
  
}

  async saveProfile(profile) {
    try {
      const text = `
          Название: Оптима банк
          Контакты:
          Телефон: +996 312 90 59 59
          Короткий номер: 9595
          WhatsApp: 0990 90 59 59
          Адрес: г. Бишкек, ул. Киевская 104а
          О банке: Оптима Банк — стремится быть современными, отслеживать нововведения банковской отрасли, и улучшать качество сервиса для клиентов. "Оптима Банк" – это устойчивый и стабильный финансовый институт, банк с хорошей структурой баланса, диверсифицированным кредитным и депозитным портфелем, и сбалансированным географическим покрытием по всему Кыргызстану.
  
          Актуально:
          - Рассрочка без переплат PAY, DA! 

          Продукты:
          - Платежные карты: Visa, Элкарт
          - Депозиты
          - Кредиты
          - Мобильный банкинг: Optima24
          - Калькулятор валют: USD, EUR, KZT, RUB, CNY
  
          Сервисы:
          - Денежные переводы (Ria, Золотая Корона)
          - Push-уведомления
          - Информация о филиалах и отделениях
  
          Акции и новости:
          - АГРОКРЕДИТ от 17% годовых
          - Optima GOLD – бесплатная карта
          - Вперёд за короной с Оптима Банк
      `
  
      
      const res: any = await this.embedding.embed(text)
      console.log('res', res);
      
  
       const embedding = res.embeddings[0];
  
       await this.elasticService.addedIndex(
        {
          userId: profile.userId || 'default',
          text,
          embedding,
          locale: profile.locale || 'ru',
          timestamp: new Date(),
        }
       )
  
      console.log('res', res);
  
      return { message: 'Profile saved in Elasticsearch' };
      
    } catch (error) {
        console.error('[ERROR] saveProfile error', error);
        throw error
    }

  }

  async searchProfile(question: string, userId: string) {
    try {

      let embedding
  
      const userFomElEmbeddings = await this.elasticService.searchByUserId(userId);

      
      if(userFomElEmbeddings) {
        console.log('ELS');
        embedding = userFomElEmbeddings
      } else {
        console.log('embedding');

        const res: any = await this.embedding.embed(question)
        embedding = res.embeddings[0];
      }

  
      console.log('embedding', embedding);
  
      return await this.elasticService.embedSearch(embedding)
      
    } catch (error) {
        console.error('[ERROR] searchProfile error', error);
        throw error
    }

  }

  async ask(userId: string, question: string, locale = 'ru') {
    try {
      const profileText = await this.searchProfile(question, userId);
      const chatContext = await this.elasticService.getChatContext(userId) 
  
      console.log('profileText', profileText);
  
      const prompt = `
          Вот данные: 
          ${profileText}
  
          Контекст предыдущих сообщений пользователя: 
          ${chatContext} 
  
          Вопрос: ${question}
          Ответь строго по данным, коротко и дружелюбно. 
          Если ответа нет в данных, ответь ровно: "нет информации"!.
      `;
  
      const response: any = await ollama.chat({
        model: chatModel,
        messages: [
          {
            role: 'system',
            content: `Ты ассистент, отвечающий ТОЛЬКО на основе предоставленных данных и истории чата пользователя. 
            Если ответа нет в данных, ответь ровно: "нет информации"!.
            Никаких догадок, генераций или знаний вне предоставленных данных`,
          },
          { role: 'user', content: prompt },
          ],
      });
  
      const answer = response.message.content;
  
      await this.saveChat(userId, question, answer, locale);
  
      return answer
      
    } catch (error) {
        console.error('[ERROR] ask error', error);
        throw error
    }
  }

}
