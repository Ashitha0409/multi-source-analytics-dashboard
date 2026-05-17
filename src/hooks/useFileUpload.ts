import { useCallback, useState } from 'react';
import { parseFile } from '../services/fileParser';
import { useDashboardStore } from '../store/dashboardStore';
import type { UploadedFile } from '../types';

interface UseFileUploadReturn {
  uploading: boolean;
  uploadError: string | null;
  handleFiles: (files: FileList | File[]) => Promise<void>;
  removeFile: (id: string) => void;
}

/**
 * Hook: handles file upload, parsing, and merging into the global store.
 */
export const useFileUpload = (): UseFileUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { addUploadedFile, removeUploadedFile, rebuildData } = useDashboardStore();

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    setUploadError(null);

    const errors: string[] = [];

    for (const file of fileArray) {
      try {
        const parsed: UploadedFile = await parseFile(file);
        addUploadedFile(parsed);
      } catch (err) {
        errors.push(`${file.name}: ${(err as Error).message}`);
      }
    }

    // Merge all uploaded rows into global state
    rebuildData();

    if (errors.length > 0) {
      setUploadError(errors.join('\n'));
    }

    setUploading(false);
  }, [addUploadedFile, rebuildData]);

  const removeFile = useCallback((id: string) => {
    removeUploadedFile(id);
    rebuildData();
  }, [removeUploadedFile, rebuildData]);

  return { uploading, uploadError, handleFiles, removeFile };
};



