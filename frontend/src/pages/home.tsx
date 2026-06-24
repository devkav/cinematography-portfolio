import { Link } from "react-router";
import Footer from "../components/Footer/Footer";
import Seo from "../components/Seo/Seo";
import { MenuRoute } from "../types/MenuRoute";
import "../styles/home.css";
import { useRef } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);

  if (videoRef.current) {
    // React is bugged and doesn't reflect the "muted" flag on in the DOM. This may lead to different
    // behaviour on mobile. This forces the flag to be added.
    videoRef.current.defaultMuted = true;
  }

  const buttons = Object.keys(MenuRoute)
    .filter((key) => key !== "home")
    .map((key) => MenuRoute[key])
    .sort((a, b) => (a.order > b.order ? 1 : -1))
    .map(({ title, route }) => (
      <Link to={route} key={`route-${title}`}>
        {title}
      </Link>
    ));

  return (
    <div>
      <Seo
        title="Atlanta Cinematographer"
        description="Maggie Lucy is an Atlanta-based cinematographer with an eye for composition, lighting, and storytelling. Explore her film reel, cinematography work, and photography."
        path="/"
      />
      <video
        autoPlay
        muted
        loop
        playsInline
        id="jumbo-video"
        src="https://d3amd0zp63qrni.cloudfront.net/assets/videos/landing-video.mp4"
        poster="https://d3amd0zp63qrni.cloudfront.net/assets/images/maggie-billboard.jpeg"
        ref={videoRef}
      />
      <div id="title-container">
        <h1 id="title" className="page-title">
          Maggie Lucy
        </h1>

        <div id="welcome-button-row">{buttons}</div>
      </div>

      <div id="footer-container">
        <Footer noCopyright />
      </div>
    </div>
  );
}
