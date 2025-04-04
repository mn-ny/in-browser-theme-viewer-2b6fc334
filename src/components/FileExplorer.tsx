
import React, { useState, useMemo } from 'react';
import { vfs, VirtualFile } from '@/lib/vfs';
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileTreeNode {
  name: string;
  path: string;
  type: 'directory' | 'file';
  children: Record<string, FileTreeNode>;
  file?: VirtualFile;
}

interface FileExplorerProps {
  onFileSelect: (file: VirtualFile) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect }) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const fileTree = useMemo(() => {
    // Build a file tree from the VFS
    const root: FileTreeNode = { 
      name: 'theme', 
      path: '', 
      type: 'directory', 
      children: {} 
    };
    
    vfs.getAllFiles().forEach(file => {
      // Skip non-text files for the explorer
      if (typeof file.content !== 'string' && file.type !== 'liquid') {
        return;
      }
      
      const pathParts = file.path.split('/');
      let currentNode = root;
      
      // Process each part of the path
      pathParts.forEach((part, index) => {
        const isLast = index === pathParts.length - 1;
        const currentPath = pathParts.slice(0, index + 1).join('/');
        
        if (isLast) {
          // This is a file
          currentNode.children[part] = {
            name: part,
            path: currentPath,
            type: 'file',
            children: {},
            file: file
          };
        } else {
          // This is a directory
          if (!currentNode.children[part]) {
            currentNode.children[part] = {
              name: part,
              path: currentPath,
              type: 'directory',
              children: {}
            };
          }
          currentNode = currentNode.children[part];
        }
      });
    });
    
    return root;
  }, []);
  
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };
  
  const handleFileClick = (node: FileTreeNode) => {
    if (node.file) {
      setSelectedFile(node.path);
      onFileSelect(node.file);
    }
  };
  
  const renderNode = (node: FileTreeNode, level = 0) => {
    const isExpanded = expandedFolders[node.path];
    const hasChildren = Object.keys(node.children).length > 0;
    
    if (node.type === 'directory') {
      return (
        <div key={node.path}>
          <div 
            className={cn(
              "flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer",
              "rounded transition-colors duration-150 ease-in-out"
            )}
            style={{ paddingLeft: `${(level * 12) + 8}px` }}
            onClick={() => toggleFolder(node.path)}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            ) : (
              <span className="w-4" />
            )}
            <Folder 
              size={16} 
              className="mr-2 text-shopify-blue" 
            />
            <span className="text-sm font-medium">{node.name}</span>
          </div>
          
          {isExpanded && hasChildren && (
            <div>
              {Object.values(node.children)
                // Sort directories first, then files
                .sort((a, b) => {
                  if (a.type === b.type) return a.name.localeCompare(b.name);
                  return a.type === 'directory' ? -1 : 1;
                })
                .map(child => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    } else {
      const fileExtension = node.name.split('.').pop();
      const isLiquid = fileExtension === 'liquid';
      const isSelected = selectedFile === node.path;
      
      return (
        <div 
          key={node.path}
          className={cn(
            "flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer",
            "rounded transition-colors duration-150 ease-in-out",
            isSelected && "bg-blue-100 hover:bg-blue-100"
          )}
          style={{ paddingLeft: `${(level * 12) + 28}px` }}
          onClick={() => handleFileClick(node)}
        >
          <File 
            size={16} 
            className={cn(
              "mr-2", 
              isLiquid ? "text-shopify-green" : "text-gray-600"
            )} 
          />
          <span className="text-sm">{node.name}</span>
        </div>
      );
    }
  };

  return (
    <div className="border rounded p-2 h-full overflow-y-auto bg-white">
      <div className="mb-2 px-2 py-1 bg-gray-50 rounded text-sm font-medium">
        Theme Files
      </div>
      {Object.values(fileTree.children)
        // Sort directories first, then files
        .sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'directory' ? -1 : 1;
        })
        .map(node => renderNode(node))}
    </div>
  );
};

export default FileExplorer;
