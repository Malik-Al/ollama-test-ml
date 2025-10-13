import { Injectable } from '@nestjs/common';
import { ElasticService } from '../elastic/elastic.service';
import ollama from 'ollama';
import { settingPrompt, dataForQuestion } from './setting,prompt';
import { ChatDto } from './dto';
const chatModelMistral = 'mistral';
const chatModelDeepseek = 'deepseek-r1';



@Injectable()
export class ChatService {
  chatMsg: any[] = [];
  constructor(
    private readonly elastic: ElasticService
  ) {}


  async ask(
    dto: ChatDto, 
  ) {
    try {
      const {
        bank_id, 
        question
      } = dto;

      
      const bankId = await this.elastic.getChatContext(bank_id);
      
      const msg = [
          { role: 'system', content: `Ты ассистент в банке: ${settingPrompt}`}
      ]

      if(bankId[0]){
          msg.push(...bankId[0]._source.messages)
          msg.push({ role: 'user', content: `Вот данные: ${dataForQuestion}, Вопрос: ${question}` })
      } else {
        msg.push({ role: 'user', content: `Вот данные: ${dataForQuestion}, Вопрос: ${question}`  })
      }

      console.log('msg', msg);

  
      const response: any = await ollama.chat({
        model: chatModelMistral, 
        messages: msg
      });

      
      if(!bankId[0]){
        console.log('new user added data for');
        await this.elastic.saveChat(
          bank_id,
          [
            { role: 'user', content: question },
            { role: 'assistant', content: response.message.content }
          ]
        );
      }

      if(bankId[0]) {
        console.log('existing user added data');
        await this.elastic.addMessages(bankId[0]._id, { role: 'user', content: question })
        await this.elastic.addMessages(bankId[0]._id, response.message)
      }

      return response.message.content
      
    } catch (error) {
        throw error
    }
  }
}
