
import React, { useState, useEffect } from 'react';
import { VirtualFile } from '@/lib/vfs';
import { File, FileType } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileViewerProps {
  file: VirtualFile | null;
}

const FileViewer: React.FC<FileViewerProps> = ({ file }) => {
  const [content, setContent] = useState<string>('');
  
  useEffect(() => {
    if (file && typeof file.content === 'string') {
      setContent(file.content);
    } else {
      setContent('');
    }
  }, [file]);
  
  if (!file) {
    return (
      <div className="h-full border rounded p-4 flex items-center justify-center bg-gray-50 text-gray-500">
        <div className="text-center">
          <FileType size={24} className="mx-auto mb-2" />
          <p>Select a file to view its contents</p>
        </div>
      </div>
    );
  }
  
  // Check if file is binary (not string content)
  if (typeof file.content !== 'string') {
    return (
      <div className="h-full border rounded p-4 bg-white">
        <div className="border-b pb-2 mb-4 flex items-center">
          <File size={16} className="mr-2 text-shopify-blue" />
          <span className="font-medium">{file.path}</span>
        </div>
        <div className="p-4 bg-gray-50 rounded flex items-center justify-center h-64">
          <div className="text-center">
            <p className="mb-2">Binary file</p>
            <p className="text-sm text-gray-500">{file.type} ({formatBytes(file.content.byteLength)})</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full border rounded bg-white flex flex-col">
      <div className="border-b p-2 flex items-center bg-gray-50">
        <File size={16} className="mr-2 text-shopify-blue" />
        <span className="font-medium text-sm">{file.path}</span>
      </div>
      <pre className={cn(
        "p-4 overflow-auto flex-1 text-sm",
        file.type === 'liquid' ? "bg-gray-50" : ""
      )}>
        <code>{content}</code>
      </pre>
    </div>
  );
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default FileViewer;
