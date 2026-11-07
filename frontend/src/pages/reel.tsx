import Footer from "../components/Footer/Footer";
import TitleBar from "../components/TitleBar/TitleBar";
import Seo from "../components/Seo/Seo";
import type { Reel as ReelVideo } from "../types/Projects";

import "../styles/reel.css";

export default function Reel({ reels }: { reels: ReelVideo[] }) {
  return (
    <div id="reel-content">
      <Seo
        title="Reel"
        description="Watch the cinematography reel of Maggie Lucy, an Atlanta-based cinematographer."
        path="/reel"
      />
      <TitleBar route="reel" />
      <div id="reel-container">
        {reels.map(({ videoId }, index) => (
          <iframe
            key={videoId}
            className="reel-iframe"
            title={index === 0 ? "Maggie Lucy cinematography reel" : `Maggie Lucy cinematography reel ${index + 1}`}
            src={`https://www.youtube.com/embed/${videoId}`}
          />
        ))}
      </div>

      <Footer />
    </div>
  );
}
