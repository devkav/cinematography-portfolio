import type { Route } from "./+types/home";
import TitleBar from "~/components/TitleBar/TitleBar";
import Footer from "~/components/Footer/Footer";
import VideoRow from "~/components/VideoRow/VideoRow";
import { pageDescription } from "~/root";
import londonLaurel from "~/assets/images/london_laurel.png";
import { useRef, useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Maggie Lucy" },
    { name: "description", content: pageDescription },
  ];
}

let projects = [
  {
    id: 4,
    title: "A STUDY ON THE MONSTROUS FEMININE",
    subtitle: "(experimental short film)",
    src: "https://d3amd0zp63qrni.cloudfront.net/assets/videos/MonFem.mp4"
  },
  {
    id: 5,
    title: "Rumble",
    subtitle: "(narrative short film)",
    src: "https://d3amd0zp63qrni.cloudfront.net/assets/videos/Rumble5.mp4"
  },
  {
    id: 2,
    title: "Candle Stick",
    subtitle: "(comedy short film)",
    src: "https://d3amd0zp63qrni.cloudfront.net/assets/videos/CANDLESTICK.mp4",
  },
  {
    id: 3,
    title: "Josh",
    subtitle: "(mock ad)",
    src: "https://d3amd0zp63qrni.cloudfront.net/assets/videos/Josh2.mp4"
  },
  {
    id: 6,
    title: "The Savant",
    subtitle: "(music video)",
    src: "https://d3amd0zp63qrni.cloudfront.net/assets/videos/Savant.mp4",
    link: "https://youtu.be/HtqLydTvjqk"
  },
  {
    id: 1,
    title: "Aloe Vera",
    subtitle: "(music video)",
    src: "https://d3amd0zp63qrni.cloudfront.net/assets/videos/ALOE+VERA.mp4",
    link: "https://www.youtube.com/watch?v=CBHR49D7qzM"
  },
  {
    id: 8,
    title: "Sketchy Characters",
    subtitle: "(comedy short film)",
    src: "https://d3amd0zp63qrni.cloudfront.net/assets/videos/Sketchy.mp4",
    laurels: [londonLaurel]
  },
  {
    id: 9,
    title: "WHOOP",
    subtitle: "(mock ad)",
    src: "https://d3amd0zp63qrni.cloudfront.net/assets/videos/WHOOP.mp4",
  },
  {
    id: 10,
    title: "White Snake",
    subtitle: "(experimental short film)",
    src: "https://d3amd0zp63qrni.cloudfront.net/assets/videos/WhiteSnake.mp4",
  },
  {
    id: 11,
    title: "Adrenaline Rush",
    subtitle: "(virtual production short film)",
    src: "https://d3amd0zp63qrni.cloudfront.net/assets/videos/AdrenalineRush.mp4",
  },
  {
    id: 12,
    title: "Echos of Eden",
    subtitle: "(creative & technical analysis)",
    src: "https://d3amd0zp63qrni.cloudfront.net/assets/videos/EchosOfEden.mp4",
    link: "https://youtu.be/uz1GZ5O2K6g"
  },
  {
    id: 7,
    title: "Frontside Boardslide",
    subtitle: "(documentary short film)",
    src: "https://d3amd0zp63qrni.cloudfront.net/assets/videos/FSBS.mp4"
  },
]



export default function Work() {
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

    window.addEventListener("resize", updateParentWidth)
    return () => window.removeEventListener("resize", updateParentWidth);
  }, [rowContainerRef]);

  console.log(parentWidth)

  projects.forEach((project, index) => {
    currentRow.push(project)

    if (currentRow.length >= 3) {
      rows.push(<VideoRow videos={currentRow} parentWidth={parentWidth} key={index}/>)
      currentRow = []
    }
  })

  return (
    <div id="work-content">
      <TitleBar route="work" darkMode/>
      <div id="row-container" ref={rowContainerRef}>
        {rows}
      </div>
      <Footer darkMode/>
    </div>
  )
}
