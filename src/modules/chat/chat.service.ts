import { Injectable } from '@nestjs/common';
import { ElasticService } from '../elastic/elastic.service';
import ollama, { ChatResponse } from 'ollama';
import { settingPrompt } from './setting,prompt';
import { ChatDto } from './dto';
import { EmbeddingService } from '../embedding/embedding.service';
const chatModelMistral = 'mistral';



@Injectable()
export class ChatService {
  chatMsg: any[] = [];
  constructor(
    private readonly elastic: ElasticService,
    private readonly embedding: EmbeddingService
  ) {}

  private async streamResponse(response: AsyncIterable<ChatResponse>): Promise<string> {
    let fullResponse = '';
    try {
    for await (const part of response) {
      const text = part?.message?.content 
      if (text) {
        process.stdout.write(text);
        fullResponse += text;
      }
    }

    } catch (err) {
      console.error('Stream error:', err);
    } 
     console.log('[STREAM FINISHED]');
     return fullResponse;
  }

    
    async ask(dto: ChatDto): Promise<any>  {
      console.log(`[START] ChatService method ask dto: ${JSON.stringify(dto)}`);
      try {
        const {
          bank_id, 
          company_id, 
          question
        } = dto;

        const queryEmbedding = await this.embedding.embedQuestion(question);

        const context = await this.elastic.searchByCompany(company_id, queryEmbedding);

        const bankId = await this.elastic.getChatContext(bank_id);

        const msg = [
            { role: 'system', content: `Ты ассистент в банке: ${settingPrompt}`}
        ]

        if(bankId[0]){
          msg.push(...bankId[0]._source.messages)
          msg.push({ role: 'user', content: `Вот данные:  <context> ${context} </context>, Вопрос: <question> ${question} </question>` })
        } else {
          msg.push({ role: 'user', content: `Вот данные:  <context> ${context} </context>, Вопрос: <question> ${question} </question>` })
        }
    
          console.log('msg', msg);

          const response: any = await ollama.chat({
            model: chatModelMistral, 
            messages: msg
          });

          const message = response.message?.content


          console.log('msg', response);

          if(!bankId[0]){
            console.log('new user added data for');
            await this.elastic.saveChat(
              bank_id,
              [
                { role: 'user', content: question },
                { role: 'assistant', content: message }
              ]
            );
          }

          if(bankId[0]) {
            console.log('existing user added data');
            await this.elastic.addMessages(bankId[0]._id, { role: 'user', content: question })
            await this.elastic.addMessages(bankId[0]._id, { role: 'assistant', content: message })
            await this.elastic.trimMessages(bankId[0]._source.bank_id);
          }

          return response?.message?.content

          // if (!response?.itr || typeof response.itr[Symbol.asyncIterator] !== 'function') {
          //   throw new Error('Ollama response is not async iterable');
          // }

          // // ✅ Итерируем по потоку
          // for await (const chunk of response) {
          //   console.log('chunk', chunk);
            
          //   if (chunk?.message?.content) {
          //     yield chunk.message.content;
          //   }
          // }
          
          } catch (error) {
            console.error(`[EEROR] ChatService method ask error: `, error);
            throw error
          }

      }
}
