import type { Route } from "./+types/home";
import TitleBar from "~/components/TitleBar/TitleBar";
import Footer from "~/components/Footer/Footer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Maggie Lucy" },
    { name: "description", content: "Cinematography portfolio" },
  ];
}

const projects = [
  "Title1",
  "Title2",
  "Title3",
  "Title4",
  "Title5",
]

export default function Work() {
  return (
    <div id="work-content">
      <TitleBar route="work"/>
      <p id="text">Coming Soon</p>
      <Footer/>
    </div>
  )
}
