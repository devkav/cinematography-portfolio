import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Maggie Lucy" },
    { name: "description", content: "Cinematography portfolio" },
  ];
}

export default function About() {
  return (
    <div>
        <h1>About</h1>
    </div>
  )
}
