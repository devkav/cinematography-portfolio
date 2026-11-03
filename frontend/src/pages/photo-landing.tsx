import type { CSSProperties } from "react";
import { Link } from "react-router";
import type { PhotoLayoutRow } from "src/types/Projects";
import Footer from "../components/Footer/Footer";
import TitleBar from "../components/TitleBar/TitleBar";
import Seo from "../components/Seo/Seo";
import { getPhotoSearch } from "../utils/photoSearchParams";

import "../styles/photo-landing.css";

export default function PhotoLanding({ rows }: { rows: PhotoLayoutRow[] }) {
  return (
    <div id="photo-landing-page">
      <Seo
        title="Photography"
        description="Photography portfolio of Maggie Lucy, an Atlanta-based cinematographer and photographer."
        path="/photo"
      />
      <TitleBar route="photo" darkMode={false} />
      <div id="photo-landing-rows">
        {rows.map(({ width, gap, space, label, labelSide, cells }, rowIndex) => {
          const labelIndex = labelSide === "right" ? cells.length - 1 : 0;

          return (
            <div
              className={`photo-landing-row${label ? " labeled" : ""}`}
              style={{ "--width": `${width}%`, "--gap": `${gap}cqw`, "--space": `${space}cqw` } as CSSProperties}
              key={`row-${rowIndex}`}
            >
              {cells.map(({ src, folder, index, flex }, cellIndex) => (
                <div className="photo-landing-cell" style={{ "--flex": flex } as CSSProperties} key={src}>
                  <Link to={{ pathname: "/photo", search: getPhotoSearch(folder, index) }}>
                    <img src={src} alt={`${folder} photography by Maggie Lucy`} loading="lazy" />
                  </Link>
                  {label && cellIndex === labelIndex && <p className={`photo-landing-label ${labelSide}`}>{label}</p>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <Footer darkMode={false} />
    </div>
  );
}
