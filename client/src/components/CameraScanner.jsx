import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, AlertCircle, RefreshCw } from 'lucide-react';

export default function CameraScanner({ onDecoded }) {
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const scanFrame = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (code && code.data) {
      onDecoded(code.data);
      stopScanning();
      return;
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const startScanning = async () => {
    setErrorMsg(null);
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        animFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      console.error('Camera scan error:', err);
      let userFriendlyError = err.message || 'Could not start camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        userFriendlyError = 'Camera permission denied. Please allow camera access in your browser address bar.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        userFriendlyError = 'No camera device found on this system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        userFriendlyError = 'Camera is already in use by another application.';
      }
      setErrorMsg(userFriendlyError);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  };

  return (
    <div className="flex flex-col items-center w-full">
      {!isScanning ? (
        <div className="w-full py-8 border-2 border-dashed border-borderline rounded-xl flex flex-col items-center justify-center bg-canvas/40 text-center px-4">
          <div className="h-12 w-12 rounded-full bg-surface border border-borderline flex items-center justify-center mb-3 text-ink-muted shadow-sm">
            <Camera className="h-6 w-6 stroke-[2]" />
          </div>
          <p className="text-sm font-semibold text-ink mb-1">
            Scan with Live Webcam or Mobile Camera
          </p>
          <p className="text-xs text-ink-muted max-w-sm mb-4">
            Point your camera at any physical QR code or screen to decode it in real-time.
          </p>
          <button
            type="button"
            onClick={startScanning}
            className="inline-flex items-center gap-2 px-4 py-2 border border-ink text-xs font-semibold rounded-lg text-white bg-ink hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink transition-all shadow-sm cursor-pointer"
          >
            <Camera className="h-4 w-4" />
            <span>Start Live Camera</span>
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
          <div className="relative w-full max-w-sm aspect-square bg-black rounded-xl overflow-hidden border border-borderline shadow-inner">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Viewfinder overlay */}
            <div className="absolute inset-0 border-2 border-dashed border-white/60 m-8 rounded-lg pointer-events-none flex items-center justify-center">
              <span className="text-[11px] text-white/95 bg-black/70 px-2.5 py-1 rounded backdrop-blur-xs">
                Center QR Code inside frame
              </span>
            </div>
            {/* Scanning line animation */}
            <div className="absolute inset-x-8 top-12 h-0.5 bg-risk-green-badge shadow-[0_0_8px_rgba(63,122,92,0.8)] animate-pulse pointer-events-none" />
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={stopScanning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-ink-muted hover:text-ink border border-borderline rounded-md bg-surface hover:bg-canvas transition-colors cursor-pointer"
            >
              <CameraOff className="h-3.5 w-3.5" />
              <span>Stop Camera</span>
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mt-3 w-full p-2.5 bg-risk-red-bg border border-risk-red-border text-risk-red-text rounded-lg text-xs flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMsg}</p>
            <p className="text-[11px] mt-0.5 opacity-90">
              You can switch to &ldquo;Upload QR Image&rdquo; or paste screenshots directly using <kbd className="font-mono">Ctrl+V</kbd>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
