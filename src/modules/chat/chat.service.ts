import { Injectable } from '@nestjs/common';
import { Client as ESClient } from '@elastic/elasticsearch';
import ollama from 'ollama';

const embeddingsModel = 'nomic-embed-text';
const chatModel = 'mistral';
const indexName = 'bank_profileser';
const indexChatHistory = 'chat_history';


@Injectable()
export class ChatService {
  private es: any;

  constructor() {
    this.es = new ESClient({ node: 'http://localhost:9200' });
    this.createIndex(indexName);
    this.createChatIndex(indexChatHistory);
  }

  private async createChatIndex(index: string) {
  const exists = await this.es.indices.exists({ index });
  if (!exists) {
    await this.es.indices.create({
      index,
      body: {
        mappings: {
          properties: {
            userId: { type: 'keyword' },
            question: { type: 'text' },
            answer: { type: 'text' },
            timestamp: { type: 'date' },
            locale: { type: 'keyword' },
          },
        },
      },
    });
  }
}

  private async createIndex(index: string) {
    const exists = await this.es.indices.exists({ index });
    if (!exists) {
      await this.es.indices.create({
        index,
        body: {
          mappings: {
            properties: {
              userId: { type: 'keyword' },
              question: { type: 'text' },
              answer: { type: 'text' },
              embedding: { type: 'dense_vector', dims: 768 },
              timestamp: { type: 'date' },
              locale: { type: 'keyword' },
            },
          },
        },
      });
    }
  }


  async saveChat(userId: string, question: string, answer: string, locale: string) {
  await this.es.index({
    index: indexChatHistory,
    document: {
      userId,
      question,
      answer,
      locale,
      timestamp: new Date(),
    },
  });
}

  async saveProfile(profile) {
    const text = `
        Название: Оптима банк
        Контакты:
        Телефон: +996 312 90 59 59
        Короткий номер: 9595
        WhatsApp: 0990 90 59 59
        Адрес: г. Бишкек, ул. Киевская 104а

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

    // const text = profile.message

    const res: any = await ollama.embed({
      model: embeddingsModel,
      input: text,
    });

    console.log('res', res);
    

     const embedding = res.embeddings[0];


    await this.es.index({
      index: indexName,
      document: {
        userId: profile.userId || 'default',
        text,
        embedding,
        locale: profile.locale || 'ru',
        timestamp: new Date(),
      },
    });

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


    const result = await this.es.search({
      index: indexName,
      size: 1,
      query: {
        script_score: {
          query: { match_all: {} },
          script: {
            source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
            params: { query_vector: embedding },
          },
        },
      },
    });

    const hit = result.hits.hits[0];
    return hit?._source?.text || '';

  }

  async ask(userId: string, question: string, locale = 'ru') {
    const profileText = await this.searchProfile(question);
    const chatContext = await this.getChatContext(userId);

    console.log('chatContext', chatContext);
    

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
  }

  async getChatContext(userId: string, limit = 5) {
  const res = await this.es.search({
    index: indexChatHistory,
    size: limit,
    query: {
      term: { userId }
    },
    sort: [{ timestamp: { order: 'desc' } }]
  });

  // Формируем текст контекста: "Вопрос -> Ответ"
  const hits = res.hits.hits;
  return hits
    .map(h => `${h._source.question} -> ${h._source.answer}`)
    .reverse() // чтобы сначала были старые сообщения
    .join('\n');
}
}
