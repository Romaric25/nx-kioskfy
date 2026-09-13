import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DRIZZLE } from "../db";
import { uploads } from "../db/app-schema";
import { eq, desc } from "drizzle-orm";
import type { Database } from "../db";

@Injectable()
export class UploadsService {
  private s3: S3Client;
  private bucket: string;

  constructor(
    private readonly config: ConfigService,
    @Inject(DRIZZLE) private db: Database,
  ) {
    this.s3 = new S3Client({
      region: "auto",
      endpoint: this.config.getOrThrow<string>("R2_ENDPOINT"),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>("R2_ACCESS_KEY_ID"),
        secretAccessKey: this.config.getOrThrow<string>("R2_SECRET_ACCESS_KEY"),
      },
    });
    this.bucket = this.config.getOrThrow<string>("R2_BUCKET_NAME");
  }

  async getAll() { return this.db.select().from(uploads).orderBy(desc(uploads.createdAt)); }

  async getById(id: number) {
    const row = await this.db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
    if (!row.length) throw new NotFoundException("Fichier non trouvé");
    return row[0];
  }

  async create(data: { filename: string; thumbnailS3Key: string; thumbnailUrl: string }) {
    const result = await this.db.insert(uploads).values(data);
    return { id: result[0].insertId };
  }

  async update(id: number, data: Record<string, unknown>) {
    await this.getById(id);
    if (Object.keys(data).length > 0) {
      await this.db.update(uploads).set(data).where(eq(uploads.id, id));
    }
  }

  async delete(id: number) {
    const upload = await this.getById(id);
    try { await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: upload.thumbnailS3Key })); } catch {}
    await this.db.delete(uploads).where(eq(uploads.id, id));
  }

  async getPresignedUploadUrl(filename: string, contentType: string, folder?: string) {
    const key = folder ? `${folder}/${filename}` : filename;
    const url = await getSignedUrl(this.s3, new PutObjectCommand({
      Bucket: this.bucket, Key: key, ContentType: contentType,
    }), { expiresIn: 3600 });
    return { url, key };
  }

  async getPresignedDownloadUrl(s3Key: string) {
    const url = await getSignedUrl(this.s3, new GetObjectCommand({
      Bucket: this.bucket, Key: s3Key,
    }), { expiresIn: 3600 });
    return { url };
  }

  async confirmUpload(data: { s3Key: string; filename: string; thumbnailS3Key?: string; thumbnailUrl?: string }) {
    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: data.s3Key }));
    } catch { throw new NotFoundException("Fichier non trouvé sur R2"); }

    return this.create({
      filename: data.filename,
      thumbnailS3Key: data.thumbnailS3Key || data.s3Key,
      thumbnailUrl: data.thumbnailUrl || "",
    });
  }

  async getFileStream(s3Key: string) {
    const decoded = decodeURIComponent(s3Key);
    const [metadata, response] = await Promise.all([
      this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: decoded })),
      this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: decoded })),
    ]);
    return { stream: response.Body, contentType: metadata.ContentType };
  }
}
