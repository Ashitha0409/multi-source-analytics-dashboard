import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useDashboardStore } from '../../store/dashboardStore';
import { clsx, formatDate } from '../../utils';

const ACCEPTED = '.csv,.xlsx,.xls';

const FileUploadZone: React.FC = () => {
  const [dragging, setDragging] = useState(false);
  const { uploading, uploadError, handleFiles, removeFile } = useFileUpload();
  const { uploadedFiles } = useDashboardStore();

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(e.target.files);
    e.target.value = ''; // reset so same file can be re-uploaded
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={clsx(
          'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200 cursor-pointer',
          dragging
            ? 'border-indigo-500 bg-purple-200/5 scale-[1.01]'
            : 'border-slate-300 hover:border-slate-600 hover:bg-slate-100/30'
        )}
      >
        <input
          type="file"
          accept={ACCEPTED}
          multiple
          onChange={onInputChange}
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
          aria-label="Upload file"
        />

        {uploading ? (
          <Loader2 size={36} className="text-black animate-spin" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-purple-200/10 border border-indigo-500/30 flex items-center justify-center">
            <Upload size={28} className="text-black" />
          </div>
        )}

        <div>
          <p className="text-black font-semibold text-base">
            {uploading ? 'Processing…' : 'Drop files here or click to upload'}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            Supports <span className="text-slate-600 font-medium">.csv</span>,{' '}
            <span className="text-slate-600 font-medium">.xlsx</span>, and{' '}
            <span className="text-slate-600 font-medium">.xls</span>
          </p>
        </div>
      </div>

      {/* Error message */}
      {uploadError && (
        <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertTriangle size={16} className="text-black flex-shrink-0 mt-0.5" />
          <pre className="text-black text-xs whitespace-pre-wrap">{uploadError}</pre>
        </div>
      )}

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-slate-600 text-xs font-medium uppercase tracking-wider">
            Uploaded Files ({uploadedFiles.length})
          </h3>
          <UploadedFilesList files={uploadedFiles} onRemove={removeFile} />
        </div>
      )}
    </div>
  );
};

// ── Extracted list component ──────────────────────────────────────────────────

interface UploadedFilesListProps {
  files: ReturnType<typeof useDashboardStore.getState>['uploadedFiles'];
  onRemove: (id: string) => void;
}

const UploadedFilesList: React.FC<UploadedFilesListProps> = ({ files, onRemove }) => {
  const { toggleFileMerge } = useDashboardStore();

  return (
    <>
      {files.map(file => (
        <div
          key={file.id}
          className={clsx(
            'flex items-center justify-between p-3 border rounded-xl transition-all duration-200',
            file.merged
              ? 'bg-emerald-50 border-emerald-300/70'
              : 'bg-slate-100/60 border-slate-300/60'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={clsx(
              'w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors',
              file.merged
                ? 'bg-emerald-500/15 border-emerald-500/30'
                : 'bg-slate-200/60 border-slate-300/60'
            )}>
              <FileSpreadsheet size={18} className={file.merged ? 'text-emerald-700' : 'text-slate-500'} />
            </div>
            <div className="min-w-0">
              <p className="text-black text-sm font-medium truncate">{file.name}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span>{file.rowCount.toLocaleString()} rows</span>
                <span>·</span>
                <span>{file.columns.length} columns</span>
                <span>·</span>
                <span>{formatDate(file.uploadedAt)}</span>
              </div>
              {file.hasDuplicates && (
                <div className="flex items-center gap-1 mt-1 text-amber-600 text-xs">
                  <AlertTriangle size={10} />
                  {file.duplicateCount} duplicate row{file.duplicateCount !== 1 ? 's' : ''} detected
                </div>
              )}
              {file.merged && (
                <div className="flex items-center gap-1 mt-1 text-emerald-600 text-xs font-medium">
                  <CheckCircle2 size={10} />
                  Combined with dashboard
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {/* Combine / Disconnect toggle */}
            <button
              id={`combine-toggle-${file.id}`}
              onClick={() => toggleFileMerge(file.id)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200',
                file.merged
                  ? 'bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600'
                  : 'bg-white border-slate-300 text-slate-700 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50'
              )}
              title={file.merged ? 'Click to remove from dashboard' : 'Click to combine with dashboard'}
            >
              {file.merged ? (
                <>
                  <CheckCircle2 size={11} />
                  Combined
                </>
              ) : (
                <>
                  <Upload size={11} />
                  Combine
                </>
              )}
            </button>

            {/* Remove file entirely */}
            <button
              id={`remove-file-${file.id}`}
              onClick={() => onRemove(file.id)}
              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-500/10 transition-colors"
              aria-label="Remove file"
              title="Remove file"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </>
  );
};

export default FileUploadZone;
