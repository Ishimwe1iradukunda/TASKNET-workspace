import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Trash2, Download, File, FileText, FileArchive, Link as LinkIcon, Loader2, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { LocalStorageManager } from '../utils/localStorage';
import backend from '~backend/client';
import type { Document } from '~backend/workspace/documents/list';

interface DocumentsViewProps {
  isOfflineMode: boolean;
}

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; fileName: string; progress: number }
  | { status: 'done'; fileName: string }
  | { status: 'error'; fileName: string; error: string };

export function DocumentsView({ isOfflineMode }: DocumentsViewProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadStates, setUploadStates] = useState<UploadState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, [isOfflineMode]);

  const loadDocuments = async () => {
    try {
      if (isOfflineMode) {
        setDocuments(LocalStorageManager.getDocuments());
      } else {
        const response = await backend.workspace.listDocuments();
        setDocuments(response.documents);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
    }
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    await uploadFiles(files);
    // reset input so selecting the same file again still triggers change
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isOfflineMode) {
      toast({
        title: 'Offline Mode',
        description: 'File uploads are disabled in offline mode.',
        variant: 'destructive',
      });
      return;
    }
    const dt = e.dataTransfer;
    const files = Array.from(dt.files ?? []);
    if (files.length === 0) return;
    await uploadFiles(files);
  };

  const uploadFiles = useCallback(async (files: File[]) => {
    if (isOfflineMode) {
      toast({
        title: 'Offline Mode',
        description: 'File uploads are disabled in offline mode.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    // initialize upload states
    setUploadStates(files.map((f) => ({ status: 'uploading', fileName: f.name, progress: 0 })));

    try {
      for (let idx = 0; idx < files.length; idx++) {
        const file = files[idx];

        // Step 1: Get a signed upload URL + create DB record
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
          continue; // proceed with next file
        }

        // Step 2: PUT file to signed URL with progress (XHR to track progress)
        try {
          await putWithProgress(uploadUrl, file, (progress) => {
            setUploadStates((prev) =>
              prev.map((s, i) =>
                i === idx && s.status === 'uploading' ? { ...s, progress } : s
              )
            );
          });

          // Mark done
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

      // Step 3: Refresh list
      await loadDocuments();

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
      // Clear statuses after a short delay
      setTimeout(() => setUploadStates([]), 5000);
    }
  }, [isOfflineMode]);

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

  const handleDeleteDocument = async (id: string) => {
    try {
      if (isOfflineMode) {
        LocalStorageManager.deleteDocument(id);
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      } else {
        await backend.workspace.deleteDocument({ id });
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
      toast({
        title: 'Success',
        description: 'Document deleted',
      });
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadDocument = async (id: string) => {
    if (isOfflineMode) {
      toast({
        title: 'Offline Mode',
        description: 'Downloads are not available in offline mode.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const { downloadUrl } = await backend.workspace.getDocument({ id });
      const win = window.open(downloadUrl, '_blank');
      if (!win) {
        // Popup blocked
        window.location.href = downloadUrl;
      }
    } catch (error) {
      console.error('Failed to get download URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to get download URL',
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = async (id: string) => {
    if (isOfflineMode) {
      toast({
        title: 'Offline Mode',
        description: 'Links are not available in offline mode.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const { downloadUrl } = await backend.workspace.getDocument({ id });
      await navigator.clipboard.writeText(downloadUrl);
      toast({ title: 'Link copied', description: 'Signed download link copied to clipboard.' });
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy download link',
        variant: 'destructive',
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="w-8 h-8 text-blue-500" />;
    if (fileType.includes('zip') || fileType.includes('archive')) return <FileArchive className="w-8 h-8 text-yellow-500" />;
    if (fileType.startsWith('image/')) return <File className="w-8 h-8 text-green-500" />;
    return <File className="w-8 h-8 text-muted-foreground" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h2 className="text-2xl font-bold">Documents</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isOfflineMode}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileInputChange}
            multiple
            disabled={isUploading || isOfflineMode}
          />
        </div>
      </div>

      {!isOfflineMode && (
        <div
          className={`m-6 mb-0 rounded-lg border-2 border-dashed transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border'
          } ${isOfflineMode ? 'opacity-50 pointer-events-none' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Upload className="w-6 h-6 mb-3 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Drag and drop files here, or click "Upload Files"
            </div>
          </div>
        </div>
      )}

      {uploadStates.length > 0 && (
        <div className="px-6 pt-4">
          <div className="space-y-2">
            {uploadStates.map((s, i) => (
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
                      style={{ width: `${(s as any).progress ?? 0}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  {getFileIcon(doc.fileType)}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadDocument(doc.id)}
                      disabled={isOfflineMode}
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadDocument(doc.id)}
                      disabled={isOfflineMode}
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyLink(doc.id)}
                      disabled={isOfflineMode}
                      title="Copy Link"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-medium truncate" title={doc.name}>
                  {doc.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatSize(doc.size)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {documents.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileArchive className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No documents found</h3>
            <p>Upload your first document to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
