import React from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { UploadState } from '../hooks/useUploader';

interface UploadProgressProps {
  uploadStates: UploadState[];
}

export function UploadProgress({ uploadStates }: UploadProgressProps) {
  if (uploadStates.length === 0) return null;

  return (
    <div className="space-y-2">
      {uploadStates.map((s, i) => {
        if (s.status === 'idle') return null;
        return (
          <div
            key={`${s.fileName}-${i}`}
            className="flex items-center justify-between rounded-md border p-3"
          >
            <div className="flex items-center gap-3">
              {s.status === 'uploading' && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
              {s.status === 'done' && (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              )}
              {s.status === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
              <div>
                <div className="text-sm font-medium truncate max-w-[300px]">
                  {s.fileName}
                </div>
                {s.status === 'uploading' && (
                  <div className="text-xs text-muted-foreground">
                    {s.progress}% uploading...
                  </div>
                )}
                {s.status === 'error' && (
                  <div className="text-xs text-red-600">
                    {s.error}
                  </div>
                )}
                {s.status === 'done' && (
                  <div className="text-xs text-green-700">
                    Uploaded successfully
                  </div>
                )}
              </div>
            </div>
            {s.status === 'uploading' && (
              <div className="w-40 h-2 rounded bg-muted overflow-hidden">
                <div
                  className="h-2 bg-primary transition-all"
                  style={{ width: `${s.progress ?? 0}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
