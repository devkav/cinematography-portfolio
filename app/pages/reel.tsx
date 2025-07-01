import "~/styles/reel.css";
import type { Route } from "./+types/home";
import Footer from "~/components/Footer/Footer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Maggie Lucy" },
    { name: "description", content: "Cinematography portfolio" },
  ];
}

export default function Reel() {
  return (
    <div id="reel-page">
        <div id="title-container">
          <h1 className="page-title">Reel</h1>
        </div>
        <div id="reel-container">
          <iframe id="reel-iframe" src="https://www.youtube.com/embed/IF0gXTvGxnk"/>
        </div>

        <Footer darkMode/>
    </div>
  )
}
