import type { Route } from "./+types/home";
import TitleBar from "~/components/TitleBar/TitleBar";
import Footer from "~/components/Footer/Footer";
import ProjectDisplay from "~/components/ProjectDisplay/ProjectDisplay";
import { pageDescription } from "~/root";
import { Masonry } from "masonic";

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
    id: 7,
    title: "Frontside Boardslide",
    subtitle: "(documentary short film)",
    src: "https://d3amd0zp63qrni.cloudfront.net/assets/videos/FSBS.mp4"
  },
]

export default function Work() {
  return (
    <div id="work-content">
      <TitleBar route="work" darkMode/>
      <div id="masonry-container">
        <Masonry 
          items={projects}
          render={ProjectDisplay}
          maxColumnCount={2}
          columnWidth={300}
          rowGutter={24}
          columnGutter={24}
        />
      </div>
      <Footer darkMode/>
    </div>
  )
}
