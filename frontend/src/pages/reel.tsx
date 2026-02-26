import Footer from "../components/Footer/Footer";
import TitleBar from "../components/TitleBar/TitleBar";

import "../styles/reel.css";

export default function Reel() {
  return (
    <div id="reel-content">
      <TitleBar route="reel" />
      <div id="reel-container">
        <iframe id="reel-iframe" src="https://www.youtube.com/embed/IF0gXTvGxnk" />
      </div>

      <Footer />
    </div>
  );
}
