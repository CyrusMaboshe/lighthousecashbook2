import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Trash2, Camera, X } from 'lucide-react';
import { AnimatedProfilePicture } from './AnimatedProfilePicture';

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  onUpload: (file: File) => Promise<string>;
  onDelete: () => Promise<void>;
  isUploading?: boolean;
  isDeleting?: boolean;
  maxSizeInMB?: number;
  allowedTypes?: string[];
}

export function ProfilePictureUpload({
  currentImageUrl,
  onUpload,
  onDelete,
  isUploading = false,
  isDeleting = false,
  maxSizeInMB = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
}: ProfilePictureUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: `Please select a valid image file (${allowedTypes.join(', ')})`,
        variant: "destructive",
      });
      return false;
    }

    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      toast({
        title: "File Too Large",
        description: `Please select an image smaller than ${maxSizeInMB}MB`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const imageUrl = await onUpload(file);
      setPreviewUrl(null);
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been successfully updated.",
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setPreviewUrl(null);
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDelete = async () => {
    try {
      await onDelete();
      setPreviewUrl(null);
      toast({
        title: "Profile Picture Removed",
        description: "Your profile picture has been removed.",
      });
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to remove profile picture. Please try again.",
        variant: "destructive",
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const displayImageUrl = previewUrl || currentImageUrl;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Profile Picture Display */}
      <div className="relative">
        <AnimatedProfilePicture
          src={displayImageUrl}
          size="xl"
          isLoading={isUploading}
          showZappingEffect={isUploading || isDeleting}
          className="transition-all duration-300"
        />
        
        {/* Delete Button */}
        {displayImageUrl && !isUploading && !isDeleting && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 w-full max-w-sm text-center transition-all duration-300
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={triggerFileInput}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />
        
        <div className="flex flex-col items-center space-y-2">
          <Camera className="w-8 h-8 text-gray-400" />
          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
          </div>
          <div className="text-xs text-gray-500">
            PNG, JPG, WebP or GIF (max {maxSizeInMB}MB)
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={triggerFileInput}
          disabled={isUploading || isDeleting}
          className="flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>{currentImageUrl ? 'Change Picture' : 'Upload Picture'}</span>
        </Button>
        
        {currentImageUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isUploading || isDeleting}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remove</span>
          </Button>
        )}
      </div>

      {/* Loading States */}
      {isUploading && (
        <div className="text-sm text-blue-600 animate-pulse">
          Uploading your profile picture...
        </div>
      )}
      
      {isDeleting && (
        <div className="text-sm text-red-600 animate-pulse">
          Removing profile picture...
        </div>
      )}
    </div>
  );
}
