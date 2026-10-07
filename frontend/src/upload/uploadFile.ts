import { putFile } from "./putFile";

const API_URL = import.meta.env.VITE_API_URL;

export async function uploadFile(
  idToken: string,
  page: string,
  file: File,
  onProgress: (loadedBytes: number) => void,
  details: Record<string, string> = {}
): Promise<string> {
  const response = await fetch(`${API_URL}/uploads`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: idToken },
    body: JSON.stringify({ page, contentType: file.type, ...details })
  });

  if (!response.ok) {
    const { error } = await response.json().catch(() => ({ error: undefined }));
    throw new Error(error ?? `could not get upload URL (${response.status})`);
  }

  const { url, key } = await response.json();
  await putFile(url, file, onProgress);

  return key;
}
