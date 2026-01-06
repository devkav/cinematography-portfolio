import type { PhotoProject } from "src/main"
import Footer from "../components/Footer/Footer"
import TitleBar from "../components/TitleBar/TitleBar"

import "../styles/photo.css"
import { useState } from "react"

export default function Photo({ photos } : { photos: PhotoProject[] }) {
  const [projectIndex, setProjectIndex] = useState<number>(0);
  const [photoIndex, setPhotoIndex] = useState<number>(0);


  const getKey = () => `proj${projectIndex}-phot${photoIndex}`
  const nextImage = () => changeImage(1);
  const prevImage = () => changeImage(-1);

  const changeImage = (change: number) => {
    const numPhotos = photos[projectIndex].photos.length;
    const newIndex = photoIndex + change;

    if (newIndex < 0) {
      setPhotoIndex(numPhotos + change);
    } else {
      setPhotoIndex(newIndex % numPhotos);
    }
  }

  const currentImage: string = photos[projectIndex].photos[photoIndex].src
  const sections: any[] = []

  photos.forEach(({title}, index) => {
    sections.push(<p onClick={() => {
      setProjectIndex(index);
      setPhotoIndex(0);
    }} key={`proj-${index}`}>{title}</p>)
  })

  return (
    <div>
      <TitleBar route="photo"/>
      {sections}
      <button onClick={prevImage}>Prev</button>
      <button onClick={nextImage}>Next</button>
      <br/>
      <img src={currentImage} loading="eager" key={getKey()}/>
      <Footer/>
    </div>
  )
}
