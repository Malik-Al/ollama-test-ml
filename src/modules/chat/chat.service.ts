import { Injectable } from '@nestjs/common';
import { ElasticService } from '../elastic/elastic.service';
import ollama from 'ollama';
import fs from 'fs';
import { contentPrompt } from './setting,prompt';
const chatModelMistral = 'mistral';
const chatModelDeepseek = 'deepseek-r1';


const data = JSON.parse(fs.readFileSync('banks.json', 'utf-8'));
const bank = data.find(b => b.name === 'Оптима банк');

console.log('data', data);
console.log('bank', bank);



@Injectable()
export class ChatService {
  constructor(
    private readonly elastic: ElasticService
  ) {}


  async ask(
    question: string, 
  ) {
    console.log('question', question);

    // const msg = 'Вопрос: есть бесплатная карта ? Ответ: Да, в списке продуктов банка упоминается Optima GOLD - бесплатная карта.'
    
    const prompt = `
      Вот данные:
      ${JSON.stringify(bank, null, 2)}

      Вопрос: ${question}
    `;

    const response: any = await ollama.chat({
      // model: chatModelDeepseek, // Deepseek
      model: chatModelMistral, // mistral
      messages: [
        {
          role: 'system',
          content: contentPrompt,
        },
        { role: 'user', content: prompt },
        ],
    });

    console.log('response', response);

    // let cleanContent = response?.message?.content || ''
    // cleanContent = cleanContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    // console.log('cleanContent', cleanContent)
    // return cleanContent

    return response.message.content // mistral response
  }
}
