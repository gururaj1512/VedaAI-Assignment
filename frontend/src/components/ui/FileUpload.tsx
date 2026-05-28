'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, File, X } from 'lucide-react';

interface FileUploadProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
}

export default function FileUpload({ selectedFile, onFileSelect }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedTypes = ['.pdf', '.txt', '.png', '.jpg', '.jpeg'];
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB

  const validateAndSetFile = (file: File) => {
    setError(null);
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(ext)) {
      setError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      return;
    }

    if (file.size > maxSizeBytes) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="form-group">
      <div 
        className={`upload-zone ${isDragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden"
          accept=".pdf,.txt,.png,.jpg,.jpeg"
          onChange={handleChange}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="p-3 bg-gray-100 rounded-full text-green-600">
              <File size={28} />
            </div>
            <span className="upload-text text-sm max-w-xs truncate">{selectedFile.name}</span>
            <span className="text-xs text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
            <button 
              className="mt-2 text-xs flex items-center gap-1 text-red-600 font-semibold cursor-pointer"
              onClick={handleRemove}
            >
              <X size={14} /> Remove File
            </button>
          </div>
        ) : (
          <>
            <div className="upload-icon-wrapper">
              <UploadCloud size={32} />
            </div>
            <span className="upload-text">Choose a file or drag & drop it here</span>
            <span className="upload-subtext">JPEG, PNG, upto 10MB</span>
            <button 
              type="button" 
              className="btn-browse"
              onClick={handleButtonClick}
            >
              Browse Files
            </button>
          </>
        )}
      </div>

      {error && (
        <span className="text-xs text-red-600 font-medium text-center">{error}</span>
      )}
      
      <span className="upload-zone-hint text-center block mt-2">Upload images of your preferred document/image</span>
    </div>
  );
}
