
import React, { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { processZipFile, getFileCounts } from '@/lib/zipHandler';
import { Button } from '@/components/ui/button';
import { FileUp, Check, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

interface ThemeUploaderProps {
  onUploadComplete: () => void;
}

const ThemeUploader: React.FC<ThemeUploaderProps> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Only accept one zip file
    const zipFile = acceptedFiles.find(file => file.type === 'application/zip' || file.name.endsWith('.zip'));
    
    if (!zipFile) {
      toast({
        title: "Invalid file",
        description: "Please upload a .zip file containing a Shopify theme.",
        variant: "destructive"      
      });
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(10);
      
      // Simulate progress (as extracting isn't trackable easily)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 100);
      
      const success = await processZipFile(zipFile);
      clearInterval(progressInterval);
      
      if (success) {
        setUploadProgress(100);
        const counts = getFileCounts();
        
        toast({
          title: "Theme uploaded successfully",
          description: `Extracted ${counts.total} files (${counts.liquid} Liquid templates).`,
          variant: "default"
        });
        
        onUploadComplete();
      } else {
        throw new Error("Failed to process the ZIP file");
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process theme files.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [toast, onUploadComplete]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/zip': ['.zip'],
    },
    disabled: uploading,
    multiple: false
  });

  return (
    <div className="max-w-xl mx-auto my-8">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
          isDragActive ? "border-shopify-blue bg-blue-50" : "border-gray-300 hover:border-shopify-blue",
          uploading && "opacity-75 pointer-events-none"
        )}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="w-full">
            <div className="mb-2 flex items-center justify-center">
              <div className="h-12 w-12 border-2 border-shopify-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-sm text-gray-600 mb-2">Processing theme files...</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-shopify-blue h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <>
            <FileUp size={40} className="text-shopify-blue mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload your Shopify theme</h3>
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop a .zip file of your exported Shopify theme, <br />
              or click to browse your files.
            </p>
            <Button 
              variant="outline" 
              className="bg-white hover:bg-gray-50 border border-gray-300"
            >
              Select ZIP file
            </Button>
          </>
        )}
      </div>

      <div className="mt-6 bg-shopify-light p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium mb-2 flex items-center">
          <Check size={16} className="text-shopify-green mr-2" />
          How to export your Shopify theme
        </h4>
        <ol className="list-decimal ml-5 text-sm text-gray-700 space-y-1">
          <li>In your Shopify admin, go to <strong>Online Store &gt; Themes</strong></li>
          <li>Find the theme you want to preview</li>
          <li>Click <strong>Actions &gt; Download theme file</strong></li>
          <li>Upload the downloaded .zip file here</li>
        </ol>
      </div>
    </div>
  );
};

export default ThemeUploader;
