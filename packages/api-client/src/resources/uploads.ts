import type { UploadItem, PresignedUploadResult } from "@kioskfy/types";
import type { FetchOptions } from "../types";

type Fetcher = (path: string, init?: RequestInit) => Promise<any>;

function buildInit(
  method: string,
  opts?: FetchOptions,
  body?: unknown,
): RequestInit {
  const init: RequestInit = { method };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }

  if (opts?.headers) {
    init.headers = {
      ...((init.headers as Record<string, string>) ?? {}),
      ...opts.headers,
    };
  }

  if (opts?.signal) {
    init.signal = opts.signal;
  }

  return init;
}

export class UploadsResource {
  constructor(private fetch: Fetcher) {}

  /** Get all uploads. */
  async getAll(opts?: FetchOptions): Promise<UploadItem[]> {
    return this.fetch("/uploads", buildInit("GET", opts));
  }

  /** Get an upload by ID. */
  async getById(id: number, opts?: FetchOptions): Promise<UploadItem> {
    return this.fetch(`/uploads/${id}`, buildInit("GET", opts));
  }

  /** Create an upload record. */
  async create(
    data: {
      filename: string;
      thumbnailS3Key: string;
      thumbnailUrl: string;
    },
    opts?: FetchOptions,
  ): Promise<{ id: number }> {
    return this.fetch("/uploads", buildInit("POST", opts, data));
  }

  /** Update an upload record. */
  async update(
    id: number,
    data: Record<string, unknown>,
    opts?: FetchOptions,
  ): Promise<void> {
    return this.fetch(`/uploads/${id}`, buildInit("PUT", opts, data));
  }

  /** Delete an upload. */
  async delete(id: number, opts?: FetchOptions): Promise<void> {
    return this.fetch(`/uploads/${id}`, buildInit("DELETE", opts));
  }

  /** Get a presigned S3 URL for uploading a file. */
  async getPresignedUploadUrl(
    filename: string,
    contentType: string,
    folder?: string,
    opts?: FetchOptions,
  ): Promise<{ url: string; key: string }> {
    return this.fetch(
      "/uploads/presigned-upload",
      buildInit("POST", opts, { filename, contentType, folder }),
    );
  }

  /** Get a presigned S3 URL for downloading a file. */
  async getPresignedDownloadUrl(
    s3Key: string,
    opts?: FetchOptions,
  ): Promise<{ url: string }> {
    return this.fetch(
      "/uploads/presigned-download",
      buildInit("POST", opts, { s3Key }),
    );
  }

  /** Confirm a completed upload to register it in the database. */
  async confirmUpload(
    data: {
      s3Key: string;
      filename: string;
      thumbnailS3Key?: string;
      thumbnailUrl?: string;
    },
    opts?: FetchOptions,
  ): Promise<PresignedUploadResult> {
    return this.fetch(
      "/uploads/confirm",
      buildInit("POST", opts, data),
    );
  }
}
