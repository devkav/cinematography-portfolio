import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import "./film-display.css";

import londonLaurel from "../../assets/images/london_laurel.png";
import type { VideoDimensions } from "../FilmRow/FilmRow";

interface FilmDisplayData {
  id: number;
  src: string;
  title: string;
  subtitle: string;
  link?: string;
  laurels?: boolean;
  laurelImages?: string[];
}

interface Props {
  data: FilmDisplayData;
  onLoadCallback: ({ width, height }: VideoDimensions) => void;
  playing: boolean;
}

export default function FilmDisplay({
  data: { id, src, title, subtitle, link, laurels = false, laurelImages = [] },
  onLoadCallback,
  playing
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

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

  let className = "film-display";

  if (link != undefined) {
    className += " clickable";
  }

  const onClick = () => {
    if (link == undefined) {
      return;
    }

    // Pages on this site replace the current tab; external links open in a new one
    const url = new URL(link, window.location.origin);
    const stripWww = (host: string) => host.replace(/^www\./, "");

    if (stripWww(url.hostname) === stripWww(window.location.hostname)) {
      navigate(url.pathname + url.search + url.hash);
    } else {
      window.open(link, "_blank");
    }
  };

  const onLoad = (e: any) => {
    onLoadCallback({ width: e.target.videoWidth, height: e.target.videoHeight });
  };

  return (
    <div className={className} onClick={onClick}>
      <div className="film-display-label-container">
        {laurelSources.length > 0 && (
          <div className="film-display-laurels">
            {laurelSources.map((laurelSrc, index) => (
              <img
                className="film-display-laurel"
                src={laurelSrc}
                alt={`Film festival laurel — ${title}`}
                key={`laurel-${id}-${index}`}
              />
            ))}
          </div>
        )}
        <div className="film-display-label">
          <p className="film-display-title">{title}</p>
          <p className="film-display-subtitle">{subtitle}</p>
        </div>
      </div>
      <video autoPlay muted loop playsInline onLoadedMetadata={onLoad} src={src} ref={videoRef} />
    </div>
  );
}
