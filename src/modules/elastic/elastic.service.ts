import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
const indexName = 'bank_profileser';
const indexChatHistory = 'chat_history';


@Injectable()
export class ElasticService {
  private es: any;

  constructor() {
    this.es = new Client({ node: 'http://localhost:9200' });
    // this.createIndex(indexName);
    this.createChatIndex(indexChatHistory);
    console.log('Instaling Els');
    
  }

    private async createChatIndex(index: string) {
        try {
            const exists = await this.es.indices.exists({ index });
            if (!exists) {
            console.log(`[Create:index] name: ${indexChatHistory}`);
            
            await this.es.indices.create({
                index,
                body: {
                mappings: {
                    properties: {
                        bank_id: { type: 'keyword' },
                        messages: { 
                            type: 'nested',
                            properties: {
                                role: { type: 'keyword' },
                                content: { type: 'text' },
                            },
                        },
                        timestamp: { type: 'date' },
                    },
                },
                },
            });
            }
            
        } catch (error) {
            console.error('[Error: createChatIndex]', error);
            throw error
        }
    }

    async findByBankId(bankId: string) {
        try {
            const response = await this.es.search({
            index: indexChatHistory,
            size: 100, 
            query: {
                term: {
                bank_id: bankId,
                },
            },
            });
            return response.hits.hits.map(hit => hit);
        } catch (error) {
            console.error('[Error: findByBankId]', error);
            throw error;
        }
     }



    private async createIndex(index: string) {
        try {
            const exists = await this.es.indices.exists({ index });
            if (!exists) {
            await this.es.indices.create({
                index,
                body: {
                mappings: {
                    properties: {
                    bank_id: { type: 'keyword' },
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
            
        } catch (error) {
            console.error('[Error: createIndex]', error);
            throw error
        }
    }

    async addMessages(
        id: string, 
        newMessage: object
    ) {
        try {
            await this.es.update({
                index: indexChatHistory,
                id,
                script: {
                    source: `
                        if (ctx._source.messages == null) {
                            ctx._source.messages = [params.newMessage];
                        } else if (ctx._source.messages instanceof List) {
                            ctx._source.messages.add(params.newMessage);
                        } else {
                            def old = ctx._source.messages;
                            ctx._source.messages = [old, params.newMessage];
                        }
                    `,
                    params: {
                        newMessage,
                    },
                },
            });
        } catch (error) {
            console.error('[Error: addMessages]', error);
            throw error;
        }
        }

    async saveChat(
        bank_id: string, 
        messages: object[]
    ) {
        try {
            await this.es.index({
                index: indexChatHistory,
                    document: {
                        bank_id: bank_id,
                        messages,
                        timestamp: Date.now(),
                },
            });
            
        } catch (error) {
            console.error('[Error: saveChat]', error);
            throw error
        }
    }


    async getChatContext(
        bank_id: string, 
        limit = 5
    ) {
        try {
            const res = await this.es.search({
                index: indexChatHistory,
                size: limit,
                query: {
                term: { bank_id }
                },
                sort: [{ timestamp: { order: 'desc' } }]
            });
    
            return res.hits.hits;
            
        } catch (error) {
            console.error('[Error: getChatContext]', error);
            throw error
        }
    }

    async addedDataDocument(
        profile: { bank_id: string, locale: string }, 
        text: string, 
        embedding: any
    ) {
        try {
            await this.es.index({
            index: indexName,
            document: {
                bank_id: profile.bank_id || 'default',
                text,
                embedding,
                locale: profile.locale || 'ru',
                timestamp: new Date(),
            },
            });
        } catch (error) {
            console.error('[Error: addedData]', error);
            throw error
        }
    }

    async search(embedding: any){
        try {
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

        } catch (error) {
            console.error('[Error: search]', error);
            throw error
        }
    }
}
