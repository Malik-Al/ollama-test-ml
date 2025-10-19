import { Controller, Post, Body, HttpException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileType } from './type';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly upload: UploadService
  ) {}

@Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
  }))
  async uploadFile(
    @UploadedFile() file: FileType
  ){
    console.log(`[START] UploadController method uploadFile`, file.fieldname);
    try {
      await this.upload.added(file);

      return {
        code: 200,
        success: true
      }
    } catch (error) {
      console.error(`[EEROR] UploadController method uploadFile error: `, error);
      throw new HttpException(
          {
            status: 500,
            error: 'interval server error',
          }, 
          500
        );
      }
  }
}