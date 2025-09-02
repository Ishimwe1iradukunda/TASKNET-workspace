import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Download, File, FileText, FileArchive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { LocalStorageManager } from '../utils/localStorage';
import backend from '~backend/client';
import type { Document } from '~backend/workspace/documents/list';

interface DocumentsViewProps {
  isOfflineMode: boolean;
}

export function DocumentsView({ isOfflineMode }: DocumentsViewProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
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
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (isOfflineMode) {
      toast({
        title: "Offline Mode",
        description: "File uploads are disabled in offline mode.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { uploadUrl, documentId } = await backend.workspace.getUploadUrl({
        name: file.name,
        type: file.type,
        size: file.size,
      });

      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
      loadDocuments();
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (isOfflineMode) {
      LocalStorageManager.deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } else {
      await backend.workspace.deleteDocument({ id });
      setDocuments(prev => prev.filter(d => d.id !== id));
    }
    toast({
      title: "Success",
      description: "Document deleted",
    });
  };

  const handleDownloadDocument = async (id: string) => {
    if (isOfflineMode) {
      toast({
        title: "Offline Mode",
        description: "Downloads are not available in offline mode.",
        variant: "destructive",
      });
      return;
    }
    try {
      const { downloadUrl } = await backend.workspace.getDocument({ id });
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Failed to get download URL:', error);
      toast({
        title: "Error",
        description: "Failed to get download URL",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="w-8 h-8 text-blue-500" />;
    if (fileType.includes('zip') || fileType.includes('archive')) return <FileArchive className="w-8 h-8 text-yellow-500" />;
    return <File className="w-8 h-8 text-muted-foreground" />;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h2 className="text-2xl font-bold">Documents</h2>
        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading || isOfflineMode}>
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Upload File'}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
          disabled={isUploading || isOfflineMode}
        />
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {documents.map(doc => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  {getFileIcon(doc.fileType)}
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleDownloadDocument(doc.id)} disabled={isOfflineMode}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-medium truncate">{doc.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(doc.size / 1024 / 1024).toFixed(2)} MB
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
