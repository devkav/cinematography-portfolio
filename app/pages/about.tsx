import "~/styles/about.css"
import Footer from "~/components/Footer/Footer";
import type { Route } from "./+types/home";
import { FaAngleDown } from "react-icons/fa";
import TitleBar from "~/components/TitleBar/TitleBar";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Maggie Lucy" },
    { name: "description", content: "Cinematography portfolio" },
  ];
}

const content = `Maggie Lucy is an Atlanta-based cinematographer working to express her eye 
for composition, lighting, and storytelling within her work.  With a BFA in Film and Animation,
 a concentration in Cinematography, and a minor in Advertising Photography from Rochester Institute 
 of Technology. Maggie is always pushing boundaries for uniquely captivating visual narratives is 
 always on the table.`

export default function About() {
  const onClick = () => {
    const content = document.getElementById('content');
    content?.scrollIntoView({behavior: 'smooth'});
  }

  return (
    <div>
        <img id="billboard" src="maggie-billboard.jpeg"/>
        <div id="name-container">
          <TitleBar route="about" darkMode/>
          <FaAngleDown id="down-arrow" onClick={onClick} />
        </div>

        <div id="content">
          <h1 id="jumbo-name">Maggie Lucy</h1>
          <h2 id="word-blob">Cinematographer. Visual Communicator.<br/>Artist. Photographer. Filmmaker</h2>

          <div id="text-container">
            <p>{content}</p>
          </div>
        </div>

        <Footer/>
    </div>
  )
}
