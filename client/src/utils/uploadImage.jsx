// components/ImageUploader.js
import { useRef, useState } from 'react';

export default function ImageUploader({ onUploadSuccess, currentImage }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(currentImage || '');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setUploading(true);
    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append('nama', "file");
    formData.append('image', file);

    try {
      const response = await fetch('https://img.barajacoffee.com/test.php', {
        method: 'POST',
        body: formData,
      });

      const text = await response.text();
      const result = JSON.parse(text);

      if (result.success && result.data && result.data.url) {
        onUploadSuccess(result.data.url);
      } else {
        throw new Error(result.error || 'Upload gagal.');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal upload gambar.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        type="file"
        accept="image/*"
        hidden
        ref={fileRef}
        onChange={handleFileChange}
      />
      <img
        src={preview}
        alt="preview"
        className="h-24 w-24 cursor-pointer rounded-full object-cover"
        onClick={() => fileRef.current.click()}
      />
      {uploading && <p className="text-slate-600">Mengunggah gambar...</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
