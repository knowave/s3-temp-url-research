import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('temp-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTempImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadTempImage(file);
  }
}
