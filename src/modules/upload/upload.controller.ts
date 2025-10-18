import { Controller, Post, Body, HttpException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileType } from './type';
import { memoryStorage } from 'multer';

@Controller('upload')
export class UploadController {
  constructor() {}

@Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
  }))
  async uploadFile(
    @UploadedFile() file: FileType
  ){
    try {
    console.log('file', file);
        
    } catch (error) {
        throw error
    }
  }
}