import Footer from "~/components/Footer/Footer";
import type { Route } from "./+types/home";
import { FaAngleDown } from "react-icons/fa";
import TitleBar from "~/components/TitleBar/TitleBar";
import maggieBillboard from "~/assets/images/maggie-billboard.jpeg";
import maggiePortrait from "~/assets/images/maggie-portrait.jpg";
import { pageDescription } from "~/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Maggie Lucy" },
    { name: "description", content: pageDescription },
  ];
}

const content = `Maggie Lucy is an Atlanta-based cinematographer working to express her eye 
for composition, lighting, and storytelling within her work.  With a BFA in Film and Animation,
 a concentration in Cinematography, and a minor in Advertising Photography from Rochester Institute 
 of Technology. Maggie is always pushing boundaries for uniquely captivating visual narratives is 
 always on the table.`

export default function Contact() {
  const onClick = () => {
    const content = document.getElementById('contact-content');
    content?.scrollIntoView({behavior: 'smooth'});
  }

  return (
    <div>
        <img id="billboard" src={maggieBillboard}/>
        <div id="name-container">
          <TitleBar route="contact" darkMode/>
          <div id="information-container">
            <div id="information-top-container">
              <p className="contact-header">Contact:</p>
              <p>E: <a href="mailto:maggieclucy@gmail.com">maggieclucy@gmail.com</a></p>
              <p>IG: <a href="https://www.instagram.com/maggielucyscamera">maggielucyscamera</a></p>
            </div>
            <div id="information-bottom-container">
              <p id="contact-college-label">RIT College of Art and Design Graduate</p>
              <p id="contact-location-label">Based in Atlanta</p>
            </div>
          </div>
          <div id="down-arrow-container" onClick={onClick}>
            <p>About Me</p>
            <FaAngleDown id="down-arrow" />
          </div>
        </div>

        <div id="contact-content">
          <div id="about-columns">
            <div id="photo-col" className="content-col">
              <img src={maggiePortrait} id="portrait"/>
            </div>
            <div id="text-col" className="content-col">
              <h2 id="word-blob">Cinematographer.<br/>Visual Communicator.<br/>Artist. Photographer. Filmmaker.</h2>
              <p id="about-content">{content}</p>
              <a href="">Résumé</a>
            </div>
          </div>

          <Footer darkMode/>
        </div>
    </div>
  )
}
