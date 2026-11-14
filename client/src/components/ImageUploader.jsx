import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { UploadCloud, AlertCircle, FileCheck, Clipboard, Sparkles } from 'lucide-react';

export default function ImageUploader({ onDecoded }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Multi-engine QR decoding: jsQR (raw + multi-scale) + ZXing fallback
  const decodeQrFromImage = async (img) => {
    // Strategy 1: jsQR at original resolution
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code1 = jsQR(imgData.data, imgData.width, imgData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (code1 && code1.data) {
      return code1.data;
    }

    // Strategy 2: If image is large (> 1000px), downscale to ~800px (sweet spot for noisy photos)
    const maxDim = Math.max(canvas.width, canvas.height);
    if (maxDim > 1000) {
      const scale = 800 / maxDim;
      const downCanvas = document.createElement('canvas');
      const downCtx = downCanvas.getContext('2d', { willReadFrequently: true });
      downCanvas.width = Math.round(canvas.width * scale);
      downCanvas.height = Math.round(canvas.height * scale);
      downCtx.drawImage(img, 0, 0, downCanvas.width, downCanvas.height);

      const downData = downCtx.getImageData(0, 0, downCanvas.width, downCanvas.height);
      const code2 = jsQR(downData.data, downData.width, downData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code2 && code2.data) {
        return code2.data;
      }
    }

    // Strategy 3: ZXing Browser MultiFormatReader fallback
    try {
      const zxingReader = new BrowserMultiFormatReader();
      const zResult = await zxingReader.decodeFromImageElement(img);
      if (zResult && zResult.getText()) {
        return zResult.getText();
      }
    } catch {}

    return null;
  };

  const processImageFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    setErrorMsg(null);
    setFileName(file.name || 'Pasted Screenshot');
    setIsProcessing(true);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const img = new Image();
      img.src = objectUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image file.'));
      });

      const decodedText = await decodeQrFromImage(img);

      if (decodedText) {
        onDecoded(decodedText);
      } else {
        setErrorMsg('Could not detect a clear QR code pattern. Try cropping closer or adjusting lighting.');
      }
    } catch (err) {
      console.warn('QR Decode error:', err);
      setErrorMsg('Could not decode QR from this image. Ensure the full QR code is visible.');
    } finally {
      setIsProcessing(false);
    }
  }, [onDecoded]);

  // Global & Dropzone Clipboard Paste Listener (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processImageFile]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // Reset input value so re-uploading the same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-6 px-4 border-2 border-dashed border-borderline hover:border-ink/40 rounded-xl flex flex-col items-center justify-center bg-canvas/40 hover:bg-canvas/80 cursor-pointer transition-all text-center relative group"
      >
        {/* Explicit file extensions prevent Windows Explorer from freezing on 'Working on it...' */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.gif,.bmp"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="h-12 w-12 rounded-full bg-surface border border-borderline flex items-center justify-center mb-2.5 text-ink-muted group-hover:text-ink shadow-sm transition-colors">
          {fileName ? (
            <FileCheck className="h-6 w-6 text-risk-green-text" />
          ) : (
            <UploadCloud className="h-6 w-6" />
          )}
        </div>

        <p className="text-xs sm:text-sm font-semibold text-ink">
          {isProcessing ? 'Decoding QR pattern...' : fileName ? fileName : 'Choose QR Image or Drag & Drop'}
        </p>

        <p className="text-[11px] text-ink-muted mt-1 max-w-sm">
          Click to browse, drag &amp; drop an image file, or simply press{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-surface border border-borderline font-mono text-[10px] font-semibold text-ink shadow-2xs">
            Ctrl + V
          </kbd>{' '}
          to paste from clipboard
        </p>

        {previewUrl && (
          <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-ink-muted bg-surface px-2.5 py-1 rounded-md border border-borderline">
            <span className="h-2 w-2 rounded-full bg-risk-green-badge inline-block" />
            <span>Image loaded</span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mt-2.5 p-2.5 bg-risk-red-bg border border-risk-red-border text-risk-red-text rounded-lg text-xs flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMsg}</p>
            <p className="text-[11px] mt-0.5 opacity-90">
              Tip: You can also use Snipping Tool (<kbd className="font-mono">Win+Shift+S</kbd>) to crop the QR code and press <kbd className="font-mono">Ctrl+V</kbd>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
