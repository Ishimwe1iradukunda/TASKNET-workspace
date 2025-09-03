import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

export type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; fileName: string; progress: number }
  | { status: 'done'; fileName: string }
  | { status: 'error'; fileName: string; error: string };

export function useUploader({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [uploadStates, setUploadStates] = useState<UploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const putWithProgress = (url: string, file: File, onProgress: (p: number) => void) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed with status ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.onabort = () => reject(new Error('Upload aborted'));
      xhr.send(file);
    });
  };

  const uploadFiles = useCallback(async (files: File[]) => {
    setIsUploading(true);
    setUploadStates(files.map((f) => ({ status: 'uploading', fileName: f.name, progress: 0 })));

    try {
      for (let idx = 0; idx < files.length; idx++) {
        const file = files[idx];

        let uploadUrl: string;
        try {
          const resp = await backend.workspace.getUploadUrl({
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
          });
          uploadUrl = resp.uploadUrl;
        } catch (err) {
          console.error('Failed to get upload URL:', err);
          setUploadStates((prev) =>
            prev.map((s, i) =>
              i === idx ? { status: 'error', fileName: file.name, error: 'Failed to get upload URL' } : s
            )
          );
          continue;
        }

        try {
          await putWithProgress(uploadUrl, file, (progress) => {
            setUploadStates((prev) =>
              prev.map((s, i) =>
                i === idx && s.status === 'uploading' ? { ...s, progress } : s
              )
            );
          });

          setUploadStates((prev) =>
            prev.map((s, i) => (i === idx ? { status: 'done', fileName: file.name } : s))
          );
        } catch (err) {
          console.error('Failed to upload file:', err);
          setUploadStates((prev) =>
            prev.map((s, i) =>
              i === idx ? { status: 'error', fileName: file.name, error: 'Upload failed' } : s
            )
          );
          continue;
        }
      }

      onUploadComplete();

      const anyError = uploadStates.some((s) => s.status === 'error');
      if (!anyError) {
        toast({ title: 'Success', description: 'All files uploaded successfully' });
      } else {
        toast({
          title: 'Partial success',
          description: 'Some files failed to upload',
          variant: 'destructive',
        });
      }
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadStates([]), 5000);
    }
  }, [onUploadComplete, toast]);

  return { uploadFiles, isUploading, uploadStates };
}
