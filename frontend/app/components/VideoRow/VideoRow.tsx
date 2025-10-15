import { useRef, useEffect, useState } from "react";
import ProjectDisplay from "~/components/ProjectDisplay/ProjectDisplay";

interface Props {
  videos: any;
  parentWidth: number;
}

export default function VideoRow({ videos, parentWidth }: Props) {
  const rowRef = useRef(null);
  const [height, setHeight] = useState(100);

  console.log(`receiving parent width: ${parentWidth}`)

  useEffect(() => {
    if (parentWidth == 0) {
      return
    }

    const percWidth = rowRef.current.scrollWidth / parentWidth;
    const percToIncrease = 1 / percWidth;
    let newHeight = rowRef.current.scrollHeight * percToIncrease;

    console.log(percToIncrease)

    if (newHeight == 0) {
      newHeight = 100;
    }

    setHeight(newHeight);
  }, [rowRef, parentWidth]);

  return (<div className="video-row" ref={rowRef} style={{ height: `${height}px`}}>
    {videos.map((data) => (<ProjectDisplay data={data} key={data.id}/>))}
  </div>)
}
