import { Injectable } from '@nestjs/common';
import { S3Service } from 'src/s3/s3.service';

@Injectable()
export class UploadService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadTempImage(file: Express.Multer.File) {
    return this.s3Service.uploadTempImage(file);
  }
}
