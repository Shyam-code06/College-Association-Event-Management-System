import React, { useRef, useState } from 'react';
import { UploadCloud, File, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export const FileUpload = ({
  accept = '.jpg,.jpeg,.png,.pdf',
  maxSizeMB = 5,
  value,
  onChange,
  error,
  className,
}) => {
  const fileInputRef = useRef(null);
  const [selectedFileName, setSelectedFileName] = useState(value?.name || '');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File size exceeds maximum allowed limit of ${maxSizeMB} MB`);
        return;
      }
      setSelectedFileName(file.name);
      onChange?.(file);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onChange?.(null);
  };

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors duration-150',
        'bg-canvas hover:bg-canvas-2',
        error ? 'border-danger' : 'border-line hover:border-primary',
        className
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {selectedFileName ? (
        <div className="flex items-center justify-between bg-surface border border-line rounded-sm p-2 text-left">
          <div className="flex items-center gap-2 overflow-hidden">
            <File className="h-5 w-5 text-primary shrink-0" />
            <span className="text-xs font-medium text-ink truncate">{selectedFileName}</span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-muted hover:text-danger rounded-sm transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5 text-muted">
          <UploadCloud className="h-8 w-8 text-primary/70" />
          <p className="text-xs font-medium text-ink">
            Click to upload or drag receipt file
          </p>
          <p className="text-[11px] text-muted">
            PNG, JPG, or PDF (Max {maxSizeMB} MB)
          </p>
        </div>
      )}
    </div>
  );
};
