import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';

export function useDownloader() {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadFile = async ({ url, filename }: { url: string; filename: string }) => {
    setIsDownloading(true);
    toast({ title: 'Preparing download...', description: filename });
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);

    } catch (error) {
      console.error('Download failed:', error);
      toast({ title: 'Error', description: 'Failed to download file', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  return { downloadFile, isDownloading };
}
