import React, { useState, useEffect } from 'react';
import { Trash2, Download, File, FileText, FileArchive, Link as LinkIcon, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { LocalStorageManager } from '../utils/localStorage';
import backend from '~backend/client';
import type { Document } from '~backend/workspace/documents/list';
import { useUploader } from '../hooks/useUploader';
import { UploadProgress } from './UploadProgress';
import { Dropzone } from './Dropzone';
import { useDownloader } from '../hooks/useDownloader';

interface DocumentsViewProps {
  isOfflineMode: boolean;
}

export function DocumentsView({ isOfflineMode }: DocumentsViewProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const { toast } = useToast();
  const { downloadFile, isDownloading: isDocDownloading } = useDownloader();

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

  const { uploadFiles, isUploading, uploadStates } = useUploader({ onUploadComplete: loadDocuments });

  useEffect(() => {
    loadDocuments();
  }, [isOfflineMode]);

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

  const handleDownloadDocument = async (doc: Document) => {
    if (isOfflineMode) {
      toast({
        title: 'Offline Mode',
        description: 'Downloads are not available in offline mode.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const { downloadUrl } = await backend.workspace.getDocument({ id: doc.id });
      await downloadFile({ url: downloadUrl, filename: doc.name });
    } catch (error) {
      console.error('Failed to get download URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to get download URL',
        variant: 'destructive',
      });
    }
  };

  const handlePreviewDocument = async (doc: Document) => {
    if (isOfflineMode) {
      toast({
        title: 'Offline Mode',
        description: 'Preview is not available in offline mode.',
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'Generating preview...', description: 'Please wait a moment.' });
    try {
      const { downloadUrl } = await backend.workspace.getDocument({ id: doc.id });
      
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const fileUrl = URL.createObjectURL(blob);
      
      const win = window.open(fileUrl, '_blank');
      if (win) {
        win.focus();
      } else {
        // Fallback for browsers that block popups
        toast({
          title: 'Popup blocked',
          description: 'Please allow popups for this site to preview files.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to preview document:', error);
      toast({
        title: 'Error',
        description: 'Could not open file for preview. Please try downloading it.',
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
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold">Documents</h2>
        <p className="text-muted-foreground">
          Store and manage your files securely.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <Dropzone onFilesAdded={uploadFiles} disabled={isUploading || isOfflineMode} />
        </div>

        {uploadStates.length > 0 && (
          <div className="mb-6">
            <UploadProgress uploadStates={uploadStates} />
          </div>
        )}

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
                      onClick={() => handleDownloadDocument(doc)}
                      disabled={isOfflineMode || isDocDownloading}
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreviewDocument(doc)}
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

        {documents.length === 0 && !isUploading && (
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
