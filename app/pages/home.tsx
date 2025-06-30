import type { Route } from "./+types/home";
import "~/styles/home.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Maggie Lucy" },
    { name: "description", content: "Cinematography portfolio" },
  ];
}

export default function Home() {
  return (
    <div>
      <video autoPlay muted loop src="landing-video.mp4" id="jumbo-video"/>
      <div id="title-container">
        <h1 id="title">MAGGIE LUCY</h1>
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
