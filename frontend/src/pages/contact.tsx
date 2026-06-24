import Footer from "../components/Footer/Footer";
import { FaAngleDown } from "react-icons/fa";
import TitleBar from "../components/TitleBar/TitleBar";
import Seo from "../components/Seo/Seo";

import "../styles/contact.css";

const content = `Maggie Lucy is an Atlanta-based cinematographer working to express her eye
for composition, lighting, and storytelling within her work. She holds a BFA in Film and Animation,
 with a concentration in Cinematography and a minor in Advertising Photography, from the Rochester
 Institute of Technology. Maggie is always pushing boundaries, and uniquely captivating visual
 narratives are always on the table.`;

export default function Contact() {
  const onClick = () => {
    const content = document.getElementById("contact-content");
    content?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      <Seo
        title="Contact"
        description="Get in touch with Maggie Lucy, an Atlanta-based cinematographer and RIT College of Art and Design graduate."
        path="/contact"
      />
      <img
        id="billboard"
        alt="Maggie Lucy on set"
        src="https://d3amd0zp63qrni.cloudfront.net/assets/images/maggie-billboard.jpeg"
      />
      <div id="name-container">
        <TitleBar route="contact" />
        <div id="information-container">
          <div id="information-top-container">
            <p className="contact-header">Contact:</p>
            <p>
              E: <a href="mailto:maggieclucy@gmail.com">maggieclucy@gmail.com</a>
            </p>
            <p>
              IG: <a href="https://www.instagram.com/maggielucyscamera">maggielucyscamera</a>
            </p>
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
            <img
              id="portrait"
              alt="Portrait of cinematographer Maggie Lucy"
              src="https://d3amd0zp63qrni.cloudfront.net/assets/images/maggie-portrait.jpg"
            />
          </div>
          <div id="text-col" className="content-col">
            <h2 id="word-blob">
              Cinematographer.
              <br />
              Visual Communicator.
              <br />
              Artist. Photographer. Filmmaker.
            </h2>
            <p id="about-content">{content}</p>
            <a href="https://d3amd0zp63qrni.cloudfront.net/resume.pdf" target="_blank">
              Résumé
            </a>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
