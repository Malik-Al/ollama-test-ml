import { Injectable } from '@nestjs/common';
import { Client as ESClient } from '@elastic/elasticsearch';
import ollama from 'ollama';

const embeddingsModel = 'nomic-embed-text';
const chatModel = 'deepseek-r1';
const indexName = 'bank_profileser';

@Injectable()
export class ChatService {
  private es: any;

  constructor() {
    this.es = new ESClient({ node: 'http://localhost:9200' });
    this.createIndex(indexName);
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

  async ask(question: string) {
    const profileText = await this.searchProfile(question);

    const prompt = `
      Вот данные: 
      ${profileText}

      Вопрос: ${question}
      Ответь строго по данным, коротко и дружелюбно. 
      Если нет ответа — скажи "нет информации".
    `;

    const response: any = await ollama.chat({
      model: chatModel,
      messages: [
        {
          role: 'system',
          content: `Ты ассистент, отвечающий только на основе предоставленных данных. 
          Если ответа нет в данных — говори "нет информации".`,
        },
        { role: 'user', content: prompt },
        ],
    });

    return response.message.content;
  }
}
