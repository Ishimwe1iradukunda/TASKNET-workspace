import React, { useState, useRef, useEffect, useMemo } from 'react';
import { QrCode, Mic, FileImage, Scissors, Archive, Merge, Download, Upload, Link, Palette, Hash, Type, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import QRCode from 'qrcode.react';
import backend from '~backend/client';
import type { Document } from '~backend/workspace/documents/list';
import { MergePDFs, CompressPDF, SplitPDF, ImagesToPDF, PDFToImages } from './PdfTools';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ToolsViewProps {
  isOfflineMode: boolean;
}

export function ToolsView({ isOfflineMode }: ToolsViewProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);

  const loadDocuments = async () => {
    if (isOfflineMode) return;
    try {
      const resp = await backend.workspace.listDocuments();
      setDocuments(resp.documents);
    } catch (err) {
      console.error('Failed to load documents:', err);
      toast({ title: 'Error', description: 'Failed to load documents', variant: 'destructive' });
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [isOfflineMode]);

  const pdfDocs = useMemo(
    () => documents.filter(d => (d.fileType || '').toLowerCase().includes('pdf')),
    [documents]
  );
  const imageDocs = useMemo(
    () => documents.filter(d => (d.fileType || '').toLowerCase().startsWith('image/')),
    [documents]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold mb-2">Tools</h2>
        <p className="text-muted-foreground">
          A collection of useful utilities to enhance your productivity.
        </p>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="media" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generators">Generators</TabsTrigger>
            <TabsTrigger value="converters">Converters</TabsTrigger>
            <TabsTrigger value="utilities">Utilities</TabsTrigger>
            <TabsTrigger value="media">Media &amp; PDF</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generators" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <QRCodeGenerator />
              <PasswordGenerator />
              <UUIDGenerator />
              <ColorPaletteGenerator />
            </div>
          </TabsContent>
          
          <TabsContent value="converters" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Base64Converter />
              <URLEncoder />
              <JSONFormatter />
              <TextCaseConverter />
            </div>
          </TabsContent>
          
          <TabsContent value="utilities" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <HashGenerator />
              <TimestampConverter />
              <WordCounter />
              <IPAddressInfo />
            </div>
          </TabsContent>
          
          <TabsContent value="media" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <SoundRecorder />
              <ImageResizer />
              <FileConverter />
              <MergePDFs pdfDocs={pdfDocs} onActionComplete={loadDocuments} />
              <CompressPDF pdfDocs={pdfDocs} onActionComplete={loadDocuments} />
              <SplitPDF pdfDocs={pdfDocs} onActionComplete={loadDocuments} />
              <ImagesToPDF imageDocs={imageDocs} onActionComplete={loadDocuments} />
              <PDFToImages pdfDocs={pdfDocs} onActionComplete={loadDocuments} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function QRCodeGenerator() {
  const [qrValue, setQrValue] = useState('');
  const [qrSize, setQrSize] = useState(256);

  const downloadQR = () => {
    const canvas = document.querySelector('#qr-code canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL();
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qrcode.png';
      a.click();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          QR Code Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Enter text or URL to generate QR code"
          value={qrValue}
          onChange={(e) => setQrValue(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Size (px)"
          value={qrSize}
          onChange={(e) => setQrSize(Number(e.target.value))}
          min="128"
          max="512"
        />
        {qrValue && (
          <div className="space-y-2">
            <div id="qr-code" className="p-4 bg-white rounded-md flex justify-center">
              <QRCode value={qrValue} size={Math.min(qrSize, 256)} />
            </div>
            <Button onClick={downloadQR} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PasswordGenerator() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);

  const generatePassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let chars = lowercase + uppercase;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;
    
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(password);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="w-5 h-5" />
          Password Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="number"
          placeholder="Length"
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          min="4"
          max="128"
        />
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="include-numbers"
            checked={includeNumbers}
            onChange={(e) => setIncludeNumbers(e.target.checked)}
          />
          <label htmlFor="include-numbers" className="text-sm">Include Numbers</label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="include-symbols"
            checked={includeSymbols}
            onChange={(e) => setIncludeSymbols(e.target.checked)}
          />
          <label htmlFor="include-symbols" className="text-sm">Include Symbols</label>
        </div>
        <Button onClick={generatePassword} className="w-full">
          Generate Password
        </Button>
        {password && (
          <div className="space-y-2">
            <Input value={password} readOnly />
            <Button onClick={copyPassword} variant="outline" className="w-full">
              Copy to Clipboard
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UUIDGenerator() {
  const [uuid, setUuid] = useState('');

  const generateUUID = () => {
    setUuid(crypto.randomUUID());
  };

  const copyUUID = () => {
    navigator.clipboard.writeText(uuid);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="w-5 h-5" />
          UUID Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={generateUUID} className="w-full">
          Generate UUID
        </Button>
        {uuid && (
          <div className="space-y-2">
            <Input value={uuid} readOnly />
            <Button onClick={copyUUID} variant="outline" className="w-full">
              Copy to Clipboard
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ColorPaletteGenerator() {
  const [colors, setColors] = useState<string[]>([]);

  const generatePalette = () => {
    const newColors = [];
    for (let i = 0; i < 5; i++) {
      const color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
      newColors.push(color);
    }
    setColors(newColors);
  };

  const copyColor = (color: string) => {
    navigator.clipboard.writeText(color);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Color Palette Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={generatePalette} className="w-full">
          Generate Palette
        </Button>
        {colors.length > 0 && (
          <div className="grid grid-cols-5 gap-2">
            {colors.map((color, index) => (
              <div key={index} className="space-y-1">
                <div
                  className="w-full h-16 rounded cursor-pointer border"
                  style={{ backgroundColor: color }}
                  onClick={() => copyColor(color)}
                  title="Click to copy"
                />
                <div className="text-xs text-center font-mono">{color}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Base64Converter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  const convert = () => {
    try {
      if (mode === 'encode') {
        setOutput(btoa(input));
      } else {
        setOutput(atob(input));
      }
    } catch (error) {
      setOutput('Error: Invalid input for decoding');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="w-5 h-5" />
          Base64 Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={mode === 'encode' ? 'default' : 'outline'}
            onClick={() => setMode('encode')}
            className="flex-1"
          >
            Encode
          </Button>
          <Button
            variant={mode === 'decode' ? 'default' : 'outline'}
            onClick={() => setMode('decode')}
            className="flex-1"
          >
            Decode
          </Button>
        </div>
        <Textarea
          placeholder={`Enter text to ${mode}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button onClick={convert} className="w-full">
          {mode === 'encode' ? 'Encode' : 'Decode'}
        </Button>
        {output && (
          <Textarea value={output} readOnly />
        )}
      </CardContent>
    </Card>
  );
}

function URLEncoder() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  const convert = () => {
    try {
      if (mode === 'encode') {
        setOutput(encodeURIComponent(input));
      } else {
        setOutput(decodeURIComponent(input));
      }
    } catch (error) {
      setOutput('Error: Invalid input for decoding');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="w-5 h-5" />
          URL Encoder/Decoder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={mode === 'encode' ? 'default' : 'outline'}
            onClick={() => setMode('encode')}
            className="flex-1"
          >
            Encode
          </Button>
          <Button
            variant={mode === 'decode' ? 'default' : 'outline'}
            onClick={() => setMode('decode')}
            className="flex-1"
          >
            Decode
          </Button>
        </div>
        <Input
          placeholder={`Enter URL to ${mode}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button onClick={convert} className="w-full">
          {mode === 'encode' ? 'Encode' : 'Decode'}
        </Button>
        {output && (
          <Input value={output} readOnly />
        )}
      </CardContent>
    </Card>
  );
}

function JSONFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
    } catch (error) {
      setOutput('Error: Invalid JSON');
    }
  };

  const minifyJSON = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
    } catch (error) {
      setOutput('Error: Invalid JSON');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="w-5 h-5" />
          JSON Formatter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Enter JSON to format"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
        />
        <div className="flex gap-2">
          <Button onClick={formatJSON} className="flex-1">
            Format
          </Button>
          <Button onClick={minifyJSON} variant="outline" className="flex-1">
            Minify
          </Button>
        </div>
        {output && (
          <Textarea value={output} readOnly rows={6} />
        )}
      </CardContent>
    </Card>
  );
}

function TextCaseConverter() {
  const [input, setInput] = useState('');

  const convertCase = (type: string) => {
    switch (type) {
      case 'upper':
        return input.toUpperCase();
      case 'lower':
        return input.toLowerCase();
      case 'title':
        return input.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
      case 'camel':
        return input.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
          index === 0 ? word.toLowerCase() : word.toUpperCase()
        ).replace(/\s+/g, '');
      default:
        return input;
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="w-5 h-5" />
          Text Case Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Enter text to convert"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="space-y-2">
          {['upper', 'lower', 'title', 'camel'].map((type) => (
            <div key={type} className="flex items-center gap-2">
              <Input value={convertCase(type)} readOnly className="flex-1" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyText(convertCase(type))}
              >
                Copy
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function HashGenerator() {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState<{[key: string]: string}>({});

  const generateHashes = async () => {
    if (!input) return;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    
    const hashTypes = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
    const results: {[key: string]: string} = {};
    
    for (const type of hashTypes) {
      try {
        const hashBuffer = await crypto.subtle.digest(type, data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        results[type] = hashHex;
      } catch (error) {
        results[type] = 'Error generating hash';
      }
    }
    
    setHashes(results);
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="w-5 h-5" />
          Hash Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Enter text to hash"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button onClick={generateHashes} className="w-full">
          Generate Hashes
        </Button>
        {Object.entries(hashes).map(([type, hash]) => (
          <div key={type} className="space-y-1">
            <label className="text-sm font-medium">{type}</label>
            <div className="flex gap-2">
              <Input value={hash} readOnly className="flex-1 font-mono text-xs" />
              <Button size="sm" variant="outline" onClick={() => copyHash(hash)}>
                Copy
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TimestampConverter() {
  const [timestamp, setTimestamp] = useState('');
  const [date, setDate] = useState('');

  const convertTimestamp = () => {
    try {
      const ts = parseInt(timestamp);
      const d = new Date(ts * 1000);
      setDate(d.toISOString());
    } catch (error) {
      setDate('Invalid timestamp');
    }
  };

  const getCurrentTimestamp = () => {
    const now = Math.floor(Date.now() / 1000);
    setTimestamp(now.toString());
    convertTimestamp();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Timestamp Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Enter Unix timestamp"
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
        />
        <div className="flex gap-2">
          <Button onClick={convertTimestamp} className="flex-1">
            Convert
          </Button>
          <Button onClick={getCurrentTimestamp} variant="outline" className="flex-1">
            Current Time
          </Button>
        </div>
        {date && (
          <Input value={date} readOnly />
        )}
      </CardContent>
    </Card>
  );
}

function WordCounter() {
  const [text, setText] = useState('');

  const stats = {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, '').length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    sentences: text.trim() ? text.split(/[.!?]+/).filter(s => s.trim()).length : 0,
    paragraphs: text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim()).length : 0,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="w-5 h-5" />
          Word Counter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Enter text to analyze"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
        />
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>Characters: <span className="font-semibold">{stats.characters}</span></div>
          <div>Characters (no spaces): <span className="font-semibold">{stats.charactersNoSpaces}</span></div>
          <div>Words: <span className="font-semibold">{stats.words}</span></div>
          <div>Sentences: <span className="font-semibold">{stats.sentences}</span></div>
          <div>Paragraphs: <span className="font-semibold">{stats.paragraphs}</span></div>
        </div>
      </CardContent>
    </Card>
  );
}

function IPAddressInfo() {
  const [ip, setIp] = useState('');
  const [info, setInfo] = useState<any>(null);

  const getIPInfo = async () => {
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();
      setInfo(data);
    } catch (error) {
      setInfo({ error: 'Failed to fetch IP information' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="w-5 h-5" />
          IP Address Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Enter IP address"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
        />
        <Button onClick={getIPInfo} className="w-full">
          Get Info
        </Button>
        {info && (
          <div className="space-y-2 text-sm">
            {info.error ? (
              <div className="text-red-500">{info.error}</div>
            ) : (
              <>
                <div>City: <span className="font-semibold">{info.city}</span></div>
                <div>Region: <span className="font-semibold">{info.region}</span></div>
                <div>Country: <span className="font-semibold">{info.country_name}</span></div>
                <div>ISP: <span className="font-semibold">{info.org}</span></div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SoundRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        audioChunksRef.current = [];
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: "Recording started" });
    } catch (err) {
      console.error("Failed to start recording:", err);
      toast({ title: "Error", description: "Could not start recording. Please check microphone permissions.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: "Recording stopped" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Sound Recorder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center gap-4">
          <Button onClick={startRecording} disabled={isRecording}>
            Start Recording
          </Button>
          <Button onClick={stopRecording} disabled={!isRecording} variant="destructive">
            Stop Recording
          </Button>
        </div>
        {audioURL && (
          <div className="space-y-2">
            <audio src={audioURL} controls className="w-full" />
            <a href={audioURL} download="recording.wav" className="text-sm text-blue-500 mt-2 block">
              Download Recording
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ImageResizer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [resizedImage, setResizedImage] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    }
  };

  const resizeImage = () => {
    if (!selectedFile) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      setResizedImage(canvas.toDataURL());
    };

    img.src = URL.createObjectURL(selectedFile);
  };

  const downloadImage = () => {
    if (resizedImage) {
      const a = document.createElement('a');
      a.href = resizedImage;
      a.download = 'resized-image.png';
      a.click();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="w-5 h-5" />
          Image Resizer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="w-full"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Width"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          />
          <Input
            type="number"
            placeholder="Height"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
          />
        </div>
        <Button onClick={resizeImage} disabled={!selectedFile} className="w-full">
          Resize Image
        </Button>
        {resizedImage && (
          <div className="space-y-2">
            <img src={resizedImage} alt="Resized" className="w-full border rounded" />
            <Button onClick={downloadImage} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download Resized Image
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FileConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState('jpeg');
  const [quality, setQuality] = useState(0.9);
  const [convertedUrl, setConvertedUrl] = useState('');
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setConvertedUrl('');
    }
  };

  const convertFile = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const mimeType = `image/${outputFormat}`;
        const dataUrl = canvas.toDataURL(mimeType, quality);
        setConvertedUrl(dataUrl);
        toast({ title: 'Conversion successful!' });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="w-5 h-5" />
          Image File Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input type="file" accept="image/*" onChange={handleFileChange} />
        {file && (
          <>
            <Select value={outputFormat} onValueChange={setOutputFormat}>
              <SelectTrigger><SelectValue placeholder="Output format" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="webp">WEBP</SelectItem>
              </SelectContent>
            </Select>
            {(outputFormat === 'jpeg' || outputFormat === 'webp') && (
              <div>
                <label className="text-sm">Quality: {Math.round(quality * 100)}%</label>
                <Input type="range" min="0.1" max="1" step="0.1" value={quality} onChange={e => setQuality(parseFloat(e.target.value))} />
              </div>
            )}
            <Button onClick={convertFile} className="w-full">Convert</Button>
            {convertedUrl && (
              <a href={convertedUrl} download={`converted.${outputFormat}`}>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Converted Image
                </Button>
              </a>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
