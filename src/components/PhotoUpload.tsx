import { useState, useRef, ChangeEvent } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Camera, Upload, X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface PhotoUploadProps {
  onPhotoUploaded: (url: string) => void;
  photoUrl?: string | null;
  bucketName?: string;
  required?: boolean;
}

export const PhotoUpload = ({
  onPhotoUploaded,
  photoUrl,
  bucketName = 'request-photos',
  required = false,
}: PhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(photoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = async (file: File) => {
    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      onPhotoUploaded(publicUrl);
      toast.success('Photo uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error(error.message || 'Failed to upload photo');
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

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
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
            <img
              src={previewUrl}
              alt="Uploaded photo"
              className="w-full h-48 object-cover rounded-lg"
            />
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
                  PNG, JPG up to 5MB
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
    </div>
  );
};
