import React, { useState, useRef } from 'react';
import { QrCode, Mic, FileImage, Scissors, Archive, Merge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import QRCode from 'qrcode.react';

interface ToolsViewProps {
  isOfflineMode: boolean;
}

export function ToolsView({ isOfflineMode }: ToolsViewProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold mb-2">Tools</h2>
        <p className="text-muted-foreground">
          A collection of useful utilities to enhance your productivity.
        </p>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <QRCodeGenerator />
          <SoundRecorder />
          {/* PDF tools can be added here if needed */}
        </div>
      </div>
    </div>
  );
}

function QRCodeGenerator() {
  const [qrValue, setQrValue] = useState('');

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
        {qrValue && (
          <div className="p-4 bg-white rounded-md flex justify-center">
            <QRCode value={qrValue} size={128} />
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
          <div>
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
