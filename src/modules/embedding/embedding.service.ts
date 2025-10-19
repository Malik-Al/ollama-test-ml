import { Injectable } from '@nestjs/common';
import ollama from 'ollama';

@Injectable()
export class EmbeddingService {
  private model = 'nomic-embed-text'; 

  async embedTexts(text: string): Promise<number[]> {
    console.log('[START] EmbeddingService method embedTexts test: ', text);
    try {
      const res = await ollama.embed({
        model: this.model,
        input: text,
      });
      return res.embeddings[0];
    } catch (error) {
      console.error(`[EEROR] EmbeddingService method embedTexts error: `, error);
      throw error
    }
  }

  async embedQuestion(question: string): Promise<number[]> {
    console.log('[START] EmbeddingService method embedQuestion question: ', question);
    try {
      const res = await ollama.embed({
        model: this.model,
        input: question,
      });
      return res.embeddings[0]
      
    } catch (error) {
      console.error(`[EEROR] EmbeddingService method embedQuestion error: `, error);
      throw error
    }
   }
}
