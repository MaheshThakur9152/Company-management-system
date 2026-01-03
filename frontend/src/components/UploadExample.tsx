import React, { useState } from 'react';

export default function UploadExample() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setFiles(e.target.files);

  const upload = async () => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('photos', f));
    try {
      const res = await fetch('/api/uploads/images', {
        method: 'POST',
        body: fd,
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      const body = await res.json();
      setResults(body.uploaded || []);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-example">
      <h3>Upload Example</h3>
      <input type="file" multiple accept="image/*" onChange={onChange} />
      <button onClick={upload} disabled={uploading || !files}> {uploading ? 'Uploading...' : 'Upload'}</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <ul>
        {results.map((r, i) => (
          <li key={i}>
            <strong>{r.originalName}</strong> — {r.url ? (<a href={r.url} target="_blank" rel="noreferrer">View</a>) : <span style={{ color: 'orange' }}>{r.error}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
