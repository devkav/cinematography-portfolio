import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Maggie Lucy" },
    { name: "description", content: "Cinematography portfolio" },
  ];
}

export default function Reel() {
  return (
    <div>
        <h1>Reel</h1>
    </div>
  )
}
