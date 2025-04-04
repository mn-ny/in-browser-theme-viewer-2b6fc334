
import React, { useRef, useEffect, useState } from 'react';
import { liquidRenderer } from '@/lib/liquidRenderer';
import { useToast } from '@/hooks/use-toast';

interface ThemePreviewProps {
  templatePath?: string;
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ templatePath = 'index' }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const renderTemplate = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Let the liquidRenderer handle path normalization
        const html = await liquidRenderer.render({ template: templatePath });
        
        // Create a blob from the HTML content
        const blob = new Blob([html], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        
        // Set the iframe source to the blob URL
        if (iframeRef.current) {
          iframeRef.current.src = blobUrl;
          
          // Clean up the blob URL when the iframe loads
          iframeRef.current.onload = () => {
            setLoading(false);
            URL.revokeObjectURL(blobUrl);
          };
          
          // Handle iframe load errors
          iframeRef.current.onerror = () => {
            setLoading(false);
            setError('Failed to load preview');
            URL.revokeObjectURL(blobUrl);
          };
        }
      } catch (err) {
        console.error('Error rendering template:', err);
        setLoading(false);
        setError(`Error rendering template: ${err instanceof Error ? err.message : 'Unknown error'}`);
        toast({
          title: "Preview Error",
          description: "Failed to render the template. Check console for details.",
          variant: "destructive"
        });
      }
    };
    
    renderTemplate();
  }, [templatePath, toast]);

  return (
    <div className="relative h-full border rounded bg-white">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 border-2 border-shopify-blue border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-sm text-shopify-navy">Rendering preview...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="bg-red-50 border border-red-200 rounded p-4 m-4 w-full max-w-md">
            <h3 className="text-red-800 font-medium mb-2">Preview Error</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        title="Theme Preview"
        className="w-full h-full border-0"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
};

export default ThemePreview;
