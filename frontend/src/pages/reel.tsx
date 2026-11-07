import { useState } from "react";
import Footer from "../components/Footer/Footer";
import TitleBar from "../components/TitleBar/TitleBar";
import Seo from "../components/Seo/Seo";
import type { Reel as ReelVideo } from "../types/Projects";

import "../styles/reel.css";

// Shown while the reel list is still loading. Most of the time there are two reels.
const PLACEHOLDER_COUNT = 2;

function ReelPlayer({ videoId, title }: { videoId: string; title: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`reel-frame${loaded ? "" : " reel-skeleton"}`}>
      <iframe
        className={`reel-iframe${loaded ? " loaded" : ""}`}
        title={title}
        src={`https://www.youtube.com/embed/${videoId}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

export default function Reel({ reels }: { reels?: ReelVideo[] }) {
  return (
    <div id="reel-content">
      <Seo
        title="Reel"
        description="Watch the cinematography reel of Maggie Lucy, an Atlanta-based cinematographer."
        path="/reel"
      />
      <TitleBar route="reel" />
      <div id="reel-container">
        {reels
          ? reels.map(({ videoId }, index) => (
              <ReelPlayer
                key={videoId}
                videoId={videoId}
                title={index === 0 ? "Maggie Lucy cinematography reel" : `Maggie Lucy cinematography reel ${index + 1}`}
              />
            ))
          : Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
              <div key={index} className="reel-frame reel-skeleton" aria-hidden="true" />
            ))}
      </div>

      <Footer />
    </div>
  );
}
