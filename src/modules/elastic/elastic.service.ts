import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

const indexName = 'bank_profileser';
const indexChatHistory = 'chat_history';

@Injectable()
export class ElasticService {
  private es: any;

  constructor() {
    this.es = new Client({ node: 'http://localhost:9200' });
    this.createIndex(indexName);
    this.createChatIndex(indexChatHistory);
  }

  async addedIndex(
    document: any
  ){
    try {
      await this.es.index({
        index: indexChatHistory,
        document
    });
    } catch (error) {
      console.error('addedInex error', error);
    }
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

async embedSearch(embedding: any){
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
