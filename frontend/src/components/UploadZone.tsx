import React, { useRef, useState, useEffect } from 'react';
import { Upload, Camera, FileCheck, X, Image as ImageIcon, Plus, AlertCircle, Loader2 } from 'lucide-react';

export type CameraStatus = 'OFF' | 'INITIALIZING' | 'ACTIVE' | 'DENIED' | 'UNAVAILABLE' | 'ERROR';

interface UploadZoneProps {
  onFilesSelect: (files: File[]) => void;
  selectedFiles: File[];
  onRemoveFile: (index: number) => void;
  onClearAll: () => void;
  onAnalyze: () => void;
  disabled?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelect,
  selectedFiles,
  onRemoveFile,
  onClearAll,
  onAnalyze,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [cameraState, setCameraState] = useState<CameraStatus>('OFF');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  // Manage object URLs safely
  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  // Manage video element stream attachment lifecycle
  useEffect(() => {
    if (cameraState === 'ACTIVE' && mediaStream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = mediaStream;
      video.muted = true;
      video.play().catch((err) => {
        console.error('Video play failed:', err);
      });
    }
  }, [cameraState, mediaStream]);

  // Clean up media tracks on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaStream]);

  const validateAndAddFiles = (newFiles: File[]) => {
    setErrorMsg(null);
    if (selectedFiles.length + newFiles.length > 2) {
      setErrorMsg('Maximum 2 images per inspection allowed. Please select up to 2 package images.');
      return;
    }

    const validList: File[] = [];
    for (const f of newFiles) {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        setErrorMsg(`Unsupported file type (${ext}). Please select a JPG, JPEG, PNG, or WEBP image.`);
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        setErrorMsg(`File '${f.name}' exceeds 10MB limit. Please upload a smaller image.`);
        return;
      }
      validList.push(f);
    }

    if (validList.length > 0) {
      onFilesSelect([...selectedFiles, ...validList]);
    }
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files);
      validateAndAddFiles(dropped);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      validateAndAddFiles(selected);
    }
    // reset input so re-selecting same file triggers change
    if (e.target) {
      e.target.value = '';
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
    }
    setCameraState('OFF');
  };

  const startCamera = async () => {
    setErrorMsg(null);
    if (selectedFiles.length >= 2) {
      setErrorMsg('Maximum 2 images per inspection reached. Remove an image to capture another.');
      return;
    }

    setCameraState('INITIALIZING');
    try {
      let stream: MediaStream;
      try {
        // Try rear/environment camera first
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
      } catch (firstErr) {
        console.warn('Environment facingMode constraint failed, falling back to default camera:', firstErr);
        // Fallback to default video device
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      setMediaStream(stream);
      setCameraState('ACTIVE');
    } catch (err: any) {
      console.error('Camera access error:', err);
      stopCamera();

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('DENIED');
        setErrorMsg('Camera permission denied. Please enable camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraState('UNAVAILABLE');
        setErrorMsg('No camera hardware found on this device.');
      } else {
        setCameraState('ERROR');
        setErrorMsg(`Camera error: ${err.message || 'Could not initialize camera.'}`);
      }
    }
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
          const capIndex = selectedFiles.length + 1;
          const file = new File([blob], `camera_capture_img${capIndex}_${Date.now()}.jpg`, { type: 'image/jpeg' });
          validateAndAddFiles([file]);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-3 mb-4 gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <FileCheck className="h-5 w-5 text-amber-600" />
            <span>New Package Inspection</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload up to 2 package label photographs (e.g. Front & Back) for statutory Legal Metrology audit
          </p>
        </div>

        <button
          type="button"
          onClick={cameraState === 'ACTIVE' || cameraState === 'INITIALIZING' ? stopCamera : startCamera}
          disabled={disabled || (selectedFiles.length >= 2 && cameraState === 'OFF')}
          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 focus:outline-none transition disabled:opacity-50 cursor-pointer"
        >
          <Camera className="h-4 w-4 mr-1.5 text-slate-600" />
          {cameraState === 'ACTIVE' || cameraState === 'INITIALIZING' ? 'Close Camera' : 'Capture with Camera'}
        </button>
      </div>

      {/* Error Alert Box */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border-l-4 border-rose-500 rounded text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Camera Live Stream View */}
      {cameraState === 'INITIALIZING' ? (
        <div className="bg-slate-900 rounded-lg p-12 text-center text-slate-300 mb-4 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
          <p className="text-sm font-semibold">Initializing camera stream...</p>
        </div>
      ) : cameraState === 'ACTIVE' ? (
        <div className="relative bg-slate-950 rounded-lg overflow-hidden border border-slate-800 mb-4 text-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-h-80 object-contain mx-auto"
          />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-3">
            <button
              type="button"
              onClick={capturePhoto}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md font-bold text-xs shadow-lg flex items-center space-x-1.5 cursor-pointer"
            >
              <Camera className="h-4 w-4" />
              <span>Capture Photo ({selectedFiles.length === 0 ? 'Image 1' : 'Image 2'})</span>
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-md font-semibold text-xs border border-slate-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {/* Selected Image Previews (Max 2) */}
      {selectedFiles.length > 0 && (
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Selected Evidence Images ({selectedFiles.length}/2)
            </span>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClearAll}
                disabled={disabled}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold transition cursor-pointer"
              >
                Clear All
              </button>
              <span className="text-xs text-amber-700 font-medium">Maximum 2 images per inspection</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between relative shadow-2xs"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="h-12 w-12 bg-slate-200 rounded border border-slate-300 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {previewUrls[idx] ? (
                      <img src={previewUrls[idx]} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-slate-500" />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-1.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold rounded">
                        Image {idx + 1} {idx === 0 ? '(Front)' : '(Back)'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{file.name}</p>
                    <p className="text-[11px] text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveFile(idx)}
                  disabled={disabled}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer ml-2 flex-shrink-0"
                  title="Remove Image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {selectedFiles.length === 1 && (
              <div
                onClick={() => !disabled && fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50/50 hover:bg-amber-50/30 rounded-lg p-3 flex items-center justify-center text-center cursor-pointer transition min-h-[70px]"
              >
                <div className="flex items-center space-x-2 text-slate-600 hover:text-amber-700">
                  <Plus className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-semibold">Add Image 2 (Optional Back View)</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onAnalyze}
              disabled={disabled}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-md shadow text-xs uppercase tracking-wider flex items-center space-x-2 disabled:opacity-50 transition cursor-pointer"
            >
              <FileCheck className="h-4 w-4 text-amber-400" />
              <span>ANALYZE PACKAGE ({selectedFiles.length} {selectedFiles.length === 1 ? 'IMAGE' : 'IMAGES'})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Drag & Drop Zone when 0 images selected */}
      {selectedFiles.length === 0 && cameraState === 'OFF' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 card-hover-effect ${
            isDragging
              ? 'border-amber-500 bg-amber-50/80 shadow-[0_0_25px_rgba(245,158,11,0.25)] animate-pulse scale-[1.01]'
              : 'border-slate-300 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleInputChange}
            accept=".jpg,.jpeg,.png,.webp"
            multiple
            className="hidden"
            disabled={disabled}
          />
          <div className="mx-auto h-12 w-12 text-slate-400 bg-slate-100/80 rounded-full flex items-center justify-center mb-3 shadow-2xs group">
            <Upload className="h-6 w-6 text-slate-600 animate-float group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-sm font-bold text-slate-800">
            Upload Label Image(s) or Drag &amp; Drop
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supports up to 2 images per inspection • JPG, PNG, WEBP (Max 10MB each)
          </p>
          <p className="text-[11px] text-amber-700 font-medium mt-1">
            Maximum 2 images per inspection (e.g. Front & Back views)
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
                  validateAndAddFiles([file]);
                } catch (err) {
                  console.error(err);
                }
              }}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-semibold shadow-2xs hover:border-amber-500 transition cursor-pointer"
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
                  validateAndAddFiles([file]);
                } catch (err) {
                  console.error(err);
                }
              }}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-semibold shadow-2xs hover:border-amber-500 transition cursor-pointer"
            >
              Savouries Snack Label (test_label.jpeg)
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input for adding 2nd image when 1 image is already selected */}
      {selectedFiles.length === 1 && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          disabled={disabled}
        />
      )}
    </div>
  );
};
