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
  const [foldersByCollection, setFoldersByCollection] = useState<Record<string, string[]>>({});
  const [filmProjects, setFilmProjects] = useState<Project[]>([]);

  const pages: TabbedPage[] = [
    {
      name: "Analytics",
      content: <AnalyticsDashboard />,
      icon: <MdOutlineShowChart />
    },
    {
      name: "Upload",
      content: <PhotoUploadForm collections={collections} foldersByCollection={foldersByCollection} />,
      icon: <MdFileUpload />
    }
  ];

  useEffect(() => {
    fetch(`${API_URL}/assets?page=photo`).then((data) =>
      data.json().then((data: PhotoProject[]) => {
        const grouped: Record<string, string[]> = {};

        data.forEach((project) => {
          grouped[project.collection] = [...(grouped[project.collection] ?? []), project.title];
        });

        setCollections(Object.keys(grouped));
        setFoldersByCollection(grouped);
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
      <Tabs pages={pages} />
    </div>
  );
}
