// Cloudflare R2 Upload Utility via Supabase Edge Function
import { supabase } from './supabase';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  key: string;
  publicUrl: string;
}

/**
 * Upload a file to Cloudflare R2 via Supabase Edge Function
 * This securely uploads files using presigned URLs
 */
export async function uploadToR2(
  file: File,
  folder: 'images' | 'videos',
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // Step 1: Get presigned URL from Edge Function
    console.log('[R2-UPLOAD] Requesting presigned URL for:', file.name);

    const { data: presignedData, error: presignedError } = await supabase.functions.invoke('upload-to-r2', {
      body: {
        fileName: file.name,
        fileType: file.type,
        folder: folder
      }
    });

    if (presignedError) {
      console.error('[R2-UPLOAD] Error getting presigned URL:', presignedError);
      throw new Error(`Failed to get upload URL: ${presignedError.message}`);
    }

    if (!presignedData?.success || !presignedData?.uploadUrl) {
      console.error('[R2-UPLOAD] Invalid response from edge function:', presignedData);
      throw new Error(presignedData?.error || 'Failed to get upload URL');
    }

    const { uploadUrl, fileUrl, key } = presignedData;
    console.log('[R2-UPLOAD] Got presigned URL, uploading file...');

    // Step 2: Upload file to R2 using presigned URL
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentage = Math.round((e.loaded / e.total) * 100);
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percentage
          });
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('[R2-UPLOAD] ✅ File uploaded successfully to:', fileUrl);
          resolve({
            url: fileUrl,
            key: key,
            publicUrl: fileUrl
          });
        } else {
          console.error('[R2-UPLOAD] Upload failed with status:', xhr.status, xhr.statusText);
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        console.error('[R2-UPLOAD] Network error during upload');
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        console.error('[R2-UPLOAD] Upload aborted');
        reject(new Error('Upload aborted'));
      });

      // Send the file
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });

  } catch (error) {
    console.error('[R2-UPLOAD] Upload error:', error);
    throw error instanceof Error ? error : new Error('Failed to upload file');
  }
}

/**
 * Delete a file from R2
 * Note: This requires implementing a delete edge function
 */
export async function deleteFromR2(key: string): Promise<void> {
  console.log('[R2-UPLOAD] Delete file:', key);
  // TODO: Implement deletion via edge function if needed
  // For now, files will remain in R2 until manually cleaned up
}

/**
 * Validate file size and type
 */
export function validateFile(
  file: File,
  maxSizeMB: number = 100,
  allowedTypes: string[] = []
): { valid: boolean; error?: string } {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }

  // Check file type if specified
  if (allowedTypes.length > 0) {
    const fileType = file.type;
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.replace('/*', ''));
      }
      return fileType === type;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `File type ${fileType} is not allowed`
      };
    }
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}





