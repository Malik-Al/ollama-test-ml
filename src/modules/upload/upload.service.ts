import { Injectable } from '@nestjs/common';
import { FileType } from './type';
import { ElasticService } from '../elastic/elastic.service';
import { v4 as uuidv4 } from 'uuid';
import { EmbeddingService } from '../embedding/embedding.service';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class UploadService {
  constructor(
    private readonly elastic: ElasticService,
    private readonly embedding: EmbeddingService
  ) {}

  private chunkText(
    text: string, 
    chunkSize = 500,
    overlap = 50
  ): string[] {
    try {
      // const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(p => p.length > 0);

      // const chunks: string[] = [];
      // let currentChunk = '';

      // for (const paragraph of paragraphs) {
      //   const sentences = paragraph.match(/[^.!?]+[.!?]?/g) || [paragraph];

      //   for (const sentence of sentences) {
      //     if ((currentChunk + ' ' + sentence).length > chunkSize) {
      //       if (currentChunk) chunks.push(currentChunk.trim());
      //       currentChunk = sentence.slice(-overlap);
      //     } else {
      //       currentChunk += (currentChunk ? ' ' : '') + sentence;
      //     }
      //   }
      // }
      // if (currentChunk) chunks.push(currentChunk.trim());
      // return chunks;

      const sentences = text.match(/[^.!?]+[.!?]?/g) || [text];

      const chunks: string[] = [];
      let currentChunk = '';

      for (const sentence of sentences) {
        if ((currentChunk + ' ' + sentence).trim().length > chunkSize) {
          chunks.push(currentChunk.trim());

          const overlapText = currentChunk.slice(-overlap);
          currentChunk = overlapText + ' ' + sentence;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }

      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
      }

      return chunks;
      
    } catch (error) {
        console.error(`[EEROR] UploadService method chunkText error: `, error);
        throw error
    }
  }

  async added(
    file: FileType
  ){
    try {
      console.log(`[START] UploadService method added file`, file.fieldname);

      const parser = new PDFParse({ data: file.buffer });
      const pdfData = await parser.getText().then((result) => result.text);

      const text = pdfData.replace(/\n+/g, ' ').trim();
      const chunks = this.chunkText(text);

      const companyId = uuidv4();
      
       for (const chunk of chunks) {
          const embedding = await this.embedding.embedTexts(chunk);
          await this.elastic.saveEmbedding(
            companyId, 
            chunk, 
            embedding
          )
       }
        
    } catch (error) {
        console.error(`[EEROR] UploadService method added error:`, error);
        throw error
    }
  }
}