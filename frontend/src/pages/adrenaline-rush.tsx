import TitleBar from "../components/TitleBar/TitleBar";
import Footer from "../components/Footer/Footer";

import "../styles/adrenaline-rush.css";

const ASSET_URL = "https://d3amd0zp63qrni.cloudfront.net/assets/images/film-pages/adrenaline-rush";

const synopsis = `In a world where racing transcends reality, two rival drivers enter a virtual race that
 blurs the line between competition, memory, and desire. As the race unfolds, fragments of their
 relationship bleed into the digital landscape, forcing Corvette to confront the cost of winning and
 question whether victory is worth losing herself.`;

const shoot = [
  `Shot in spring 2025 at Rochester Institute of Technology, Adrenaline Rush blends emerging virtual
 production technology with the nostalgic texture of analog filmmaking. Filmed on RIT’s LED volume at
 MAGIC Spell Studios, the production brought its neon-soaked racing world to life through digitally
 rendered environments and in-camera visual effects.`,
  `The class was gifted a Super 8 Camera and 3 rolls of film from Kodak. There is real footage shot on
 the stage and in the environment. The mix of futuristic digital worlds and dreamy analog imagery gives
 the film its own unique visual vibe. Adrenaline Rush pushed these tools in an experimental direction,
 mixing virtual production with classic filmmaking techniques.`
];

const bts = `Behind-the-scenes photography and video from the production have been featured across RIT’s
 marketing and promotional platforms, highlighting the crew/creative visual process that went into the
 process to show off the School of Film and Animation through the possibilities of virtual production.`;

export default function AdrenalineRush() {
  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <div id="adrenaline-rush-content">
        <section id="ar-hero" className="ar-section">
          <img
            className="ar-background"
            alt="Driver reflected in a car mirror"
            src={`${ASSET_URL}/6800457a-9b53-400d-9979-260a196b2924.png`}
          />
          <div id="ar-title-bar">
            <TitleBar route="work" darkMode={false} />
          </div>
          <div id="ar-hero-content">
            <img id="ar-logo" alt="Adrenaline Rush" src={`${ASSET_URL}/adrenaline_rush_transparent.png`} />
            <p id="ar-subtitle">Experimental Short Film | Virtual Production</p>
          </div>
        </section>

        <section id="ar-about" className="ar-section ar-text-section">
          <img
            className="ar-background"
            alt="Still from Adrenaline Rush"
            loading="lazy"
            src={`${ASSET_URL}/05f2f539-f484-4691-9a07-091e3cb61de5.png`}
          />
          <div className="ar-text-block">
            <h2 className="ar-section-header">About the Film</h2>
            <p className="ar-body">{synopsis}</p>
          </div>
        </section>

        <section id="ar-shoot" className="ar-section ar-text-section">
          <img
            className="ar-background"
            alt="Still from Adrenaline Rush"
            loading="lazy"
            src={`${ASSET_URL}/506eb5db-4401-4cf7-98fa-d9c61584be6f.png`}
          />
          <div className="ar-text-block">
            <h2 className="ar-section-header">The Shoot</h2>
            {shoot.map((paragraph, i) => (
              <p key={`shoot-${i}`} className="ar-body">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section id="ar-logos">
          <img
            className="ar-partner-logo"
            alt="RIT MAGIC Spell Studios"
            loading="lazy"
            src={`${ASSET_URL}/rit_magic_spell_studios_white.png`}
          />
          <img className="ar-partner-logo" alt="Kodak" loading="lazy" src={`${ASSET_URL}/kodak.png`} />
          <img className="ar-partner-logo" alt="RIT Car Club" loading="lazy" src={`${ASSET_URL}/rit_car_club.png`} />
        </section>

        <section id="ar-bts" className="ar-section ar-text-section">
          <img
            className="ar-background ar-uncropped"
            alt="Crew filming Adrenaline Rush on the LED volume"
            loading="lazy"
            src={`${ASSET_URL}/5d0b3881-43f0-4334-9517-80e6aa314d9b.jpg`}
          />
          <div className="ar-text-block">
            <h2 className="ar-section-header">BTS</h2>
            <p className="ar-body">{bts}</p>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
