
export interface VirtualFile {
  content: string | ArrayBuffer;
  path: string;
  type: string;
  name: string;
}

export interface VirtualFileSystem {
  files: Record<string, VirtualFile>;
  addFile: (path: string, content: string | ArrayBuffer, type: string) => void;
  getFile: (path: string) => VirtualFile | undefined;
  getAllFiles: () => VirtualFile[];
  getFilesByType: (type: string) => VirtualFile[];
  getFilesByPath: (pathPrefix: string) => VirtualFile[];
  clear: () => void;
}

export const createVFS = (): VirtualFileSystem => {
  const files: Record<string, VirtualFile> = {};

  return {
    files,
    addFile: (path: string, content: string | ArrayBuffer, type: string) => {
      const name = path.split('/').pop() || '';
      files[path] = { content, path, type, name };
    },
    getFile: (path: string) => files[path],
    getAllFiles: () => Object.values(files),
    getFilesByType: (type: string) => 
      Object.values(files).filter(file => file.type === type),
    getFilesByPath: (pathPrefix: string) => 
      Object.values(files).filter(file => file.path.startsWith(pathPrefix)),
    clear: () => {
      Object.keys(files).forEach(key => delete files[key]);
    }
  };
};

export const vfs = createVFS();
