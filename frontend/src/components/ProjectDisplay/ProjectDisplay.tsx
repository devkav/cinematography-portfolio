import { useEffect, useRef } from "react";
import "./project-display.css";

import londonLaurel from "../../assets/images/london_laurel.png";
import type { VideoDimensions } from "../VideoRow/VideoRow";

interface ProjectDisplayData {
  id: number;
  src: string;
  title: string;
  subtitle: string;
  link?: string;
  laurels?: boolean;
  laurelImages?: string[];
}

interface Props {
  data: ProjectDisplayData;
  onLoadCallback: ({ width, height }: VideoDimensions) => void;
  playing: boolean;
}

export default function ProjectDisplay({
  data: { id, src, title, subtitle, link, laurels = false, laurelImages = [] },
  onLoadCallback,
  playing
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  if (videoRef.current) {
    // React is bugged and doesn't reflect the "muted" flag on in the DOM. This may lead to different
    // behaviour on mobile. This forces the flag to be added.
    videoRef.current.defaultMuted = true;
  }

  useEffect(() => {
    if (playing) {
      videoRef.current?.play();
    } else {
      videoRef.current?.pause();
    }
  }, [playing]);

  const laurelSources = [...(laurels ? [londonLaurel] : []), ...laurelImages];

  let className = "project-display";

  if (link != undefined) {
    className += " clickable";
  }

  const onClick = () => {
    if (link != undefined) {
      window.open(link, "_blank");
    }
  };

  const onLoad = (e: any) => {
    onLoadCallback({ width: e.target.videoWidth, height: e.target.videoHeight });
  };

  return (
    <div className={className} onClick={onClick}>
      <div className="project-display-label-container">
        {laurelSources.length > 0 && (
          <div className="project-display-laurels">
            {laurelSources.map((laurelSrc, index) => (
              <img
                className="project-display-laurel"
                src={laurelSrc}
                alt={`Film festival laurel — ${title}`}
                key={`laurel-${id}-${index}`}
              />
            ))}
          </div>
        )}
        <div className="project-display-label">
          <p className="project-display-title">{title}</p>
          <p className="project-display-subtitle">{subtitle}</p>
        </div>
      </div>
      <video autoPlay muted loop playsInline onLoadedMetadata={onLoad} src={src} ref={videoRef} />
    </div>
  );
}
