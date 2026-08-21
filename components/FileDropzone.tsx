"use client";

import { useState } from "react";

type FileDropzoneProps = {
  label: string;
  accept: string;
  multiple?: boolean;
  files?: File[];
  onFiles: (files: File[]) => void;
  onRemove?: (index: number) => void;
};

export function FileDropzone({ label, accept, multiple = false, files = [], onFiles, onRemove }: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);

  function deliver(nextFiles: File[]) {
    if (nextFiles.length > 0) onFiles(multiple ? nextFiles : nextFiles.slice(0, 1));
  }

  return (
    <div
      className={`file-dropzone${dragging ? " file-dropzone--dragging" : ""}`}
      data-testid={`${label} 드롭존`}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        deliver(Array.from(event.dataTransfer.files));
      }}
    >
      <div className="file-dropzone__icon" aria-hidden="true">＋</div>
      <div>
        <b>{label}</b>
        <p>파일을 이곳에 끌어다 놓거나 파일 선택을 이용해 주세요.</p>
      </div>
      <label className="button-secondary file-dropzone__button">
        파일 선택
        <input
          className="sr-only"
          type="file"
          aria-label={`${label} 파일`}
          accept={accept}
          multiple={multiple}
          onChange={(event) => deliver(Array.from(event.target.files ?? []))}
        />
      </label>
      {files.length > 0 && (
        <ul className="file-dropzone__files">
          {files.map((file, index) => <li key={`${file.name}-${file.size}-${index}`}><span>{file.name}</span>{onRemove && <button type="button" aria-label={`${label} 파일 삭제`} onClick={() => onRemove(index)}>삭제</button>}</li>)}
        </ul>
      )}
    </div>
  );
}
