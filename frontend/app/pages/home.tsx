import type { Route } from "./+types/home";
import { Link } from "react-router";
import Footer from "~/components/Footer/Footer";
import landingVideo from "~/assets/videos/landing-video.mp4";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Maggie Lucy" },
    { name: "description", content: "Cinematography portfolio" },
  ];
}

export default function Home() {
  return (
    <div>
      <video autoPlay muted loop playsInline src={landingVideo} id="jumbo-video"/>
      <div id="title-container">
        <h1 id="title" className="page-title">Maggie Lucy</h1>

        <div id="welcome-button-row">
          <Link to="/work">Work</Link>
          <Link to="/reel">Reel</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </div>

      <div id="footer-container">
        <Footer darkMode noCopyright/>
      </div>
    </div>
  )
}
