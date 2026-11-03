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
        {rows.map(({ width, gap, space, cells }, rowIndex) => (
          <div
            className="photo-landing-row"
            style={{ "--width": `${width}%`, "--gap": `${gap}cqw`, "--space": `${space}cqw` } as CSSProperties}
            key={`row-${rowIndex}`}
          >
            {cells.map(({ src, folder, index, flex }) => (
              <Link
                className="photo-landing-cell"
                style={{ "--flex": flex } as CSSProperties}
                to={{ pathname: "/photo", search: getPhotoSearch(folder, index) }}
                key={src}
              >
                <img src={src} alt={`${folder} photography by Maggie Lucy`} loading="lazy" />
              </Link>
            ))}
          </div>
        ))}
      </div>
      <Footer darkMode={false} />
    </div>
  );
}
