import { useEffect, useState } from "react";
import "./admin-dashboard.css";

import { Link } from "react-router";
import PhotoUploadForm from "../PhotoUploadForm/PhotoUploadForm";
import type { PhotoProject, Project } from "src/types/Projects";
import type { TabbedPage } from "../Tabs/Tabs";
import Tabs from "../Tabs/Tabs";
import AnalyticsDashboard from "../AnalyticsDashboard/AnalyticsDashboard";
import { MdFileUpload, MdOutlineShowChart } from "react-icons/md";

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminDashboard({ username, onSignOut }: { username: string; onSignOut: () => void }) {
  const [photos, setPhotos] = useState<PhotoProject[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [filmProjects, setFilmProjects] = useState<Project[]>([]);

  const pages: TabbedPage[] = [
    {
      name: "Analytics",
      content: <AnalyticsDashboard/>,
      icon: <MdOutlineShowChart />

    },
    {
      name: "Upload",
      content: <PhotoUploadForm collections={collections} folders={folders} />,
      icon: <MdFileUpload/>
    },
  ]

  useEffect(() => {
    const tempCollections = new Set<string>();
    const tempFolders = new Set<string>();

    fetch(`${API_URL}/assets?page=photo`).then((data) =>
      data.json().then((data: PhotoProject[]) => {
        data.forEach((collection) => {
          tempCollections.add(collection.collection);
          tempFolders.add(collection.title);
        });

        setCollections(Array.from(tempCollections));
        setFolders(Array.from(tempFolders));
      })
    );
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/assets?page=film`).then((data) => data.json().then((data) => setFilmProjects(data)));
  }, []);



  return (
    <div className="admin-dashboard">
      <header className="admin-header">

        <Link id="logo" to="/">
          Maggie Lucy
        </Link>
        <div className="admin-header-right">
          <span>
            Signed in as <strong>{username}</strong>
          </span>
          <button onClick={onSignOut}>Sign out</button>
        </div>
      </header>
      <Tabs pages={pages}/>
    </div>
  );
}
