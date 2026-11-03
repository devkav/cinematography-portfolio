import { useRef, useEffect, useState } from "react";
import FilmDisplay from "../FilmDisplay/FilmDisplay";

import "./film-row.css";
import useOnScreen from "../../hooks/useOnScreen";
import type { FilmProject } from "src/types/Projects";

interface Props {
  videos: FilmProject[];
  parentWidth: number;
  allLoadedCallback: () => void;
}

export interface VideoDimensions {
  width: number;
  height: number;
}

interface VideoDimensionsState {
  [id: number]: VideoDimensions;
}

export default function FilmRow({ videos, parentWidth, allLoadedCallback }: Props) {
  const [height, setHeight] = useState(100);
  const [loadedVideoIds, setLoadedVideoIds] = useState<Set<number>>(new Set());
  const [videoDimensions, setVideoDimensions] = useState<VideoDimensionsState>({});
  const rowRef = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(rowRef);

  useEffect(() => {
    const allLoaded = videos.every(({ id }) => loadedVideoIds.has(id));

    if (allLoaded) {
      let maxHeight = Object.values(videoDimensions).reduce((acc, { height }) => (height > acc ? height : acc), 0);

      let totalWidth = Object.values(videoDimensions).reduce((acc, { width, height }) => {
        const aspectRatio = width / height;
        const commonWidth = aspectRatio * maxHeight;

        return acc + commonWidth;
      }, 0);

      const videoPadding = parentWidth <= 450 ? 4 : 8; // Must agree with the padding in film-display.css
      const totalPadding = videos.length * 2 * videoPadding;
      const targetWidth = parentWidth - totalPadding;
      const scale = targetWidth / totalWidth;
      const targetHeight = maxHeight * scale;
      setHeight(targetHeight);

      allLoadedCallback();
    }
  }, [loadedVideoIds, parentWidth]);

  const onLoadCallback = (id: number, dimensions: VideoDimensions) => {
    setLoadedVideoIds((prevLoadedVideoIds) => new Set([...prevLoadedVideoIds, id]));
    setVideoDimensions((prevVideoDimensions) => ({ ...prevVideoDimensions, [id]: dimensions }));
  };

  const getClassNames = () => {
    const classNames = ["film-row"];
    const allLoaded = videos.every(({ id }) => loadedVideoIds.has(id));

    if (!allLoaded) {
      classNames.push("unloaded");
    }

    return classNames.join(" ");
  };

  return (
    <div className={getClassNames()} ref={rowRef} style={{ height: `${height}px` }}>
      {videos.map((data) => (
        <FilmDisplay
          data={data}
          onLoadCallback={(dimensions: VideoDimensions) => {
            onLoadCallback(data.id, dimensions);
          }}
          playing={isVisible}
          key={data.id}
        />
      ))}
    </div>
  );
}
