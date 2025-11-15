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

  projects.forEach((project, index) => {
    currentRow.push(project)

    if (currentRow.length >= videosPerRow) {
      rows.push(<VideoRow videos={currentRow} parentWidth={parentWidth} key={index}/>)
      currentRow = []
    }
  })

  return (
    <div id="work-content">
      <div>
        <TitleBar route="work"/>
        <div id="work-row-container" ref={rowContainerRef}>
          {rows}
        </div>
      </div>
      <Footer/>
    </div>
  )
}
