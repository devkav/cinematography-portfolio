import type { PhotoProject } from "src/main"
import Footer from "../components/Footer/Footer"
import TitleBar from "../components/TitleBar/TitleBar"

import "../styles/photo.css"
import { useState } from "react"
import { MdNavigateNext, MdNavigateBefore } from "react-icons/md";

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
    const classNames = ["photo-section"]

    if (index == projectIndex) {
      classNames.push("photo-section-active");
    }

    sections.push(<p className={classNames.join(" ")} onClick={() => {
      setProjectIndex(index);
      setPhotoIndex(0);
    }} key={`proj-${index}`}>{title}</p>)
  })

  return (
    <div id="photo-page">
      <div id="photo-content-container">
        <div id="photo-content">
          <div id="sidebar-container">
            <TitleBar route="photo" compact/>
            <div id="photo-sidebar">
              {sections}
            </div>
          </div>
          <div id="display-container">
            <div className="photo-button" id="prev" onClick={prevImage}>
              <MdNavigateBefore/>
            </div>
            <img src={currentImage} loading="eager" key={getKey()}/>
            <div className="photo-button" id="next" onClick={nextImage}>
              <MdNavigateNext/>
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  )
}
