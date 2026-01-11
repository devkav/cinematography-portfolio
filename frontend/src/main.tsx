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
    src: "https://d3amd0zp63qrni.cloudfront.net/assets/videos/Josh2.mp4",
    link: "https://www.instagram.com/reel/DA3uj79PNei"
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

export interface Photo {
  src: string
}

export interface PhotoProject {
  title: string;
  photos: Photo[]
}

const photos: PhotoProject[] = [
  {
    title: "CGI Composite",
    photos: [
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/cgi-composite/GoodOmen.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/cgi-composite/kitties-22.png",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/cgi-composite/kitties-60.png",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/cgi-composite/under-ice.JPEG",
      },
    ],
  },
  {
    title: "Commercial",
    photos: [
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/grad-pic-138.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/grad-pic-154.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/grad-pic-160.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/grad-pic-203.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/grad-pic-53.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/grad-pic-56.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/grad-pic-60.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/grad-pic-88.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/headshot-129.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/headshot-132.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/headshot-37.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/commercial/headshot-65.jpg",
      },
    ],
  },
  {
    title: "Costa Rica",
    photos: [
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/costa-rica/_DSC0401.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/costa-rica/01.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/costa-rica/reflection1.jpg",
      },
    ],
  },
  {
    title: "Fashion",
    photos: [
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/catalogue-R13/color_1_3.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/catalogue-R13/highkey_1_3.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/catalogue-R13/highkey_full_length.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/catalogue-R13/lights_off_3_4.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/catalogue-R13/lights_off_full_body.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/catalogue-R13/stop1_1_3.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/catalogue-R13/stop1_full_body.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/future-of-fashion/LUCY_Future_Fashion_1-edit.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/future-of-fashion/Lucy_Future_Fashion_CU.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/future-of-fashion/reflection1-11.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/future-of-fashion/reflection1-4.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/future-of-fashion/reflection1-7.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/future-of-fashion/reflection1.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/Lucy_Strobe-as-fill.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/pjs-shoot/Editsbedshoot-142.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/pjs-shoot/Editsbedshoot-239.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/pjs-shoot/Editsbedshoot-401.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/pjs-shoot/Editsbedshoot-411.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/pjs-shoot/Editsbedshoot-58.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/pjs-shoot/Editsbedshoot-89.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/pjs-shoot/Editsbedshoot-95.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/fashion/pjs-shoot/Editsbedshoot-98.jpg",
      },
    ],
  },
  {
    title: "Freestyle",
    photos: [
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0292.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0319.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0397.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0584.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0586-2.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0596.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0681-2.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0693.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0698-2.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/5N5A0753-2.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/maggiesdigicam-27.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/freestyle/maggiesdigicam-66.jpg",
      },
    ],
  },
  {
    title: "The Patrol",
    photos: [
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/_DSC1012.png",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/_DSC1041.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/_DSC1943.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/_DSC1975.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/_DSC1992.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/_DSC2010.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/_DSC2018.jpg",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/_DSC2055.png",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/_DSC2059.png",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/Bike_Edit.png",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/cu-site-side.png",
      },
      {
        src: "https://d3amd0zp63qrni.cloudfront.net/assets/images/photo/patrol/IMG_6923.PNG",
      },
    ]
  },
]


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/reel" element={<Reel/>} />
        <Route path="/film" element={<Work projects={projects}/>} />
        <Route path="/contact" element={<Contact/>} />
        <Route path="/photo" element={<Photo photos={photos}/>} />
      </Routes>
    </BrowserRouter>
  )
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App/>
  </StrictMode>
)
