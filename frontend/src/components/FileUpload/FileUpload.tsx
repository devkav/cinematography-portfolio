import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

export default function FileUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { idToken } = useAuth();

  const upload = async () => {
    const file = files[0];
    if (!file || !idToken) return;

    setUploading(true);
    setStatus("Requesting upload URL...");

    try {
      const urlResponse = await fetch(`${API_URL}/uploads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: idToken,
        },
        body: JSON.stringify({
          page: "photo",
          contentType: file.type,
          folder: "test"
        }),
      });

      if (!urlResponse.ok) {
        const text = await urlResponse.text();
        setStatus(`Failed to get upload URL (${urlResponse.status}): ${text}`);
        return;
      }

      const { url, key } = await urlResponse.json();

      setStatus("Uploading...");

      const putResponse = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!putResponse.ok) {
        setStatus(`Upload failed: ${putResponse.status}`);
        return;
      }

      const postResponse = await fetch(`${API_URL}/upload_asset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: idToken,
        },
        body: JSON.stringify({
          page: "photo",
          src: key,
          collection: "Test",
          folder: "Test"
        }),
      })

      setStatus(`Uploaded as ${key}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setStatus(message);
    } finally {
      setUploading(false);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files ?? []));
  };

  return (
    <div>
      <input type="file" accept="image/*,video/*" onChange={onChange} />
      <button onClick={upload} disabled={!files.length || uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {status && <p>{status}</p>}
    </div>
  );
}
