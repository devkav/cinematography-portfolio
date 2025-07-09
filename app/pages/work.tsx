import ProjectDisplay from "~/components/ProjectDisplay/ProjectDisplay";
import type { Route } from "./+types/home";
import TitleBar from "~/components/TitleBar/TitleBar";

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
    <div>
      <TitleBar route="work"/>
      {projects.map((project) => (<ProjectDisplay/>))}
    </div>
  )
}
