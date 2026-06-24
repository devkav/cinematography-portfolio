import Footer from "../components/Footer/Footer";
import TitleBar from "../components/TitleBar/TitleBar";
import Seo from "../components/Seo/Seo";

import "../styles/reel.css";

export default function Reel() {
  return (
    <div id="reel-content">
      <Seo
        title="Reel"
        description="Watch the cinematography reel of Maggie Lucy, an Atlanta-based cinematographer."
        path="/reel"
      />
      <TitleBar route="reel" />
      <div id="reel-container">
        <iframe id="reel-iframe" title="Maggie Lucy cinematography reel" src="https://www.youtube.com/embed/IF0gXTvGxnk" />
      </div>

      <Footer />
    </div>
  );
}
