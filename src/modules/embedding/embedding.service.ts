import { Injectable } from '@nestjs/common';
import ollama from 'ollama';
const embeddingsModel = 'nomic-embed-text';

@Injectable()
export class EmbeddingService {

    async embed(text: string){
        try {
            return await ollama.embed({
              model: embeddingsModel,
              input: text,
            });
            
        } catch (error) {
            console.error('[ERROR] embed error', error);
            throw error
        }
    }

}