import { useEffect, useRef } from "react";
import "./project-display.css";

import londonLaurel from "../../assets/images/london_laurel.png";
import type { VideoDimensions } from "../VideoRow/VideoRow";

interface ProjectDisplayData {
  id: number,
  src: string,
  title: string,
  subtitle: string,
  link?: string,
  laurels?: boolean;
}

interface Props {
  data: ProjectDisplayData;
  onLoadCallback: ({ width, height }: VideoDimensions) => void;
  playing: boolean;
}

export default function ProjectDisplay({data: { id, src, title, subtitle, link, laurels=false }, onLoadCallback, playing}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (playing) {
      videoRef.current?.play();
    } else {
      videoRef.current?.pause();
    }
  }, [playing])

  let className = "project-display";

  if (link != undefined) {
    className += " clickable";
  }

  const onClick = () => {
    if (link != undefined) {
      window.open(link, "_blank");
    }
  }

  const onLoad = (e: any) => {
    onLoadCallback({ width: e.target.videoWidth, height: e.target.videoHeight });
  }

  return (
    <div className={className} onClick={onClick}>
      <div className="project-display-label-container">
        {laurels && <img className="project-display-laurel" src={londonLaurel} key={`laurel-${id}`}/>}
        <div className="project-display-label">
          <p className="project-display-title">{title}</p>
          <p className="project-display-subtitle">{subtitle}</p>
        </div>
      </div>
      <video muted loop playsInline onLoadedData={onLoad} src={src} ref={videoRef}/>
    </div>
  );
}
