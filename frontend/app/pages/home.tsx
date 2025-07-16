import type { Route } from "./+types/home";
import "~/styles/home.css";
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
        <h1 id="title" className="page-title">MAGGIE LUCY</h1>
      </div>

      <div id="welcome-container">
        <div id="welcome-button-row">
          <a href="/work">Work</a>
          <a href="/reel">Reel</a>
          <a href="/about">About</a>
        </div>
      </div>
    </div>
  )
}
