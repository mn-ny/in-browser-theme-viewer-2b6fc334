
import JSZip from 'jszip';
import { vfs, VirtualFile } from './vfs';

export const processZipFile = async (file: File): Promise<boolean> => {
  try {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    vfs.clear();

    const filePromises: Promise<void>[] = [];

    contents.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        const promise = zipEntry.async(getContentType(relativePath))
          .then((content) => {
            vfs.addFile(
              relativePath,
              content,
              getFileType(relativePath)
            );
          });
        filePromises.push(promise);
      }
    });

    await Promise.all(filePromises);
    console.log('Processed ZIP file:', vfs.getAllFiles().length, 'files extracted');
    return true;
  } catch (error) {
    console.error('Error processing ZIP file:', error);
    return false;
  }
};

const getContentType = (path: string): 'string' | 'arraybuffer' => {
  const extension = path.split('.').pop()?.toLowerCase();
  const binaryExtensions = [
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 
    'woff', 'woff2', 'ttf', 'eot', 'otf',
    'mp4', 'webm', 'ogg', 'mp3', 'wav',
    'pdf', 'zip', 'gz', 'tar'
  ];
  
  return binaryExtensions.includes(extension || '') ? 'arraybuffer' : 'string';
};

const getFileType = (path: string): string => {
  const parts = path.split('/');
  const filename = parts[parts.length - 1];
  const extension = filename.split('.').pop()?.toLowerCase() || '';

  if (extension === 'liquid') {
    if (path.includes('/sections/')) return 'section';
    if (path.includes('/snippets/')) return 'snippet';
    if (path.includes('/templates/')) return 'template';
    if (path.includes('/layout/')) return 'layout';
  }

  return extension || 'unknown';
};

export const getFileCounts = (): Record<string, number> => {
  const counts: Record<string, number> = {
    total: vfs.getAllFiles().length,
    liquid: vfs.getFilesByType('liquid').length,
    section: vfs.getFilesByType('section').length,
    snippet: vfs.getFilesByType('snippet').length,
    template: vfs.getFilesByType('template').length,
    layout: vfs.getFilesByType('layout').length,
    assets: vfs.getAllFiles().filter(file => file.path.startsWith('assets/')).length
  };
  return counts;
};
