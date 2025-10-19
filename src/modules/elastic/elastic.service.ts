import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import conf from '../../../config.json' 
const indexEmbedd = conf.elastic.indexs.embedding
const indexChatHistory = conf.elastic.indexs.chat
const apiEls = `${conf.elastic.api.host}:${conf.elastic.api.port}` 

@Injectable()
export class ElasticService {
  private es: any;

  constructor() {
    this.es = new Client({ node: apiEls });
  }

    async trimMessages(bankId: string){
        try {
            const result = await this.es.search({
                index: indexChatHistory,
                query: {
                    term: { bank_id: bankId }  
                }
            });

            const bankDoc = result.hits.hits[0];

            console.log('[Upd:Msg] by bankId:', bankId);

            const documentId = bankDoc._id;

            await this.es.update({
                index: indexChatHistory,
                id: documentId,
                body: {
                    script: {
                    source: `
                        if (ctx._source.messages != null && ctx._source.messages.length > params.pairs * 2) {
                            int start = ctx._source.messages.length - params.pairs * 2;
                            ctx._source.messages = ctx._source.messages.subList(start, ctx._source.messages.length);
                        }
                    `,
                        params: {
                            pairs: 5
                        }
                    }
                }
            });
        } catch (error) {
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

    async saveEmbedding(
        companyId: string, 
        text: string, 
        embedding: number[]
    ) {
        console.log(`[START] ElasticService method saveEmbedding 
            companyId: ${companyId} 
            text: ${JSON.stringify(text)}
            embedding: ${embedding.length && ' -0.062158696 ....'}`);
        try {
            await this.es.index({
            index: indexEmbedd,
                document: {
                    company_id: companyId,
                    text,
                    locale: 'ru',
                    embedding,
                },
            });

        } catch (error) {
            throw error
        }
    }


    async searchByCompany(
        companyId: string, 
        queryEmbedding: number[]
    ) {
        try {
            const result = await this.es.search({
                index: indexEmbedd,
                min_score: 0.80,
                knn: {
                    field: 'embedding',
                    query_vector: queryEmbedding,
                    k: 2,
                    num_candidates: 20,
                // filter: {
                //     term: { company_id: companyId },
                // },
            },
        });

        return result.hits.hits.map((hit) => hit._source.text).join('\n');
        } catch (error) {
            throw error
        }
  }
}
