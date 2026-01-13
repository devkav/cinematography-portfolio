import { useRef, useEffect, useState } from "react";
import ProjectDisplay from "../ProjectDisplay/ProjectDisplay";

import "./video-row.css";
import useOnScreen from "../../hooks/useOnScreen";
import type { Project } from "src/main";

interface Props {
  videos: Project[];
  parentWidth: number;
  allLoadedCallback: () => void;
}

export default function VideoRow({ videos, parentWidth, allLoadedCallback }: Props) {
  const [height, setHeight] = useState(100);
  const [loadedVideoIds, setLoadedVideoIds] = useState<Set<number>>(new Set());
  const rowRef = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(rowRef);

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

  useEffect(() => {
    const allLoaded = videos.every(({id}) => loadedVideoIds.has(id))

    if (allLoaded) {
      allLoadedCallback()
    }
  }, [loadedVideoIds])

  const onLoadCallback = (id: number) => {
    setLoadedVideoIds((prevLoadedVideoIds) => new Set([...prevLoadedVideoIds, id]))
    updateHeight()
    // For good measure...
    updateHeight()
  }

  return (<div className="video-row" ref={rowRef} style={{ height: `${height}px`}}>
    {videos.map((data) => (
      <ProjectDisplay
        data={data}
        onLoadCallback={() => {onLoadCallback(data.id)}}
        playing={isVisible}
        key={data.id}
      />
    ))}
  </div>)
}
