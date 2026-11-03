import TitleBar from "../components/TitleBar/TitleBar";
import Footer from "../components/Footer/Footer";
import FilmRow from "../components/FilmRow/FilmRow";
import Seo from "../components/Seo/Seo";
import { useRef, useEffect, useState } from "react";

import "../styles/film.css";
import type { FilmProject } from "src/types/Projects";

export default function Film({ projects }: { projects: FilmProject[] }) {
  const videosPerRow = 2;
  const rowContainerRef = useRef(null);
  const [parentWidth, setParentWidth] = useState(0);
  const [numRowsLoaded, setNumRowsLoaded] = useState(0);
  const rows: any = [];
  let currentRow: any = [];

  useEffect(() => {
    const updateParentWidth = () => {
      if (rowContainerRef.current) {
        // Subtract padding
        setParentWidth(window.innerWidth - 32);
      }
    };

    window.addEventListener("resize", updateParentWidth);
    updateParentWidth();

    return () => window.removeEventListener("resize", updateParentWidth);
  }, [rowContainerRef]);

  const allLoadedCallback = (index: number) => {
    setNumRowsLoaded((prevNumRowsLoaded) => Math.max(prevNumRowsLoaded, index + 1));
  };

  projects.forEach((project, index) => {
    currentRow.push(project);

    if (currentRow.length >= videosPerRow) {
      const rowIndex = rows.length;

      rows.push(
        <FilmRow
          videos={currentRow}
          parentWidth={parentWidth}
          allLoadedCallback={() => allLoadedCallback(rowIndex)}
          key={index}
        />
      );
      currentRow = [];
    }
  });

  if (currentRow.length > 0) {
    rows.push(
      <FilmRow
        videos={currentRow}
        parentWidth={parentWidth}
        allLoadedCallback={() => allLoadedCallback(rows.length)}
        key={projects.length - 1}
      />
    );
  }

  const loadedRows = rows.reduce(
    (acc: (typeof FilmRow)[], filmRow: typeof FilmRow, index: number) =>
      index <= numRowsLoaded ? [...acc, filmRow] : acc,
    []
  );

  return (
    <div id="film-content">
      <Seo
        title="Film"
        description="Selected film and cinematography work by Maggie Lucy, an Atlanta-based cinematographer."
        path="/film"
      />
      <TitleBar route="film" />
      <div id="film-row-container" ref={rowContainerRef}>
        {loadedRows}
      </div>
      <Footer />
    </div>
  );
}
