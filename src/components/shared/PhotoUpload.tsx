import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Camera,
  Upload,
  X,
  Check,
  Maximize2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Photo upload now uses base64 data URLs
// TODO: Add backend file upload endpoint for production use

interface PhotoUploadProps {
  onPhotoUploaded: (url: string) => void;
  photoUrl?: string | null;
  bucketName?: string;
  required?: boolean;
}

const compressImage = (file: File, quality = 0.7, maxDimension = 1600) => {
  return new Promise<File>((resolve, reject) => {
    const image = new Image();
    const canvas = document.createElement('canvas');
    const reader = new FileReader();

    reader.onload = (event) => {
      if (!event.target?.result) return reject(new Error('Failed to read file'));
      image.src = event.target.result as string;
    };

    image.onload = () => {
      const ratio = Math.min(maxDimension / image.width, maxDimension / image.height, 1);
      const width = image.width * ratio;
      const height = image.height * ratio;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      ctx.drawImage(image, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Compression failed'));
            return;
          }
          const compressedFile = new File([blob], file.name, { type: blob.type });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality,
      );
    };

    image.onerror = reject;
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const PhotoUpload = ({
  onPhotoUploaded,
  photoUrl,
  bucketName = 'request-photos',
  required = false,
}: PhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(photoUrl || null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = async (file: File) => {
    try {
      setUploading(true);
      setProgress(10);

      const compressed = await compressImage(file);
      setProgress(45);

      // Convert to base64 data URL
      // TODO: Replace with backend file upload endpoint
      setProgress(60);

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPreviewUrl(dataUrl);
        onPhotoUploaded(dataUrl);
        setProgress(100);
        toast.success('Photo loaded successfully');
      };
      reader.onerror = () => {
        throw new Error('Failed to read file');
      };
      reader.readAsDataURL(compressed);
    } catch (error: unknown) {
      console.error('Error uploading photo:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload photo';
      toast.error(message);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image size must be less than 8MB');
      return;
    }

    await uploadPhoto(file);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onPhotoUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <Label>
        Photo {required && <span className="text-destructive">*</span>}
      </Label>

      {previewUrl ? (
        <div className="space-y-3">
          <div className="relative border-2 border-dashed border-green-500 rounded-lg p-3 bg-green-50 dark:bg-green-950/20">
            <button
              type="button"
              className="group relative block w-full"
              onClick={() => setIsPreviewOpen(true)}
            >
              <img
                src={previewUrl}
                alt="Uploaded photo"
                className="w-full h-48 object-cover rounded-lg transition-transform group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 rounded-lg bg-black/0 transition-colors group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Maximize2 className="h-6 w-6 text-white" />
              </div>
            </button>
            <div className="absolute top-2 right-2 flex gap-2">
              <div className="bg-green-500 text-white p-2 rounded-full">
                <Check className="h-4 w-4" />
              </div>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="rounded-full"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
            <Check className="h-4 w-4" />
            Photo uploaded successfully
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="bg-muted p-3 rounded-full">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Take or upload a photo</p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, HEIC up to 8MB (auto-compressed)
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    'Uploading...'
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </>
                  )}
                </Button>
              </div>
              {uploading && (
                <div className="w-full space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Compressing & uploading image...
                  </p>
                </div>
              )}
            </div>
          </div>
          {required && (
            <p className="text-sm text-muted-foreground">
              You must upload a photo of the item you are taking before submitting the request.
            </p>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Photo Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Uploaded preview"
              className="w-full rounded-lg object-contain max-h-[70vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
