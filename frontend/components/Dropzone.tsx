import React, { useState, useRef, useCallback } from 'react';
import { Upload } from 'lucide-react';

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

export function Dropzone({ onFilesAdded, disabled, className }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setIsDragging(true);
      } else if (e.type === 'dragleave') {
        setIsDragging(false);
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length > 0) {
      onFilesAdded(files);
    }
  }, [disabled, onFilesAdded]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      onFilesAdded(files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleZoneClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      className={`relative rounded-lg border-2 border-dashed transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={handleZoneClick}
    >
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag and drop files here, or click to select files
        </p>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileInputChange}
          multiple
          disabled={disabled}
        />
      </div>
    </div>
  );
}
