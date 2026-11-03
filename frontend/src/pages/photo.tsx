import type { PhotoLayoutRow, PhotoProject } from "src/types/Projects";
import Footer from "../components/Footer/Footer";
import TitleBar from "../components/TitleBar/TitleBar";
import Seo from "../components/Seo/Seo";
import PhotoGallery from "./photo-gallery";

import "../styles/photo.css";
import { useEffect, useState } from "react";
import { MdNavigateNext, MdNavigateBefore } from "react-icons/md";
import { Link, useSearchParams } from "react-router";
import {
  FOLDER_SEARCH_PARAM_NAME,
  PHOTO_SEARCH_PARAM_NAME,
  getPhotoSearch,
  getProjectSearchParam
} from "../utils/photoSearchParams";

const PRELOAD_DISTANCE = 2;
const LOCAL_PRELOAD_DISTANCE = 1;

type ImageCache = Map<number, Map<number, any>>;

export default function Photo({ photos, layout }: { photos: PhotoProject[]; layout: PhotoLayoutRow[] }) {
  const [searchParams] = useSearchParams();

  if (searchParams.size == 0) {
    return <PhotoGallery rows={layout} />;
  }

  return <PhotoViewer photos={photos} />;
}

function PhotoViewer({ photos }: { photos: PhotoProject[] }) {
  const [projectIndex, setProjectIndex] = useState<number>(0);
  const [photoIndex, setPhotoIndex] = useState<number>(0);
  const [imageCache, setImageCache] = useState<ImageCache>(new Map());
  const [initialLoad, setInitialLoad] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const loadAround = ({ initialPhotoIndex, projectIndex }: { initialPhotoIndex: number; projectIndex: number }) => {
    const projectCache: Map<number, any> = new Map(imageCache.get(projectIndex));
    const project = photos[projectIndex];
    const numPhotos = project.photos.length;
    let changesMade = false;

    for (let i = 0; i <= PRELOAD_DISTANCE; i++) {
      for (let reverse = 0; reverse <= 1; reverse++) {
        if (i == 0 && reverse == 1) {
          continue;
        }

        let addition = i * (reverse ? -1 : 1);
        let currentIndex = (initialPhotoIndex + addition) % numPhotos;

        if (currentIndex < 0) {
          currentIndex += numPhotos;
        }

        // Check if image has already been loaded
        if (imageCache.get(projectIndex)?.get(currentIndex)) {
          continue;
        }

        const imageObj = new Image();
        imageObj.src = photos[projectIndex].photos[currentIndex].src;
        projectCache.set(currentIndex, imageObj);
        changesMade = true;
      }
    }

    return { projectCache, changesMade };
  };

  const updateSearchParams = (projectIndex: number, photoIndex: number, replace: boolean) =>
    setSearchParams(getPhotoSearch(photos[projectIndex].title, photoIndex), { replace });

  useEffect(() => {
    if (photos.length == 0) {
      return;
    }

    const folder = searchParams.get(FOLDER_SEARCH_PARAM_NAME);
    const folderIndex = photos.findIndex(({ title }) => getProjectSearchParam(title) == folder);
    const newProjectIndex = folderIndex == -1 ? projectIndex : folderIndex;
    const photoNumber = Number(searchParams.get(PHOTO_SEARCH_PARAM_NAME));
    const numPhotos = photos[newProjectIndex].photos.length;
    const newPhotoIndex =
      Number.isInteger(photoNumber) && photoNumber >= 1 && photoNumber <= numPhotos ? photoNumber - 1 : 0;

    setProjectIndex(newProjectIndex);
    setPhotoIndex(newPhotoIndex);
    updateSearchParams(newProjectIndex, newPhotoIndex, true);
  }, [photos]);

  useEffect(() => {
    const newImageCache: ImageCache = new Map(imageCache);

    photos.forEach((_, currentProjectIndex) => {
      const { projectCache } = loadAround({
        initialPhotoIndex: 0,
        projectIndex: currentProjectIndex
      });
      newImageCache.set(currentProjectIndex, projectCache);
    });

    setImageCache(newImageCache);
    setInitialLoad(true);
  }, [photos]);

  useEffect(() => {
    if (!initialLoad) {
      return;
    }

    const { projectCache, changesMade } = loadAround({
      initialPhotoIndex: photoIndex,
      projectIndex
    });

    if (!changesMade) {
      return;
    }

    const newImageCache = new Map(imageCache);
    newImageCache.set(projectIndex, projectCache);
    setImageCache(newImageCache);
  }, [photoIndex, projectIndex]);

  const getKey = ({ photoIndex, projectIndex }: { photoIndex: number; projectIndex: number }) =>
    `proj${projectIndex}-photo${photoIndex}`;
  const nextImage = () => changeImage(1);
  const prevImage = () => changeImage(-1);

  const changeImage = (change: number) => {
    const numPhotos = photos[projectIndex].photos.length;
    const newIndex = photoIndex + change;

    if (newIndex < 0) {
      changeCollection(projectIndex - 1, false);
    } else if (newIndex >= numPhotos) {
      changeCollection(projectIndex + 1, true);
    } else {
      setPhotoIndex(newIndex);
      updateSearchParams(projectIndex, newIndex, true);
    }
  };

  const changeCollection = (collection: number, start: boolean) => {
    const numProjects = photos.length;

    if (collection < 0) {
      collection = numProjects - 1;
    } else if (collection >= numProjects) {
      collection = 0;
    }

    const newPhotoIndex = start ? 0 : photos[collection].photos.length - 1;

    setProjectIndex(collection);
    setPhotoIndex(newPhotoIndex);
    updateSearchParams(collection, newPhotoIndex, false);
  };

  const sections: Map<string, number[]> = photos.reduce((acc, { collection }, index) => {
    if (!acc.has(collection)) {
      acc.set(collection, []);
    }

    acc.get(collection)?.push(index);
    return acc;
  }, new Map<string, number[]>());

  const collections: any[] = [];
  const images = [];

  // Preload images
  photos.forEach((_, currentProjectIndex) => {
    if (currentProjectIndex == projectIndex) {
      return;
    }
    const firstImage = imageCache.get(currentProjectIndex)?.get(0);

    images.push(
      <img
        className="hidden-preload-image"
        src={firstImage?.src}
        alt={`${photos[currentProjectIndex].title} photography by Maggie Lucy`}
        loading="eager"
        key={getKey({ projectIndex: currentProjectIndex, photoIndex: 0 })}
      />
    );
  });

  // Preload image and surrounding images
  for (let i = 0; i <= LOCAL_PRELOAD_DISTANCE; i++) {
    if (photos.length == 0) {
      break;
    }

    for (let reverse = 0; reverse <= 1; reverse++) {
      if (i == 0 && reverse == 1) {
        continue;
      }

      const numPhotos = photos[projectIndex].photos.length;
      let currentPhotoIndex = reverse ? numPhotos - i : photoIndex + i;

      if (reverse == 1 && currentPhotoIndex <= photoIndex + i) {
        continue;
      }

      const className = i == 0 ? "" : "hidden-preload-image";
      const imageObj = imageCache.get(projectIndex)?.get(currentPhotoIndex);

      images.push(
        <img
          className={className}
          src={imageObj?.src}
          alt={`${photos[projectIndex].title} photography by Maggie Lucy`}
          loading="eager"
          key={getKey({ projectIndex, photoIndex: currentPhotoIndex })}
        />
      );
    }
  }

  // Render sidebar
  Array.from(sections.keys()).forEach((section: string, index) => {
    const indices = sections.get(section);

    collections.push(
      <p className="photo-collection-title" key={`collection-${index}`}>
        {section}
      </p>
    );

    indices?.forEach((index) => {
      const title = photos[index]?.title;
      const classNames = ["photo-collection"];

      if (index == projectIndex) {
        classNames.push("photo-collection-active");
      }

      collections.push(
        <p
          className={classNames.join(" ")}
          onClick={() => {
            changeCollection(index, true);
          }}
          key={`proj-${index}`}
        >
          {title}
        </p>
      );
    });
  });

  return (
    <div id="photo-page">
      <Seo
        title="Photography"
        description="Photography portfolio of Maggie Lucy, an Atlanta-based cinematographer and photographer."
        path="/photo"
      />
      <TitleBar route="photo" darkMode={false} />
      <div id="photo-content-container">
        <div id="photo-content">
          <div id="sidebar-container">
            <Link id="photo-back" to="/photo">
              <MdNavigateBefore />
              Gallery
            </Link>
            <div id="photo-sidebar">{collections}</div>
          </div>
          <div id="display-container">
            <div className="photo-button" onClick={prevImage}>
              <div className="photo-button-col" id="prev-col">
                <MdNavigateBefore />
              </div>
            </div>
            {images}
            <div className="photo-button" onClick={nextImage}>
              <div className="photo-button-col" id="next-col">
                <MdNavigateNext />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer darkMode={false} />
    </div>
  );
}
