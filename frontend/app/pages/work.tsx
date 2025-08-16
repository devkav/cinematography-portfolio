import type { Route } from "./+types/home";
import TitleBar from "~/components/TitleBar/TitleBar";
import Footer from "~/components/Footer/Footer";
import { pageDescription } from "~/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Maggie Lucy" },
    { name: "description", content: pageDescription },
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
