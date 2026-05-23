import { useEffect, useState } from "react";

import PhotoUploadForm from "../PhotoUploadForm/PhotoUploadForm";
import type { PhotoProject, Project } from "src/types/Projects";

const API_URL = import.meta.env.VITE_API_URL;


export default function AdminDashboard({ username, onSignOut }: { username: string; onSignOut: () => void }) {
  const [photos, setPhotos] = useState<PhotoProject[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);

  const [filmProjects, setFilmProjects] = useState<Project[]>([]);

  useEffect(() => {
    const tempCollections = new Set<string>();
    const tempFolders = new Set<string>();

    fetch(`${API_URL}/assets?page=photo`).then((data) => data.json().then((data: PhotoProject[]) => {
      data.forEach((collection) => {
        tempCollections.add(collection.collection)
        tempFolders.add(collection.title)
      })

      setCollections(Array.from(tempCollections));
      setFolders(Array.from(tempFolders));
    }));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/assets?page=film`).then((data) => data.json().then((data) => setFilmProjects(data)));
  }, []);

  console.log(collections)
  console.log(folders)

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin</h1>
        <div className="admin-header-right">
          <span>
            Signed in as <strong>{username}</strong>
          </span>
          <button onClick={onSignOut}>Sign out</button>
        </div>
      </header>
      <main>
        <p>Admin functionality coming soon.</p>
        <PhotoUploadForm collections={collections} folders={folders}/>
      </main>
    </div>
  );
}
