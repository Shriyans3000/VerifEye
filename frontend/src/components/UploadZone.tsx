import React, { useRef, useState } from 'react';
import { Upload, Camera, FileCheck, X, Image as ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClearFile: () => void;
  onAnalyze: () => void;
  disabled?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelect,
  selectedFile,
  onClearFile,
  onAnalyze,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  const validateAndSelect = (file: File) => {
    setErrorMsg(null);
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setErrorMsg(`Unsupported file type (${ext}). Please select a JPG, JPEG, PNG, or WEBP image.`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds 10MB limit. Please upload a smaller image.');
      return;
    }
    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  };

  // WebCam Camera Capture implementation
  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setMediaStream(stream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMsg('Unable to access camera. Please check browser permissions or upload a file.');
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
          validateAndSelect(file);
          stopCamera();
        }
      }, 'image/jpeg', 0.92);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <FileCheck className="h-5 w-5 text-amber-600" />
            <span>New Package Inspection</span>
          </h2>
          <p className="text-xs text-slate-500">
            Upload or capture a clear photograph of the commodity label for automated Legal Metrology audit
          </p>
        </div>
        <button
          type="button"
          onClick={cameraActive ? stopCamera : startCamera}
          disabled={disabled}
          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 focus:outline-none transition disabled:opacity-50"
        >
          <Camera className="h-4 w-4 mr-1.5 text-slate-600" />
          {cameraActive ? 'Close Camera' : 'Capture with Camera'}
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border-l-4 border-rose-500 rounded text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Camera Live Stream Modal View */}
      {cameraActive ? (
        <div className="relative bg-slate-950 rounded-lg overflow-hidden border border-slate-800 mb-4 text-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full max-h-80 object-contain mx-auto"
          />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-3">
            <button
              type="button"
              onClick={capturePhoto}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md font-bold text-xs shadow-lg flex items-center space-x-1.5"
            >
              <Camera className="h-4 w-4" />
              <span>Take Photo</span>
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-md font-semibold text-xs border border-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : selectedFile ? (
        /* File Selected Preview Area */
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="h-12 w-12 bg-amber-100 border border-amber-300 rounded-md flex items-center justify-center flex-shrink-0 text-amber-700">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-slate-800 truncate">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)} • {selectedFile.type || 'Image'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-md transition"
                title="Change Image"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onClearFile}
                disabled={disabled}
                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-md transition"
                title="Remove File"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={onAnalyze}
              disabled={disabled}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-md shadow text-xs uppercase tracking-wider flex items-center space-x-2 disabled:opacity-50 transition"
            >
              <FileCheck className="h-4 w-4 text-amber-400" />
              <span>ANALYZE PACKAGE</span>
            </button>
          </div>
        </div>
      ) : (
        /* Drag & Drop Upload Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
            isDragging
              ? 'border-amber-500 bg-amber-50/50'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleInputChange}
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            disabled={disabled}
          />
          <div className="mx-auto h-12 w-12 text-slate-400 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <Upload className="h-6 w-6 text-slate-600" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            Upload Label Image or Drag & Drop
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supports JPG, JPEG, PNG, WEBP (Max 10MB)
          </p>

          {/* Quick Inspection Test Samples */}
          <div
            className="mt-5 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-slate-500 font-medium">Quick Test Label:</span>
            <button
              type="button"
              id="test-sample-parleg"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const res = await fetch('/samples/test_image2.png');
                  const blob = await res.blob();
                  const file = new File([blob], 'test_image2.png', { type: 'image/png' });
                  validateAndSelect(file);
                } catch (err) {
                  console.error(err);
                }
              }}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-semibold shadow-2xs hover:border-amber-500 transition"
            >
              Parle-G Biscuit Label (test_image2.png)
            </button>
            <button
              type="button"
              id="test-sample-savouries"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const res = await fetch('/samples/test_label.jpeg');
                  const blob = await res.blob();
                  const file = new File([blob], 'test_label.jpeg', { type: 'image/jpeg' });
                  validateAndSelect(file);
                } catch (err) {
                  console.error(err);
                }
              }}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-semibold shadow-2xs hover:border-amber-500 transition"
            >
              Savouries Snack Label (test_label.jpeg)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
