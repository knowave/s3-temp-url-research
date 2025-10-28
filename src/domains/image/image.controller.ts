import { Body, Controller, Post } from '@nestjs/common';
import { CreateImageBodyDto } from './dto/create-image.body';
import { ImageService } from './image.service';

@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post()
  async createImage(@Body() body: CreateImageBodyDto) {
    return this.imageService.createImage(body);
  }
}
