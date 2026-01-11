import type { PhotoProject } from "src/main"
import Footer from "../components/Footer/Footer"
import TitleBar from "../components/TitleBar/TitleBar"

import "../styles/photo.css"
import { useEffect, useState } from "react"
import { MdNavigateNext, MdNavigateBefore } from "react-icons/md";

const PRELOAD_DISTANCE = 2;

type ImageCache = Map<number, Map<number, any>>;

export default function Photo({ photos } : { photos: PhotoProject[] }) {
  const [projectIndex, setProjectIndex] = useState<number>(0);
  const [photoIndex, setPhotoIndex] = useState<number>(0);
  const [imageCache, setImageCache] = useState<ImageCache>(new Map());
  const [initialLoad, setInitialLoad] = useState(false);

  useEffect(() => {
    const newImageCache: ImageCache = new Map();

    photos.forEach(({photos}, currentProjectIndex) => {
      if (!newImageCache.has(currentProjectIndex)) {
        newImageCache.set(currentProjectIndex, new Map());
      }

      for (let i = 0; i <= PRELOAD_DISTANCE; i++) {
        for (let reverse = 0; reverse <= 1; reverse++) {
          if (i == 0 && reverse) {continue;}

          const currentIndex = reverse == 0 ? i : photos.length - i;

          if (currentIndex >= photos.length || currentIndex < 0) {
            continue;
          }

          const imageObj = new Image();
          imageObj.src = photos[currentIndex]?.src;
          newImageCache.get(currentProjectIndex)?.set(currentIndex, imageObj);
        }
      }

      setImageCache(newImageCache);
      setInitialLoad(true);
    })
  }, [photos])

  useEffect(() => {
    if (!initialLoad) {return;}
    const newImageCache: ImageCache = new Map(imageCache);
    const project = photos[projectIndex];
    const numPhotos = project.photos.length;
    let changesMade = false;

    for (let i = 1; i <= PRELOAD_DISTANCE; i++) {
      for (let reverse = 0; reverse <= 1; reverse++) {
        let addition = i * (reverse ? -1 : 1);
        let currentIndex = (photoIndex + addition) % numPhotos; 

        if (currentIndex < 0) {
          currentIndex += numPhotos;
        }

        // Check if image has already been loaded
        if (imageCache.get(projectIndex)?.get(currentIndex)) {continue;}

        changesMade = true;

        const imageObj = new Image();
        imageObj.src = photos[projectIndex].photos[currentIndex].src;
        newImageCache.get(projectIndex)?.set(currentIndex, imageObj)
      }
    }

    if (changesMade) {
      setImageCache(newImageCache);
    }
  }, [photoIndex, projectIndex])

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

  const currentImage = imageCache.get(projectIndex)?.get(photoIndex);
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
            <div className="photo-button" onClick={prevImage}>
              <div className="photo-button-col" id="prev-col">
                <MdNavigateBefore/>
              </div>
            </div>
            <img src={currentImage?.src} loading="eager" key={getKey()}/>
            <div className="photo-button" onClick={nextImage}>
              <div className="photo-button-col" id="next-col">
                <MdNavigateNext/>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  )
}
