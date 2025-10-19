import { Injectable } from '@nestjs/common';
import ollama from 'ollama';

@Injectable()
export class EmbeddingService {
  private model = 'nomic-embed-text'; 

  async embedTexts(text: string): Promise<number[]> {
      const res = await ollama.embed({
        model: this.model,
        input: text,
      });
    return res.embeddings[0];
  }

  async embedQuestion(question: string) {
    const res = await ollama.embed({
      model: this.model,
      input: question,
    });
    return res.embeddings[0]
  }
}
