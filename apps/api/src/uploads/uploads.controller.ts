import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Res, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@thallesp/nestjs-better-auth";
import type { Response } from "express";
import { UploadsService } from "./uploads.service";
import { CreateUploadDto, UpdateUploadDto, PresignedUploadDto, PresignedDownloadDto, ConfirmUploadDto } from "./dto/upload.dto";

@ApiTags("Uploads")
@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Admin — Tous les fichiers" })
  getAll() { return this.uploadsService.getAll(); }

  @Get(":id")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Détail d'un fichier" })
  getById(@Param("id", ParseIntPipe) id: number) { return this.uploadsService.getById(id); }

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Créer un enregistrement" })
  create(@Body() dto: CreateUploadDto) { return this.uploadsService.create(dto); }

  @Put(":id")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Mettre à jour un fichier" })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateUploadDto) { return this.uploadsService.update(id, dto as Record<string, unknown>); }

  @Delete(":id")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Supprimer un fichier" })
  remove(@Param("id", ParseIntPipe) id: number) { return this.uploadsService.delete(id); }

  @Post("presigned-upload")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "URL présignée d'upload" })
  presignedUpload(@Body() dto: PresignedUploadDto) {
    return this.uploadsService.getPresignedUploadUrl(dto.filename, dto.contentType, dto.folder);
  }

  @Post("presigned-download")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "URL présignée de download" })
  presignedDownload(@Body() dto: PresignedDownloadDto) {
    return this.uploadsService.getPresignedDownloadUrl(dto.s3Key);
  }

  @Post("confirm")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Confirmer un upload" })
  confirm(@Body() dto: ConfirmUploadDto) { return this.uploadsService.confirmUpload(dto); }

  @Get("stream/:s3Key")
  @ApiOperation({ summary: "Stream un fichier depuis R2" })
  async stream(@Param("s3Key") s3Key: string, @Res() res: Response) {
    const { stream, contentType } = await this.uploadsService.getFileStream(s3Key);
    res.set({ "Content-Type": contentType || "application/octet-stream", "Content-Disposition": "inline" });
    (stream as any).pipe(res);
  }
}
