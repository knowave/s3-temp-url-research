import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly tempPreFix: string = 'temp/';
  private readonly permanentPreFix: string = 'permanent/';

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY')!,
        secretAccessKey: this.configService.get('AWS_SECRET_KEY')!,
      },
    });
    this.bucketName = this.configService.get('AWS_BUCKET_NAME')!;
  }

  // 임시 객체 생성
  async generateTempUrl(fileExtension: string) {
    const key = `${this.tempPreFix}${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: this.getContentType(fileExtension),
      ACL: 'public-read',
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 15 * 60, // 15분 동안 유효
    });

    const tempImageUrl = `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;

    return { uploadUrl, tempImageUrl };
  }

  // 임시 객체 확인
  async validateTempUrl(tempImageUrl: string) {
    try {
      const key = tempImageUrl;
      if (!key.startsWith(this.tempPreFix)) return false;

      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      throw new Error(`Invalid temp image URL: ${error}`);
    }
  }

  // 임시 객체에서 영구 객체로 변환
  async convertTempToPermanent(tempImageUrl: string) {
    const tempKey = this.extractKeyFromUrl(tempImageUrl);

    if (!tempKey.startsWith(this.tempPreFix))
      throw new BadRequestException('Invalid temporary image URL');

    const exists = await this.validateTempUrl(tempImageUrl);
    if (!exists) throw new BadRequestException('Temporary image not found');

    const fileExtension = tempKey.split('.').pop();
    const permanentKey = `${this.permanentPreFix}${uuidv4()}.${fileExtension}`;

    await this.s3Client.send(
      new CopyObjectCommand({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${tempKey}`,
        Key: permanentKey,
      }),
    );

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: tempKey,
      }),
    );

    const permanentImageUrl = `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${permanentKey}`;

    return permanentImageUrl;
  }

  private extractKeyFromUrl(url: string): string {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1);
  }

  private getContentType(fileExtension: string) {
    const types = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };

    return (
      types[fileExtension.toLowerCase() as keyof typeof types] ||
      'application/octet-stream'
    );
  }
}
