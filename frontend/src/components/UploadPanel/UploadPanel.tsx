import "./upload-panel.css";

import type { JSX } from "react";
import { MdDescription, MdMovie, MdPhotoCamera, MdVideoLibrary, MdViewQuilt } from "react-icons/md";
import FilmManager from "../FilmManager/FilmManager";
import PhotoManager from "../PhotoManager/PhotoManager";
import PhotoLayoutEditor from "../PhotoLayoutEditor/PhotoLayoutEditor";
import ReelManager from "../ReelManager/ReelManager";
import ResumeUpload from "../ResumeUpload/ResumeUpload";

export type UploadView = "reel" | "film" | "photo" | "photo-layout" | "resume";

const VIEWS: { view: UploadView; label: string; icon: JSX.Element }[] = [
  { view: "reel", label: "Reel", icon: <MdVideoLibrary /> },
  { view: "film", label: "Film", icon: <MdMovie /> },
  { view: "photo", label: "Photo", icon: <MdPhotoCamera /> },
  { view: "photo-layout", label: "Photo layout", icon: <MdViewQuilt /> },
  { view: "resume", label: "Résumé", icon: <MdDescription /> }
];

export default function UploadPanel({
  selected,
  onSelect
}: {
  selected: string | null;
  onSelect: (view: UploadView) => void;
}) {
  const view = VIEWS.find((option) => option.view === selected)?.view ?? "photo";

  return (
    <div className="upload-panel">
      <div className="admin-page-heading">
        <div className="admin-segmented">
          {VIEWS.map(({ view: option, label, icon }) => (
            <button
              key={option}
              className={`admin-segmented-button${option === view ? " active" : ""}`}
              onClick={() => onSelect(option)}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "reel" && <ReelManager />}
      {view === "film" && <FilmManager />}
      {view === "photo" && <PhotoManager />}
      {view === "photo-layout" && <PhotoLayoutEditor />}
      {view === "resume" && <ResumeUpload />}
    </div>
  );
}
