import { Injectable } from '@nestjs/common';
import { ElasticService } from '../elastic/elastic.service';
import ollama from 'ollama';
import { settingPrompt, dataForQuestion } from './setting,prompt';
import { ChatDto } from './dto';
import { EmbeddingService } from '../embedding/embedding.service';
const chatModelMistral = 'mistral';
const chatModelDeepseek = 'deepseek-r1';



@Injectable()
export class ChatService {
  chatMsg: any[] = [];
  constructor(
    private readonly elastic: ElasticService,
    private readonly embedding: EmbeddingService
  ) {}

    async ask(dto: ChatDto) {
      try {
        const {
          bank_id, 
          company_id, 
          question
        } = dto;

        const queryEmbedding = await this.embedding.embedQuestion(question);
        const context = await this.elastic.searchByCompany(company_id, queryEmbedding);

        console.log('context', context);
        console.log('queryEmbedding', queryEmbedding);

        const bankId = await this.elastic.getChatContext(bank_id);

        const msg = [
            { role: 'system', content: `Ты ассистент в банке: ${settingPrompt}`}
        ]

        if(bankId[0]){
          msg.push(...bankId[0]._source.messages)
          msg.push({ role: 'user', content: `Вот данные: ${context}, Вопрос: ${question}` })
        } else {
          msg.push({ role: 'user', content: `Вот данные: ${context}, Вопрос: ${question}`  })
        }
    
        console.log('msg', msg);

          const response: any = await ollama.chat({
            model: chatModelMistral, 
            stream: true,
            messages: msg
          });

          
          for await (const part of response) {
            process.stdout.write(part.message?.content || '');
          }
          
          console.log('msg', response);

        // return response.message.content
        // const stream = await ollama.chat({
        //   model: chatModelMistral,
        //   messages: [
        //     { role: 'system', content: 'Ты помощник, который отвечает на вопросы о банке.' },
        //     { role: 'user', content: `Контекст:\n${context}\n\nВопрос: ${question}` },
        //   ],
        // });
        
      } catch (error) {
        console.error(`[EEROR] ChatService method ask error: `, error);
        throw error
      }

  }

  // async ask(
  //   dto: ChatDto, 
  // ) {
  //   try {
  //     const {
  //       bank_id, 
  //       question
  //     } = dto;

      
  //     const bankId = await this.elastic.getChatContext(bank_id);
      
  //     const msg = [
  //         { role: 'system', content: `Ты ассистент в банке: ${settingPrompt}`}
  //     ]

  //     if(bankId[0]){
  //         msg.push(...bankId[0]._source.messages)
  //         msg.push({ role: 'user', content: `Вот данные: ${dataForQuestion}, Вопрос: ${question}` })
  //     } else {
  //       msg.push({ role: 'user', content: `Вот данные: ${dataForQuestion}, Вопрос: ${question}`  })
  //     }

  //     console.log('msg', msg);

  
  //     const response: any = await ollama.chat({
  //       model: chatModelMistral, 
  //       messages: msg
  //     });

      
  //     if(!bankId[0]){
  //       console.log('new user added data for');
  //       await this.elastic.saveChat(
  //         bank_id,
  //         [
  //           { role: 'user', content: question },
  //           { role: 'assistant', content: response.message.content }
  //         ]
  //       );
  //     }

  //     if(bankId[0]) {
  //       console.log('existing user added data');
  //       await this.elastic.addMessages(bankId[0]._id, { role: 'user', content: question })
  //       await this.elastic.addMessages(bankId[0]._id, response.message)
  //       await this.elastic.trimMessages(bankId[0]._source.bank_id);
  //     }

  //     return response.message.content
      
  //   } catch (error) {
  //       throw error
  //   }
  // }
}
