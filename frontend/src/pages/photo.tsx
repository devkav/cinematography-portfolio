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

  const loadAround = ({initialPhotoIndex, projectIndex, loadInitial}: {initialPhotoIndex: number, projectIndex: number, loadInitial: boolean}) => {
    const projectCache: Map<number, any> = new Map(imageCache.get(projectIndex));
    const project = photos[projectIndex];
    const numPhotos = project.photos.length;
    let changesMade = false;

    for (let i = 0; i <= PRELOAD_DISTANCE; i++) {
      for (let reverse = 0; reverse <= 1; reverse++) {
        if (i == 0 && (loadInitial && reverse == 1 || !loadInitial)) {continue;}

        let addition = i * (reverse ? -1 : 1);
        let currentIndex = (initialPhotoIndex + addition) % numPhotos; 

        if (currentIndex < 0) {
          currentIndex += numPhotos;
        }

        // Check if image has already been loaded
        if (imageCache.get(projectIndex)?.get(currentIndex)) {continue;}

        const imageObj = new Image();
        imageObj.src = photos[projectIndex].photos[currentIndex].src;
        projectCache.set(currentIndex, imageObj)
        changesMade = true;
      }
    }

    return {projectCache, changesMade};
  }

  useEffect(() => {
    const newImageCache: ImageCache = new Map(imageCache);

    photos.forEach((_, currentProjectIndex) => {
      const {projectCache} = loadAround({initialPhotoIndex: 0, projectIndex: currentProjectIndex, loadInitial: true});
      newImageCache.set(currentProjectIndex, projectCache);
    })

    setImageCache(newImageCache);
    setInitialLoad(true);
  }, [photos])

  useEffect(() => {
    if (!initialLoad) {return;}

    const {projectCache, changesMade} = loadAround({initialPhotoIndex: photoIndex, projectIndex, loadInitial: false});

    if (!changesMade) {return;}

    const newImageCache = new Map(imageCache);
    newImageCache.set(projectIndex, projectCache);
    setImageCache(newImageCache)
  }, [photoIndex, projectIndex])

  const getKey = ({photoIndex, projectIndex}: {photoIndex: number, projectIndex: number}) => `proj${projectIndex}-phot${photoIndex}`
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
  const nextPhotoIndex = photoIndex + 1 % photos[projectIndex].photos.length;
  const nextImageObj = imageCache.get(projectIndex)?.get(nextPhotoIndex);
  const sections: any[] = []

  const images = []

  photos.forEach((_, currentProjectIndex) => {
    if (currentProjectIndex == projectIndex) {return;}
    const firstImage = imageCache.get(currentProjectIndex)?.get(0);

    images.push(
      <img className="hidden-preload-image" src={firstImage?.src} loading="eager" key={getKey({projectIndex: currentProjectIndex, photoIndex: 0})}/>
    )
  })

  for (let i = -1; i <= 1; i++) {
    const numPhotos = photos[projectIndex].photos.length;
    let currentPhotoIndex = photoIndex + i % numPhotos;
    if (currentPhotoIndex < 0) {currentPhotoIndex += numPhotos}

    const className = i == 0 ? "" : "hidden-preload-image";
    const imageObj = imageCache.get(projectIndex)?.get(currentPhotoIndex);

    images.push(
      <img className={className} src={imageObj?.src} loading="eager" key={getKey({projectIndex, photoIndex: currentPhotoIndex})}/>
    )
  }

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
            {images}
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
