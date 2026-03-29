// src/adapters/upload/upload-adapter.ts
import type { Platform } from "../../domain/contracts.js";

export type { Platform };

export interface UploadRequest {
  video_path: string;
  title: string;
  description: string;
  hashtags: string[];
  platform: Platform;
}

export interface UploadResult {
  status: "success" | "error" | "dry_run";
  post_url?: string;
  post_id?: string;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface UploadOptions {
  dry_run: boolean;
}

export interface UploadAdapter {
  name: string;
  platform: Platform;
  isAvailable(): Promise<boolean>;
  upload(request: UploadRequest, options: UploadOptions): Promise<UploadResult>;
}
