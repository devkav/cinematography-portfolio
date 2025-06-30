import ProjectDisplay from "~/components/ProjectDisplay";
import type { Route } from "./+types/home";

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
        <h1>Work</h1>
        {projects.map((project) => (<ProjectDisplay/>))}
    </div>
  )
}
