import React, { useState, useMemo } from 'react';
import { FileText, Download, AlertTriangle, Merge, Shrink, Split, Images, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { Document } from '~backend/workspace/documents/list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDownloader } from '../hooks/useDownloader';

interface PdfToolProps {
  pdfDocs: Document[];
  imageDocs: Document[];
  onActionComplete: () => void;
}

type Quality = 'low' | 'medium' | 'high';

export function MergePDFs({ pdfDocs, onActionComplete }: Pick<PdfToolProps, 'pdfDocs' | 'onActionComplete'>) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [outputName, setOutputName] = useState('merged.pdf');
  const { toast } = useToast();
  const { downloadFile, isDownloading } = useDownloader();

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([id]) => id), [selected]);

  const onMerge = async () => {
    if (selectedIds.length < 2) {
      toast({ title: 'Select at least two PDFs', variant: 'destructive' });
      return;
    }
    try {
      const r = await backend.workspace.mergePdf({ pdfIds: selectedIds, outputName: outputName || 'merged.pdf' });
      toast({ title: 'Merged', description: 'Merged PDF ready. Starting download…' });
      await downloadFile({ url: r.downloadUrl, filename: outputName || 'merged.pdf' });
      onActionComplete();
    } catch (err) {
      console.error('Merge failed:', err);
      toast({ title: 'Error', description: 'Failed to merge PDFs', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Merge className="w-5 h-5" />
          Merge PDFs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">Select two or more PDFs to merge</div>
        <div className="max-h-40 overflow-auto border rounded-md p-2 space-y-1">
          {pdfDocs.map(doc => (
            <label key={doc.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/50 cursor-pointer">
              <input
                type="checkbox"
                checked={!!selected[doc.id]}
                onChange={(e) => setSelected(s => ({ ...s, [doc.id]: e.target.checked }))}
              />
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm truncate">{doc.name}</span>
            </label>
          ))}
          {pdfDocs.length === 0 && (
            <div className="text-sm text-muted-foreground flex items-center gap-2 p-2">
              <AlertTriangle className="w-4 h-4" />
              No PDFs found.
            </div>
          )}
        </div>
        <Input
          placeholder="Output filename (e.g., merged.pdf)"
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
        />
        <Button onClick={onMerge} disabled={selectedIds.length < 2 || isDownloading} className="w-full">
          {isDownloading ? 'Merging...' : 'Merge and Download'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function CompressPDF({ pdfDocs, onActionComplete }: Pick<PdfToolProps, 'pdfDocs' | 'onActionComplete'>) {
  const [selected, setSelected] = useState<string>('');
  const [quality, setQuality] = useState<Quality>('medium');
  const { toast } = useToast();
  const { downloadFile, isDownloading } = useDownloader();

  const onCompress = async () => {
    if (!selected) {
      toast({ title: 'Select a PDF to compress', variant: 'destructive' });
      return;
    }
    try {
      const r = await backend.workspace.compressPdf({ pdfId: selected, quality: quality });
      toast({ title: 'Compressed', description: `Compression ratio: ${r.compressionRatio}%` });
      const selectedDoc = pdfDocs.find(d => d.id === selected);
      const filename = `compressed_${selectedDoc?.name || 'file.pdf'}`;
      await downloadFile({ url: r.downloadUrl, filename });
      onActionComplete();
    } catch (err) {
      console.error('Compress failed:', err);
      toast({ title: 'Error', description: 'Failed to compress PDF', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shrink className="w-5 h-5" />
          Compress PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={selected || ''} onValueChange={(v) => setSelected(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select PDF" />
          </SelectTrigger>
          <SelectContent>
            {pdfDocs.map(doc => (
              <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={quality} onValueChange={(v: Quality) => setQuality(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Quality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low (smallest size)</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High (best quality)</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onCompress} disabled={!selected || isDownloading} className="w-full">
          {isDownloading ? 'Compressing...' : 'Compress and Download'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function SplitPDF({ pdfDocs, onActionComplete }: Pick<PdfToolProps, 'pdfDocs' | 'onActionComplete'>) {
  const [selected, setSelected] = useState<string>('');
  const [splitType, setSplitType] = useState<'pages' | 'ranges'>('pages');
  const [pages, setPages] = useState('1,2,3');
  const [ranges, setRanges] = useState('1-3;5-7');
  const { toast } = useToast();
  const { downloadFile, isDownloading } = useDownloader();

  const parsePages = (s: string) => {
    return s.split(',').map(x => parseInt(x.trim(), 10)).filter(n => Number.isFinite(n) && n > 0);
  };

  const parseRanges = (s: string) => {
    const parts = s.split(/;|,/).map(x => x.trim()).filter(Boolean);
    const ranges: Array<{ start: number; end: number; name?: string }> = [];
    for (const p of parts) {
      const [range, name] = p.split('|').map(x => x.trim());
      const [a, b] = range.split('-').map(x => parseInt(x.trim(), 10));
      if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b >= a) {
        ranges.push({ start: a, end: b, name: name || undefined });
      }
    }
    return ranges;
  };

  const onSplit = async () => {
    if (!selected) {
      toast({ title: 'Select a PDF to split', variant: 'destructive' });
      return;
    }
    try {
      let r;
      if (splitType === 'pages') {
        const parsed = parsePages(pages);
        if (parsed.length === 0) {
          toast({ title: 'Invalid pages', description: 'Provide a comma-separated list like: 1,3,5', variant: 'destructive' });
          return;
        }
        r = await backend.workspace.splitPdf({ pdfId: selected, splitType: 'pages', pages: parsed });
      } else {
        const parsed = parseRanges(ranges);
        if (parsed.length === 0) {
          toast({ title: 'Invalid ranges', description: 'Provide ranges like: 1-3;5-7 or 10-12|chapter-2', variant: 'destructive' });
          return;
        }
        r = await backend.workspace.splitPdf({ pdfId: selected, splitType: 'ranges', ranges: parsed });
      }
      toast({ title: 'Split complete', description: `Created ${r.files.length} files. Downloading first…` });
      if (r.files[0]?.downloadUrl) {
        await downloadFile({ url: r.files[0].downloadUrl, filename: r.files[0].filename });
      }
      onActionComplete();
    } catch (err) {
      console.error('Split failed:', err);
      toast({ title: 'Error', description: 'Failed to split PDF', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Split className="w-5 h-5" />
          Split PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={selected || ''} onValueChange={(v) => setSelected(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select PDF" />
          </SelectTrigger>
          <SelectContent>
            {pdfDocs.map(doc => (
              <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={splitType === 'pages' ? 'default' : 'outline'}
            onClick={() => setSplitType('pages')}
          >
            Pages
          </Button>
          <Button
            variant={splitType === 'ranges' ? 'default' : 'outline'}
            onClick={() => setSplitType('ranges')}
          >
            Ranges
          </Button>
        </div>
        {splitType === 'pages' ? (
          <Input
            placeholder="Pages (e.g., 1,3,5)"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
          />
        ) : (
          <Input
            placeholder="Ranges (e.g., 1-3;5-7)"
            value={ranges}
            onChange={(e) => setRanges(e.target.value)}
          />
        )}
        <Button onClick={onSplit} disabled={!selected || isDownloading} className="w-full">
          {isDownloading ? 'Splitting...' : 'Split and Download'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ImagesToPDF({ imageDocs, onActionComplete }: Pick<PdfToolProps, 'imageDocs' | 'onActionComplete'>) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [outputName, setOutputName] = useState('images.pdf');
  const { toast } = useToast();
  const { downloadFile, isDownloading } = useDownloader();

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([id]) => id), [selected]);

  const onConvert = async () => {
    if (selectedIds.length === 0) {
      toast({ title: 'Select at least one image', variant: 'destructive' });
      return;
    }
    try {
      const r = await backend.workspace.convertImageToPdf({ imageIds: selectedIds, outputName: outputName || 'images.pdf' });
      toast({ title: 'Converted', description: 'Images combined into a PDF. Starting download…' });
      await downloadFile({ url: r.downloadUrl, filename: outputName || 'images.pdf' });
      onActionComplete();
    } catch (err) {
      console.error('Images->PDF failed:', err);
      toast({ title: 'Error', description: 'Failed to convert images to PDF', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Images className="w-5 h-5" />
          Images to PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">Select one or more images</div>
        <div className="max-h-40 overflow-auto border rounded-md p-2 space-y-1">
          {imageDocs.map(doc => (
            <label key={doc.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/50 cursor-pointer">
              <input
                type="checkbox"
                checked={!!selected[doc.id]}
                onChange={(e) => setSelected(s => ({ ...s, [doc.id]: e.target.checked }))}
              />
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm truncate">{doc.name}</span>
            </label>
          ))}
          {imageDocs.length === 0 && (
            <div className="text-sm text-muted-foreground flex items-center gap-2 p-2">
              <AlertTriangle className="w-4 h-4" />
              No images found.
            </div>
          )}
        </div>
        <Input
          placeholder="Output PDF filename (e.g., images.pdf)"
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
        />
        <Button onClick={onConvert} disabled={selectedIds.length === 0 || isDownloading} className="w-full">
          {isDownloading ? 'Converting...' : 'Convert and Download'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function PDFToImages({ pdfDocs, onActionComplete }: Pick<PdfToolProps, 'pdfDocs' | 'onActionComplete'>) {
  const [selected, setSelected] = useState<string>('');
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState<number>(90);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const { toast } = useToast();
  const { isDownloading } = useDownloader();

  const onConvert = async () => {
    if (!selected) {
      toast({ title: 'Select a PDF', variant: 'destructive' });
      return;
    }
    try {
      const r = await backend.workspace.convertPdfToImages({
        pdfId: selected,
        format: format,
        quality: quality,
      });
      setGeneratedImages(r.imageUrls);
      toast({ title: 'Converted', description: `Generated ${r.imageUrls.length} images` });
      onActionComplete();
    } catch (err) {
      console.error('PDF->Images failed:', err);
      toast({ title: 'Error', description: 'Failed to convert PDF to images', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChevronRight className="w-5 h-5" />
          PDF to Images
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={selected || ''} onValueChange={(v) => setSelected(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select PDF" />
          </SelectTrigger>
          <SelectContent>
            {pdfDocs.map(doc => (
              <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Select value={format} onValueChange={(v: 'png' | 'jpeg') => setFormat(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpeg">JPEG</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={1}
            max={100}
            value={quality}
            onChange={(e) => setQuality(Math.max(1, Math.min(100, parseInt(e.target.value || '0', 10) || 1)))}
            placeholder="Quality (1-100)"
          />
        </div>
        <Button onClick={onConvert} disabled={!selected || isDownloading}>
          {isDownloading ? 'Converting...' : 'Convert'}
        </Button>
        {generatedImages.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Generated Images:</p>
            <div className="grid gap-3 md:grid-cols-2">
              {generatedImages.map((url, idx) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="block border rounded overflow-hidden">
                  <img src={url} alt={`Page ${idx + 1}`} className="w-full h-20 object-cover" />
                  <div className="p-2 text-xs text-muted-foreground truncate">Page {idx + 1}</div>
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
