import React, { useState, useEffect } from 'react';
import { FileImage, Scissors, Archive, Merge, Upload, Download, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { LocalStorageManager } from '../utils/localStorage';
import backend from '~backend/client';
import type { Document } from '~backend/workspace/documents/list';

interface PdfToolsViewProps {
  isOfflineMode: boolean;
}

export function PdfToolsView({ isOfflineMode }: PdfToolsViewProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  const pdfDocuments = documents.filter(doc => doc.fileType.includes('pdf'));
  const imageDocuments = documents.filter(doc => 
    doc.fileType.includes('image') || 
    doc.fileType.includes('png') || 
    doc.fileType.includes('jpg') || 
    doc.fileType.includes('jpeg')
  );

  if (isOfflineMode) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold">PDF Tools</h2>
          <p className="text-muted-foreground">Convert, compress, split and merge PDF files</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <File className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">PDF Tools Unavailable</h3>
            <p className="text-muted-foreground">
              PDF processing tools require online mode to function properly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold mb-2">PDF Tools</h2>
        <p className="text-muted-foreground">
          Convert, compress, split and merge PDF files
        </p>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          
          {/* Convert Images to PDF */}
          <ConvertImagesToPdf 
            imageDocuments={imageDocuments}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onSuccess={loadDocuments}
          />
          
          {/* Convert PDF to Images */}
          <ConvertPdfToImages 
            pdfDocuments={pdfDocuments}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
          
          {/* Compress PDF */}
          <CompressPdf 
            pdfDocuments={pdfDocuments}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onSuccess={loadDocuments}
          />
          
          {/* Split PDF */}
          <SplitPdf 
            pdfDocuments={pdfDocuments}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onSuccess={loadDocuments}
          />
          
          {/* Merge PDFs */}
          <MergePdfs 
            pdfDocuments={pdfDocuments}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onSuccess={loadDocuments}
          />
          
        </div>
      </div>
    </div>
  );
}

function ConvertImagesToPdf({ imageDocuments, isLoading, setIsLoading, onSuccess }: {
  imageDocuments: Document[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onSuccess: () => void;
}) {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [outputName, setOutputName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleConvert = async () => {
    if (selectedImages.length === 0 || !outputName.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await backend.workspace.convertImageToPdf({
        imageIds: selectedImages,
        outputName: outputName.endsWith('.pdf') ? outputName : `${outputName}.pdf`,
      });
      
      toast({
        title: "Success",
        description: "Images converted to PDF successfully",
      });
      
      setSelectedImages([]);
      setOutputName('');
      setIsDialogOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to convert images:', error);
      toast({
        title: "Error",
        description: "Failed to convert images to PDF",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="w-5 h-5" />
          Images to PDF
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Convert multiple images into a single PDF document
        </p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" disabled={imageDocuments.length === 0}>
              <FileImage className="w-4 h-4 mr-2" />
              Convert Images
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Convert Images to PDF</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Images</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                  {imageDocuments.map(doc => (
                    <label key={doc.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedImages.includes(doc.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedImages(prev => [...prev, doc.id]);
                          } else {
                            setSelectedImages(prev => prev.filter(id => id !== doc.id));
                          }
                        }}
                      />
                      <span className="text-sm">{doc.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="output-name">Output PDF Name</Label>
                <Input
                  id="output-name"
                  placeholder="combined-images.pdf"
                  value={outputName}
                  onChange={(e) => setOutputName(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleConvert} 
                  disabled={selectedImages.length === 0 || !outputName.trim() || isLoading}
                >
                  {isLoading ? 'Converting...' : 'Convert to PDF'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function ConvertPdfToImages({ pdfDocuments, isLoading, setIsLoading }: {
  pdfDocuments: Document[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}) {
  const [selectedPdf, setSelectedPdf] = useState('');
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState(90);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleConvert = async () => {
    if (!selectedPdf) return;
    
    setIsLoading(true);
    try {
      const response = await backend.workspace.convertPdfToImages({
        pdfId: selectedPdf,
        format,
        quality,
      });
      
      toast({
        title: "Success",
        description: `PDF converted to ${response.imageUrls.length} images`,
      });
      
      setSelectedPdf('');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to convert PDF:', error);
      toast({
        title: "Error",
        description: "Failed to convert PDF to images",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="w-5 h-5" />
          PDF to Images
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Extract pages from PDF as individual image files
        </p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" disabled={pdfDocuments.length === 0}>
              <FileImage className="w-4 h-4 mr-2" />
              Convert PDF
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convert PDF to Images</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select PDF</Label>
                <Select value={selectedPdf} onValueChange={setSelectedPdf}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a PDF file" />
                  </SelectTrigger>
                  <SelectContent>
                    {pdfDocuments.map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Format</Label>
                  <Select value={format} onValueChange={(value: 'png' | 'jpeg') => setFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quality (%)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value) || 90)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleConvert} 
                  disabled={!selectedPdf || isLoading}
                >
                  {isLoading ? 'Converting...' : 'Convert to Images'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function CompressPdf({ pdfDocuments, isLoading, setIsLoading, onSuccess }: {
  pdfDocuments: Document[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onSuccess: () => void;
}) {
  const [selectedPdf, setSelectedPdf] = useState('');
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [outputName, setOutputName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleCompress = async () => {
    if (!selectedPdf) return;
    
    setIsLoading(true);
    try {
      const response = await backend.workspace.compressPdf({
        pdfId: selectedPdf,
        quality,
        outputName: outputName || undefined,
      });
      
      toast({
        title: "Success",
        description: `PDF compressed by ${response.compressionRatio}%`,
      });
      
      setSelectedPdf('');
      setOutputName('');
      setIsDialogOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to compress PDF:', error);
      toast({
        title: "Error",
        description: "Failed to compress PDF",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="w-5 h-5" />
          Compress PDF
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Reduce PDF file size while maintaining quality
        </p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" disabled={pdfDocuments.length === 0}>
              <Archive className="w-4 h-4 mr-2" />
              Compress PDF
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compress PDF</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select PDF</Label>
                <Select value={selectedPdf} onValueChange={setSelectedPdf}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a PDF file" />
                  </SelectTrigger>
                  <SelectContent>
                    {pdfDocuments.map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Compression Quality</Label>
                <Select value={quality} onValueChange={(value: 'low' | 'medium' | 'high') => setQuality(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High Quality (less compression)</SelectItem>
                    <SelectItem value="medium">Medium Quality</SelectItem>
                    <SelectItem value="low">Low Quality (more compression)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Output Name (optional)</Label>
                <Input
                  placeholder="compressed.pdf"
                  value={outputName}
                  onChange={(e) => setOutputName(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCompress} 
                  disabled={!selectedPdf || isLoading}
                >
                  {isLoading ? 'Compressing...' : 'Compress PDF'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function SplitPdf({ pdfDocuments, isLoading, setIsLoading, onSuccess }: {
  pdfDocuments: Document[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onSuccess: () => void;
}) {
  const [selectedPdf, setSelectedPdf] = useState('');
  const [splitType, setSplitType] = useState<'pages' | 'ranges'>('pages');
  const [pages, setPages] = useState('');
  const [ranges, setRanges] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSplit = async () => {
    if (!selectedPdf) return;
    
    let splitData: any = { pdfId: selectedPdf, splitType };
    
    if (splitType === 'pages') {
      const pageNumbers = pages.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
      if (pageNumbers.length === 0) return;
      splitData.pages = pageNumbers;
    } else {
      const rangeData = ranges.split('\n').map(line => {
        const parts = line.trim().split(',');
        if (parts.length >= 2) {
          const start = parseInt(parts[0]);
          const end = parseInt(parts[1]);
          const name = parts[2]?.trim();
          if (!isNaN(start) && !isNaN(end)) {
            return { start, end, name };
          }
        }
        return null;
      }).filter(Boolean);
      if (rangeData.length === 0) return;
      splitData.ranges = rangeData;
    }
    
    setIsLoading(true);
    try {
      const response = await backend.workspace.splitPdf(splitData);
      
      toast({
        title: "Success",
        description: `PDF split into ${response.files.length} files`,
      });
      
      setSelectedPdf('');
      setPages('');
      setRanges('');
      setIsDialogOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to split PDF:', error);
      toast({
        title: "Error",
        description: "Failed to split PDF",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="w-5 h-5" />
          Split PDF
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Extract specific pages or ranges from a PDF
        </p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" disabled={pdfDocuments.length === 0}>
              <Scissors className="w-4 h-4 mr-2" />
              Split PDF
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Split PDF</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select PDF</Label>
                <Select value={selectedPdf} onValueChange={setSelectedPdf}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a PDF file" />
                  </SelectTrigger>
                  <SelectContent>
                    {pdfDocuments.map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Split Method</Label>
                <Select value={splitType} onValueChange={(value: 'pages' | 'ranges') => setSplitType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pages">Individual Pages</SelectItem>
                    <SelectItem value="ranges">Page Ranges</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {splitType === 'pages' ? (
                <div>
                  <Label>Page Numbers (comma-separated)</Label>
                  <Input
                    placeholder="1, 3, 5, 7"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter page numbers separated by commas
                  </p>
                </div>
              ) : (
                <div>
                  <Label>Page Ranges (one per line)</Label>
                  <Textarea
                    placeholder="1,5,first_section&#10;6,10,second_section&#10;11,15"
                    value={ranges}
                    onChange={(e) => setRanges(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: start,end,name (name is optional)
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  onClick={handleSplit} 
                  disabled={!selectedPdf || (!pages && !ranges) || isLoading}
                >
                  {isLoading ? 'Splitting...' : 'Split PDF'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function MergePdfs({ pdfDocuments, isLoading, setIsLoading, onSuccess }: {
  pdfDocuments: Document[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onSuccess: () => void;
}) {
  const [selectedPdfs, setSelectedPdfs] = useState<string[]>([]);
  const [outputName, setOutputName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleMerge = async () => {
    if (selectedPdfs.length < 2 || !outputName.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await backend.workspace.mergePdf({
        pdfIds: selectedPdfs,
        outputName: outputName.endsWith('.pdf') ? outputName : `${outputName}.pdf`,
      });
      
      toast({
        title: "Success",
        description: `${selectedPdfs.length} PDFs merged successfully`,
      });
      
      setSelectedPdfs([]);
      setOutputName('');
      setIsDialogOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to merge PDFs:', error);
      toast({
        title: "Error",
        description: "Failed to merge PDFs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Combine multiple PDF files into a single document
        </p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" disabled={pdfDocuments.length < 2}>
              <Merge className="w-4 h-4 mr-2" />
              Merge PDFs
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Merge PDFs</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select PDFs to Merge</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                  {pdfDocuments.map(doc => (
                    <label key={doc.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPdfs.includes(doc.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPdfs(prev => [...prev, doc.id]);
                          } else {
                            setSelectedPdfs(prev => prev.filter(id => id !== doc.id));
                          }
                        }}
                      />
                      <span className="text-sm">{doc.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Files will be merged in the order selected
                </p>
              </div>
              <div>
                <Label htmlFor="merge-output-name">Output PDF Name</Label>
                <Input
                  id="merge-output-name"
                  placeholder="merged-document.pdf"
                  value={outputName}
                  onChange={(e) => setOutputName(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleMerge} 
                  disabled={selectedPdfs.length < 2 || !outputName.trim() || isLoading}
                >
                  {isLoading ? 'Merging...' : 'Merge PDFs'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
