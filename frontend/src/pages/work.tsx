import TitleBar from "../components/TitleBar/TitleBar";
import Footer from "../components/Footer/Footer";
import VideoRow from "../components/VideoRow/VideoRow";
import { useRef, useEffect, useState } from "react";

import "../styles/work.css";
import type { Project } from "src/main";


export default function Work({projects}: {projects: Project[]}) {
  const videosPerRow = 2;
  const rowContainerRef = useRef(null);
  const [parentWidth, setParentWidth] = useState(0)
  const [numRowsLoaded, setNumRowsLoaded] = useState(0);
  const rows: any= [];
  let currentRow: any = [];

  useEffect(() => {
    const updateParentWidth = () => {
      if (rowContainerRef.current) {
        // Subtract padding
        setParentWidth(window.innerWidth - 32);
      }
    }

    const updateTwice = () => {
      updateParentWidth();
      updateParentWidth();
    }

    window.addEventListener("resize", updateTwice)
    updateParentWidth();

    return () => window.removeEventListener("resize", updateTwice);
  }, [rowContainerRef]);

  const allLoadedCallback = (index: number) => {
    setNumRowsLoaded((prevNumRowsLoaded) => Math.max(prevNumRowsLoaded, index + 1));
  }

  projects.forEach((project, index) => {
    currentRow.push(project)

    if (currentRow.length >= videosPerRow) {
      const rowIndex = rows.length;

      rows.push(
        <VideoRow 
          videos={currentRow}
          parentWidth={parentWidth}
          allLoadedCallback={() => allLoadedCallback(rowIndex)}
          key={index}
        />
      )
      currentRow = []
    }
  })

  if (currentRow.length > 0) {
    rows.push(
      <VideoRow 
        videos={currentRow}
        parentWidth={parentWidth}
        allLoadedCallback={() => allLoadedCallback(rows.length)}
        key={projects.length - 1}
      />
    )
  }

  const loadedRows = rows.reduce(
    (acc: typeof VideoRow[], videoRow: typeof VideoRow, index: number) => index <= numRowsLoaded ? [...acc, videoRow] : acc
  , []);

  return (
    <div id="work-content">
      <TitleBar route="work"/>
      <div id="work-row-container" ref={rowContainerRef}>
        {loadedRows}
      </div>
      <Footer/>
    </div>
  )
}
