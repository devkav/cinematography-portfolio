import type { Route } from "./+types/home";
import Footer from "~/components/Footer/Footer";
import TitleBar from "~/components/TitleBar/TitleBar";
import { pageDescription } from "~/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Maggie Lucy" },
    { name: "description", content: pageDescription },
  ];
}

export default function Reel() {
  return (
    <div id="reel-content">
      <TitleBar route="reel" darkMode/>
      <div id="reel-container">
        <iframe id="reel-iframe" src="https://www.youtube.com/embed/IF0gXTvGxnk"/>
      </div>

      <Footer darkMode/>
    </div>
  )
}
