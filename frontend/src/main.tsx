import "./styles/index.css";

import { BrowserRouter, Routes, Route } from "react-router";
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

import Home from "./pages/home"
import Reel from "./pages/reel"
import Work from "./pages/work"
import Contact from "./pages/contact"
import Photo from "./pages/photo";
import londonLaurel from "./assets/images/london_laurel.png";

import XMLHttpRequest from 'xhr2';


export interface Project {
  id: number;
  title: string;
  subtitle: string;
  src: string;
  link?: string;
  laurels?: any[]
}

const projects: Project[] = [
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


function App() {
  const [loadedProjects, setLoadedProjects] = useState<any>([]);

  useEffect(() => {
    projects.forEach((project) => {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", project.src, true);
      xhr.responseType = "blob";

      xhr.addEventListener("load", function() {
        if (xhr.status === 200) {
          var URL = window.URL || window.webkitURL;
          var blob_url = URL.createObjectURL(xhr.response);

          project.src = blob_url
          setLoadedProjects([project, ...loadedProjects]);
        }
      })

      xhr.send()
    })
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/reel" element={<Reel/>} />
        <Route path="/video" element={<Work projects={projects}/>} />
        <Route path="/contact" element={<Contact/>} />
        <Route path="/photo" element={<Photo/>} />
      </Routes>
    </BrowserRouter>
  )
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App/>
  </StrictMode>
)
