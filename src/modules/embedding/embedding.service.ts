import { Injectable } from '@nestjs/common';
import ollama from 'ollama';

@Injectable()
export class EmbeddingService {
  private model = 'nomic-embed-text'; // или любая embedding-модель, доступная в Ollama

  async embedTexts(texts: string[]) {
    const results: number[][] = [];
    for (const text of texts) {
      const res = await ollama.embed({
        model: this.model,
        input: text,
      });
      results.push(res.embeddings[0]);
    }
    return results;
  }

  async embedQuestion(question: string) {
    const res = await ollama.embed({
      model: this.model,
      input: question,
    });
    return res.embeddings[0]
  }
}
