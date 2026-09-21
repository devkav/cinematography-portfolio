import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

interface Props {
  collection: string;
  folder: string;
}

export default function FileUpload({ collection, folder }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const { idToken } = useAuth();

  const totalBytes = files.reduce((total, file) => total + file.size, 0);

  const upload = async () => {
    if (!files.length || !idToken) return;

    setUploading(true);
    setUploadedBytes(0);

    const failures: string[] = [];
    let completedBytes = 0;

    for (const [index, file] of files.entries()) {
      setStatus(`Uploading ${index + 1} of ${files.length}: ${file.name}`);

      try {
        const urlResponse = await fetch(`${API_URL}/uploads`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken
          },
          body: JSON.stringify({
            page: "photo",
            contentType: file.type,
            folder
          })
        });

        if (!urlResponse.ok) {
          throw new Error(`could not get upload URL (${urlResponse.status}): ${await urlResponse.text()}`);
        }

        const { url, key } = await urlResponse.json();

        await new Promise<void>((resolve, reject) => {
          const request = new XMLHttpRequest();

          request.open("PUT", url);
          request.setRequestHeader("Content-Type", file.type);

          request.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setUploadedBytes(completedBytes + event.loaded);
            }
          };

          request.onload = () => {
            if (request.status >= 200 && request.status < 300) {
              resolve();
            } else {
              reject(new Error(`upload failed (${request.status})`));
            }
          };

          request.onerror = () => reject(new Error("upload failed"));
          request.send(file);
        });

        completedBytes += file.size;
        setUploadedBytes(completedBytes);
        setStatus(`Optimizing ${index + 1} of ${files.length}: ${file.name}`);

        const postResponse = await fetch(`${API_URL}/upload_asset`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken
          },
          body: JSON.stringify({
            page: "photo",
            key,
            collection,
            folder
          })
        });

        if (!postResponse.ok) {
          throw new Error(`could not save asset (${postResponse.status}): ${await postResponse.text()}`);
        }
      } catch (err) {
        failures.push(`${file.name} (${err instanceof Error ? err.message : "upload failed"})`);
        completedBytes += file.size;
        setUploadedBytes(completedBytes);
      }
    }

    const uploaded = files.length - failures.length;

    setStatus(
      failures.length
        ? `Uploaded ${uploaded} of ${files.length}. Failed: ${failures.join(", ")}`
        : `Uploaded ${uploaded} photo${uploaded === 1 ? "" : "s"}`
    );

    setUploading(false);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files ?? []));
    setUploadedBytes(0);
    setStatus(null);
  };

  return (
    <div>
      <input type="file" accept="image/*,video/*" multiple onChange={onChange} />
      <button onClick={upload} disabled={!files.length || uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {uploading && (
        <div className="upload-progress">
          <progress value={uploadedBytes} max={totalBytes} />
          <span>{totalBytes ? Math.round((uploadedBytes / totalBytes) * 100) : 0}%</span>
        </div>
      )}
      {status && <p>{status}</p>}
    </div>
  );
}
