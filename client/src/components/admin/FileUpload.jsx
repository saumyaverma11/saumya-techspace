import { useState, useRef } from 'react';
import portfolioService from '../../services/portfolioService';

const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * FileUpload component for Admin console
 * Supports JPG, JPEG, PNG, WEBP for images (max 5MB, strictly NO SVG)
 * Supports PDF for resume (max 10MB)
 */
export function FileUpload({
  label,
  type = 'avatar',
  value = '',
  onChange,
  error = null,
  placeholder = 'https://...',
  helperText = '',
  id,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const isResume = type === 'resume';
  const inputId = id || `file-upload-${type}`;

  const validateFile = (file) => {
    if (!file) return 'No file selected.';

    const ext = `.${file.name.split('.').pop()}`.toLowerCase();
    const mime = file.type.toLowerCase();

    // Strictly reject SVG
    if (ext === '.svg' || mime === 'image/svg+xml') {
      return 'SVG uploads are not permitted. Please upload JPG, JPEG, PNG, or WEBP.';
    }

    if (isResume) {
      if (ext !== '.pdf' || (mime && mime !== 'application/pdf')) {
        return 'Resume must be a PDF document (.pdf).';
      }
      if (file.size > 10 * 1024 * 1024) {
        return 'Resume PDF size exceeds maximum 10 MB limit.';
      }
    } else {
      if (!ALLOWED_IMAGE_EXTS.includes(ext) || (mime && !ALLOWED_IMAGE_MIMES.includes(mime))) {
        return 'Invalid image type. Supported formats: JPG, JPEG, PNG, WEBP.';
      }
      if (file.size > 5 * 1024 * 1024) {
        return 'Image size exceeds maximum 5 MB limit.';
      }
    }

    return null;
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset native input so user can re-select same file if needed
    e.target.value = '';

    const validationMsg = validateFile(file);
    if (validationMsg) {
      setUploadError(validationMsg);
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const result = await portfolioService.uploadFile(file, type);
      if (result && result.url) {
        onChange(result.url);
      } else {
        setUploadError('Upload succeeded but no URL was returned.');
      }
    } catch (err) {
      setUploadError(err.message || 'File upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    setUploadError(null);
  };

  const handleViewPdf = async (e) => {
    e.preventDefault();
    if (!value) return;
    const newWindow = window.open('about:blank', '_blank');
    try {
      const res = await fetch(value);
      if (!res.ok) throw new Error('Fetch failed');
      const blob = await res.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);
      if (newWindow) {
        newWindow.location.href = blobUrl;
      }
    } catch {
      if (newWindow) {
        newWindow.location.href = value;
      }
    }
  };

  const acceptedFormats = isResume ? '.pdf,application/pdf' : '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-300">
          {label}
        </label>
        {value && isResume && (
          <button
            type="button"
            onClick={handleViewPdf}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300"
          >
            <span>View PDF</span>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats}
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Controls / Actions Row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* URL Text Input */}
        <input
          id={inputId}
          type="url"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (uploadError) setUploadError(null);
          }}
          placeholder={placeholder}
          className="w-full flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
        />

        {/* Upload / Replace Button */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-2.5 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>{value ? 'Replace File' : isResume ? 'Upload PDF' : 'Upload Image'}</span>
              </>
            )}
          </button>

          {value && (
            <button
              type="button"
              disabled={isUploading}
              onClick={handleRemove}
              title="Remove current file"
              className="inline-flex items-center rounded-xl border border-red-500/20 bg-red-500/10 px-2.5 py-2.5 text-xs text-red-400 transition hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Visual Preview for Images and PDF Indicator */}
      {value && !isResume && (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-2.5">
          <img
            src={value}
            alt="Preview"
            className="h-12 w-12 rounded-lg object-cover border border-white/10"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="min-w-0 flex-1 text-xs">
            <p className="font-semibold text-slate-200">Current Image</p>
            <p className="truncate text-[11px] text-slate-400">{value}</p>
          </div>
        </div>
      )}

      {value && isResume && (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1 text-xs">
            <p className="font-semibold text-slate-200">Attached PDF Document</p>
            <p className="truncate text-[11px] text-slate-400">{value}</p>
          </div>
        </div>
      )}

      {/* Error & Helper Messages */}
      {uploadError && <p className="text-[11px] text-red-400">{uploadError}</p>}
      {error && !uploadError && <p className="text-[11px] text-red-400">{error}</p>}
      {helperText && !uploadError && !error && (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      )}
    </div>
  );
}

export default FileUpload;
