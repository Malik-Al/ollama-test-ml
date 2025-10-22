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
    maxWords = 80, 
    overlap = 10 
  ): string[] {
    try {
        const words = text.split(/\s+/);
        const chunks: string[] = [];

        for (let i = 0; i < words.length; i += maxWords - overlap) {
          const chunk = words.slice(i, i + maxWords).join(' ');
          chunks.push(chunk);
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
          console.log('chunk', chunk);
        
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