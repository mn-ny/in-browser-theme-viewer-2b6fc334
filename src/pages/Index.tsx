import React, { useState, useEffect } from 'react';
import { registerServiceWorker } from '@/lib/serviceWorkerRegistration';
import ThemeUploader from '@/components/ThemeUploader';
import FileExplorer from '@/components/FileExplorer';
import FileViewer from '@/components/FileViewer';
import ThemePreview from '@/components/ThemePreview';
import { VirtualFile } from '@/lib/vfs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Laptop, Smartphone, Tablet, RefreshCcw, GithubIcon } from 'lucide-react';
import { vfs } from '@/lib/vfs';

const Index = () => {
  const [isThemeUploaded, setIsThemeUploaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<string>('index');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    // Register the service worker when the component mounts
    registerServiceWorker();
  }, []);

  const handleUploadComplete = () => {
    setIsThemeUploaded(true);
  };

  const handleFileSelect = (file: VirtualFile) => {
    setSelectedFile(file);
    
    // If this is a template file, update the preview
    if (file.type === 'template') {
      setCurrentTemplate(file.path);
    }
  };

  const handleRefreshPreview = () => {
    // Force a re-render of the preview by setting the current template again
    const templateCopy = currentTemplate;
    setCurrentTemplate('');
    setTimeout(() => {
      setCurrentTemplate(templateCopy);
    }, 10);
  };

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': return '100%';
      default: return '100%';
    }
  };

  if (!isThemeUploaded) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-shopify-navy mb-2">
              Shopify Theme Previewer
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Preview your Shopify theme directly in your browser. Upload a theme ZIP file
              to see it rendered with full Liquid template support.
            </p>
          </div>
          
          <ThemeUploader onUploadComplete={handleUploadComplete} />
          
          <div className="mt-12 border-t pt-8">
            <h2 className="text-xl font-semibold text-center mb-6">Features</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white p-5 rounded-lg shadow-sm border">
                <h3 className="font-medium mb-2 text-shopify-navy">No Server Required</h3>
                <p className="text-sm text-gray-600">
                  Preview your themes locally without deploying to a server or installing any special software.
                </p>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm border">
                <h3 className="font-medium mb-2 text-shopify-navy">Full Liquid Support</h3>
                <p className="text-sm text-gray-600">
                  Renders Liquid templates, sections, snippets, and layout files just like Shopify does.
                </p>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm border">
                <h3 className="font-medium mb-2 text-shopify-navy">Asset Handling</h3>
                <p className="text-sm text-gray-600">
                  Loads CSS, JavaScript and images from your theme assets folder automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <footer className="mt-20 text-center text-gray-500 text-sm">
          <p>
            Made with ❤️ for Shopify theme developers •{" "}
            <a 
              href="https://github.com/example/shopify-theme-previewer"
              className="text-shopify-blue hover:underline inline-flex items-center"
              target="_blank" 
              rel="noopener noreferrer"
            >
              <GithubIcon size={14} className="mr-1" /> View Source
            </a>
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 py-2 flex justify-between items-center">
          <h1 className="font-bold text-shopify-navy">Shopify Theme Previewer</h1>
          
          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-100 p-0.5 rounded">
              <Button
                size="sm"
                variant={previewMode === 'desktop' ? 'default' : 'ghost'} 
                className={`px-3 py-1 h-auto ${previewMode === 'desktop' ? 'bg-white text-shopify-navy shadow-sm border' : 'text-gray-600'}`}
                onClick={() => setPreviewMode('desktop')}
              >
                <Laptop size={16} />
              </Button>
              <Button
                size="sm"
                variant={previewMode === 'tablet' ? 'default' : 'ghost'} 
                className={`px-3 py-1 h-auto ${previewMode === 'tablet' ? 'bg-white text-shopify-navy shadow-sm border' : 'text-gray-600'}`}
                onClick={() => setPreviewMode('tablet')}
              >
                <Tablet size={16} />
              </Button>
              <Button
                size="sm"
                variant={previewMode === 'mobile' ? 'default' : 'ghost'} 
                className={`px-3 py-1 h-auto ${previewMode === 'mobile' ? 'bg-white text-shopify-navy shadow-sm border' : 'text-gray-600'}`}
                onClick={() => setPreviewMode('mobile')}
              >
                <Smartphone size={16} />
              </Button>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              className="flex items-center text-gray-700"
              onClick={handleRefreshPreview}
            >
              <RefreshCcw size={14} className="mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full max-h-[calc(100vh-49px)]"
        >
          <ResizablePanel 
            defaultSize={20} 
            minSize={15}
            maxSize={40}
            className="bg-gray-50"
          >
            <Tabs defaultValue="files">
              <TabsList className="w-full grid grid-cols-1">
                <TabsTrigger value="files">Files</TabsTrigger>
              </TabsList>
              <TabsContent value="files" className="p-2 h-[calc(100vh-110px)] overflow-hidden">
                <FileExplorer onFileSelect={handleFileSelect} />
              </TabsContent>
            </Tabs>
          </ResizablePanel>
          
          {/* Fixed ResizableHandle to use correct name from the component */}
          <ResizablePanel className="w-px bg-border" />
          
          <ResizablePanel defaultSize={30}>
            <FileViewer file={selectedFile} />
          </ResizablePanel>
          
          {/* Fixed ResizableHandle to use correct name from the component */}
          <ResizablePanel className="w-px bg-border" />
          
          <ResizablePanel defaultSize={50}>
            <div className="h-full flex flex-col">
              <div className="p-2 bg-gray-100 border-b flex items-center gap-2">
                <span className="text-xs text-gray-600">Preview:</span>
                <span className="text-xs font-medium">{currentTemplate || 'index'}</span>
              </div>
              
              <div className="flex-1 bg-[#f6f6f6] flex justify-center overflow-auto">
                <div 
                  style={{ width: getPreviewWidth() }}
                  className="h-full transition-all duration-300 ease-in-out bg-white shadow-md"
                >
                  <ThemePreview templatePath={currentTemplate} />
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Index;
