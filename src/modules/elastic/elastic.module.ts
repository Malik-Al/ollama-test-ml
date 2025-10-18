import { Module } from '@nestjs/common';
import { ElasticService } from './elastic.service';
import { Client } from '@elastic/elasticsearch';
import API from 'node_modules/@elastic/elasticsearch/lib/api';
import conf from '../../../config.json' 
const indexEmbedd = conf.elastic.indexs.embedding
const indexChatHistory = conf.elastic.indexs.chat
const apiEls = `${conf.elastic.api.host}:${conf.elastic.api.port}` 

@Module({
  providers: [ElasticService],
  exports: [ElasticService],
})

export class ElasticModule {
    private es: API;
  
    constructor() {
      this.es = new Client({ node: apiEls});
      this.createdDataDocument(indexEmbedd);
      this.createChatIndex(indexChatHistory);
      console.log('Instaling Els');
    }
  
      private async createChatIndex(index: string) {
        try {
            const exists = await this.es.indices.exists({ index });
            if (!exists) {
            console.log(`[createChatIndex:index] name: ${indexChatHistory}`);
            
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

    private async createdDataDocument(
        index: string, 
    ) {
        try {
            const exists = await this.es.indices.exists({ index });
            if (!exists) {
                console.log(`[createdDataDocument:index] name: ${index}`)
                await this.es.indices.create({
                index,
                    body: {
                        mappings: {
                        properties: {
                            bank_id: { type: 'keyword' },         
                            text: { type: 'text' },                
                            locale: { type: 'keyword' },           
                            timestamp: { type: 'date' },       
                            embedding: {
                            type: 'dense_vector',
                            dims: 768,                      
                            index: true,             
                            similarity: 'cosine'        
                            }
                        }
                       }
                    }
                });
             }
            
        } catch (error) {
            console.error('[Error: createdDataDocument]', error);
            throw error
        }
    }
}
