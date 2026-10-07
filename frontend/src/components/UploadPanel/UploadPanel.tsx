import "./upload-panel.css";

import { useState, type JSX } from "react";
import { MdDescription, MdMovie, MdPhotoCamera } from "react-icons/md";
import FilmManager from "../FilmManager/FilmManager";
import PhotoManager from "../PhotoManager/PhotoManager";
import ResumeUpload from "../ResumeUpload/ResumeUpload";

type UploadView = "film" | "photo" | "resume";

const VIEWS: { view: UploadView; label: string; icon: JSX.Element }[] = [
  { view: "film", label: "Film", icon: <MdMovie /> },
  { view: "photo", label: "Photo", icon: <MdPhotoCamera /> },
  { view: "resume", label: "Résumé", icon: <MdDescription /> }
];

export default function UploadPanel() {
  const [view, setView] = useState<UploadView>("photo");

  return (
    <div className="upload-panel">
      <div className="admin-page-heading">
        <div className="admin-segmented">
          {VIEWS.map(({ view: option, label, icon }) => (
            <button
              key={option}
              className={`admin-segmented-button${option === view ? " active" : ""}`}
              onClick={() => setView(option)}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "film" && <FilmManager />}
      {view === "photo" && <PhotoManager />}
      {view === "resume" && <ResumeUpload />}
    </div>
  );
}
