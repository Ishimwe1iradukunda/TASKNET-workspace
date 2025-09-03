import React, { useEffect, useMemo, useState } from 'react';
import { Scissors, FileText, Images, Split, Shrink, Merge, ChevronRight, Download, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { Document } from '~backend/workspace/documents/list';

interface PdfViewProps {
  isOfflineMode: boolean;
}

type Quality = 'low' | 'medium' | 'high';

export function PdfView({ isOfflineMode }: PdfViewProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);

  // Merge state
  const [mergeSelected, setMergeSelected] = useState<Record<string, boolean>>({});
  const [mergeOutputName, setMergeOutputName] = useState('merged.pdf');

  // Compress state
  const [compressSelected, setCompressSelected] = useState<string>('');
  const [compressQuality, setCompressQuality] = useState<Quality>('medium');

  // Split state
  const [splitSelected, setSplitSelected] = useState<string>('');
  const [splitType, setSplitType] = useState<'pages' | 'ranges'>('pages');
  const [splitPages, setSplitPages] = useState('1,2,3');
  const [splitRanges, setSplitRanges] = useState('1-3;5-7');

  // Images -> PDF
  const [imageSelected, setImageSelected] = useState<Record<string, boolean>>({});
  const [imagePdfName, setImagePdfName] = useState('images.pdf');

  // PDF -> Images
  const [pdfToImagesSelected, setPdfToImagesSelected] = useState<string>('');
  const [pdfToImagesFormat, setPdfToImagesFormat] = useState<'png' | 'jpeg'>('png');
  const [pdfToImagesQuality, setPdfToImagesQuality] = useState<number>(90);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  useEffect(() => {
    if (!isOfflineMode) {
      loadDocuments();
    }
  }, [isOfflineMode]);

  const loadDocuments = async () => {
    try {
      const resp = await backend.workspace.listDocuments();
      setDocuments(resp.documents);
    } catch (err) {
      console.error('Failed to load documents:', err);
      toast({ title: 'Error', description: 'Failed to load documents', variant: 'destructive' });
    }
  };

  const pdfDocs = useMemo(
    () => documents.filter(d => (d.fileType || '').toLowerCase().includes('pdf')),
    [documents]
  );
  const imageDocs = useMemo(
    () => documents.filter(d => (d.fileType || '').toLowerCase().startsWith('image/')),
    [documents]
  );

  const selectedMergeIds = useMemo(() => Object.entries(mergeSelected).filter(([, v]) => v).map(([id]) => id), [mergeSelected]);
  const selectedImageIds = useMemo(() => Object.entries(imageSelected).filter(([, v]) => v).map(([id]) => id), [imageSelected]);

  const openUrl = (url: string) => {
    const win = window.open(url, '_blank');
    if (!win) window.location.href = url;
  };

  const onMerge = async () => {
    if (selectedMergeIds.length < 2) {
      toast({ title: 'Select at least two PDFs', variant: 'destructive' });
      return;
    }
    try {
      const r = await backend.workspace.mergePdf({ pdfIds: selectedMergeIds, outputName: mergeOutputName || 'merged.pdf' });
      toast({ title: 'Merged', description: 'Merged PDF ready. Opening download…' });
      openUrl(r.downloadUrl);
    } catch (err) {
      console.error('Merge failed:', err);
      toast({ title: 'Error', description: 'Failed to merge PDFs', variant: 'destructive' });
    }
  };

  const onCompress = async () => {
    if (!compressSelected) {
      toast({ title: 'Select a PDF to compress', variant: 'destructive' });
      return;
    }
    try {
      const r = await backend.workspace.compressPdf({ pdfId: compressSelected, quality: compressQuality });
      toast({ title: 'Compressed', description: `Compression ratio: ${r.compressionRatio}%` });
      openUrl(r.downloadUrl);
    } catch (err) {
      console.error('Compress failed:', err);
      toast({ title: 'Error', description: 'Failed to compress PDF', variant: 'destructive' });
    }
  };

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
    if (!splitSelected) {
      toast({ title: 'Select a PDF to split', variant: 'destructive' });
      return;
    }
    try {
      if (splitType === 'pages') {
        const pages = parsePages(splitPages);
        if (pages.length === 0) {
          toast({ title: 'Invalid pages', description: 'Provide a comma-separated list like: 1,3,5', variant: 'destructive' });
          return;
        }
        const r = await backend.workspace.splitPdf({ pdfId: splitSelected, splitType: 'pages', pages });
        toast({ title: 'Split complete', description: `Created ${r.files.length} files. Opening first…` });
        if (r.files[0]?.downloadUrl) openUrl(r.files[0].downloadUrl);
      } else {
        const ranges = parseRanges(splitRanges);
        if (ranges.length === 0) {
          toast({ title: 'Invalid ranges', description: 'Provide ranges like: 1-3;5-7 or 10-12|chapter-2', variant: 'destructive' });
          return;
        }
        const r = await backend.workspace.splitPdf({ pdfId: splitSelected, splitType: 'ranges', ranges });
        toast({ title: 'Split complete', description: `Created ${r.files.length} files. Opening first…` });
        if (r.files[0]?.downloadUrl) openUrl(r.files[0].downloadUrl);
      }
    } catch (err) {
      console.error('Split failed:', err);
      toast({ title: 'Error', description: 'Failed to split PDF', variant: 'destructive' });
    }
  };

  const onImagesToPdf = async () => {
    if (selectedImageIds.length === 0) {
      toast({ title: 'Select at least one image', variant: 'destructive' });
      return;
    }
    try {
      const r = await backend.workspace.convertImageToPdf({ imageIds: selectedImageIds, outputName: imagePdfName || 'images.pdf' });
      toast({ title: 'Converted', description: 'Images combined into a PDF. Opening…' });
      openUrl(r.downloadUrl);
    } catch (err) {
      console.error('Images->PDF failed:', err);
      toast({ title: 'Error', description: 'Failed to convert images to PDF', variant: 'destructive' });
    }
  };

  const onPdfToImages = async () => {
    if (!pdfToImagesSelected) {
      toast({ title: 'Select a PDF', variant: 'destructive' });
      return;
    }
    try {
      const r = await backend.workspace.convertPdfToImages({
        pdfId: pdfToImagesSelected,
        format: pdfToImagesFormat,
        quality: pdfToImagesQuality,
      });
      setGeneratedImages(r.imageUrls);
      toast({ title: 'Converted', description: `Generated ${r.imageUrls.length} images` });
    } catch (err) {
      console.error('PDF->Images failed:', err);
      toast({ title: 'Error', description: 'Failed to convert PDF to images', variant: 'destructive' });
    }
  };

  if (isOfflineMode) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Scissors className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">PDF Tools Unavailable</h3>
          <p className="text-muted-foreground">PDF operations require an active internet connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold">PDF Tools</h2>
        <p className="text-muted-foreground">Merge, split, compress, and convert PDFs</p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {/* Merge PDFs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Merge className="w-5 h-5" />
                Merge PDFs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">Select two or more PDFs to merge</div>
              <div className="max-h-56 overflow-auto border rounded-md p-2">
                {pdfDocs.map(doc => (
                  <label key={doc.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={!!mergeSelected[doc.id]}
                      onChange={(e) => setMergeSelected(s => ({ ...s, [doc.id]: e.target.checked }))}
                    />
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm truncate">{doc.name}</span>
                  </label>
                ))}
                {pdfDocs.length === 0 && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    No PDFs found. Upload PDFs in Documents.
                  </div>
                )}
              </div>
              <Input
                placeholder="Output filename (e.g., merged.pdf)"
                value={mergeOutputName}
                onChange={(e) => setMergeOutputName(e.target.value)}
              />
              <Button onClick={onMerge} disabled={selectedMergeIds.length < 2} className="w-full">
                Merge and Download
              </Button>
            </CardContent>
          </Card>

          {/* Compress PDF */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shrink className="w-5 h-5" />
                Compress PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={compressSelected || ''} onValueChange={(v) => setCompressSelected(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select PDF" />
                </SelectTrigger>
                <SelectContent>
                  {pdfDocs.map(doc => (
                    <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={compressQuality} onValueChange={(v: Quality) => setCompressQuality(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (smallest size)</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High (best quality)</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={onCompress} disabled={!compressSelected} className="w-full">
                Compress and Download
              </Button>
            </CardContent>
          </Card>

          {/* Split PDF */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Split className="w-5 h-5" />
                Split PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={splitSelected || ''} onValueChange={(v) => setSplitSelected(v)}>
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
                  value={splitPages}
                  onChange={(e) => setSplitPages(e.target.value)}
                />
              ) : (
                <Input
                  placeholder="Ranges (e.g., 1-3;5-7 or 10-12|chapter-2)"
                  value={splitRanges}
                  onChange={(e) => setSplitRanges(e.target.value)}
                />
              )}
              <Button onClick={onSplit} disabled={!splitSelected} className="w-full">
                Split and Download
              </Button>
            </CardContent>
          </Card>

          {/* Images -> PDF */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Images className="w-5 h-5" />
                Images to PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">Select one or more images</div>
              <div className="max-h-56 overflow-auto border rounded-md p-2">
                {imageDocs.map(doc => (
                  <label key={doc.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={!!imageSelected[doc.id]}
                      onChange={(e) => setImageSelected(s => ({ ...s, [doc.id]: e.target.checked }))}
                    />
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm truncate">{doc.name}</span>
                  </label>
                ))}
                {imageDocs.length === 0 && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    No images found. Upload images in Documents.
                  </div>
                )}
              </div>
              <Input
                placeholder="Output PDF filename (e.g., images.pdf)"
                value={imagePdfName}
                onChange={(e) => setImagePdfName(e.target.value)}
              />
              <Button onClick={onImagesToPdf} disabled={selectedImageIds.length === 0} className="w-full">
                Convert and Download
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* PDF -> Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChevronRight className="w-5 h-5" />
              PDF to Images
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <Select value={pdfToImagesSelected || ''} onValueChange={(v) => setPdfToImagesSelected(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select PDF" />
                  </SelectTrigger>
                  <SelectContent>
                    {pdfDocs.map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={pdfToImagesFormat} onValueChange={(v: 'png' | 'jpeg') => setPdfToImagesFormat(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={pdfToImagesQuality}
                  onChange={(e) => setPdfToImagesQuality(Math.max(1, Math.min(100, parseInt(e.target.value || '0', 10) || 1)))}
                  placeholder="Quality (1-100)"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={onPdfToImages} disabled={!pdfToImagesSelected}>
                Convert
              </Button>
              {generatedImages.length > 0 && (
                <Button variant="outline" onClick={() => window.open(generatedImages[0], '_blank')}>
                  <Download className="w-4 h-4 mr-2" />
                  Open First Image
                </Button>
              )}
            </div>
            {generatedImages.length > 0 && (
              <div className="grid gap-3 md:grid-cols-3">
                {generatedImages.map((url, idx) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="block border rounded overflow-hidden">
                    <img src={url} alt={`Page ${idx + 1}`} className="w-full h-40 object-cover" />
                    <div className="p-2 text-xs text-muted-foreground truncate">{url}</div>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
