import { Injectable } from '@nestjs/common';
import ollama from 'ollama';
import { ElasticService } from '../elastic/elastic.service';

const embeddingsModel = 'nomic-embed-text';
const chatModel = 'mistral';


@Injectable()
export class ChatService {

  constructor(
    private readonly elastic: ElasticService
  ) {}


  async saveProfile(profile) {
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

    const res: any = await ollama.embed({
      model: embeddingsModel,
      input: text,
    });

    console.log('res', res);
    

    const embedding = res.embeddings[0];

    await this.elastic.addedDataDocument(profile, text, embedding)

    console.log('res', res);

    return { message: 'Profile saved in Elasticsearch' };

  }

  async searchProfile(question: string) {
    const res: any = await ollama.embed({
      model: embeddingsModel,
      input: question,
    });

    const embedding = res.embeddings[0];

    console.log('embedding', embedding);

    return await this.elastic.search(embedding)
  }

  async ask(userId: string, question: string, locale = 'ru') {
    const profileText = await this.searchProfile(question);
    const chatContext = await this.elastic.getChatContext(userId);

    console.log('chatContext', chatContext);
    

    // const prompt = `
    //     Вот данные: 
    //     ${profileText}

    //     Контекст предыдущих сообщений пользователя: 
    //     ${chatContext} 

    //     Вопрос: ${question}
    //     Ответь строго по данным, коротко и дружелюбно. 
    //     Если ответа нет в данных, ответь ровно: "нет информации"!.
    // `;

    
    const prompt = `
        Вот данные: 
        ${profileText}

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

    await this.elastic.saveChat(userId, question, answer, locale);

    return answer
  }
}
