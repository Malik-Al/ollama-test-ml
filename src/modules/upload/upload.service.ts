import { Injectable } from '@nestjs/common';
import { FileType } from './type';


@Injectable()
export class UploadService {
  constructor(
  ) {}

  added(
    file: FileType
  ){
    try {
        
    } catch (error) {
        throw error
    }
  }
}