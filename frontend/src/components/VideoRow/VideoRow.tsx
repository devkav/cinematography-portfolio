import { useRef, useEffect, useState } from "react";
import ProjectDisplay from "../ProjectDisplay/ProjectDisplay";

import "./video-row.css";

interface Props {
  videos: any;
  parentWidth: number;
}

export default function VideoRow({ videos, parentWidth }: Props) {
  const rowRef = useRef(null);
  const [height, setHeight] = useState(100);

  const updateHeight = () => {
    if (parentWidth == 0 || rowRef.current == null) {
      return
    }

    const videoPadding = window.innerWidth <= 450 ? 4 : 8; // Must agree with the padding in project-display.css
    const targetWidth = parentWidth - (videos.length * videoPadding)
    const percWidth = rowRef.current.scrollWidth / targetWidth;
    const percToIncrease = 1 / percWidth;
    let newHeight = rowRef.current.scrollHeight * percToIncrease;

    if (newHeight == 0) {
      newHeight = 100;
    }

    setHeight(newHeight);
  }

  useEffect(() => {
    updateHeight()
  }, [rowRef, parentWidth]);

  const onLoadCallback = () => {
    updateHeight()
    // For good measure...
    updateHeight()
  }

  return (<div className="video-row" ref={rowRef} style={{ height: `${height}px`}}>
    {videos.map((data) => (<ProjectDisplay data={data} onLoadCallback={onLoadCallback} key={data.id}/>))}
  </div>)
}
