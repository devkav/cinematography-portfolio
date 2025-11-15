import type { PhotoProject } from "src/main"
import Footer from "../components/Footer/Footer"
import TitleBar from "../components/TitleBar/TitleBar"

import "../styles/photo.css"

export default function Photo({ photos } : { photos: PhotoProject[] }) {
  const elements: any[] = [];

  photos.forEach((project) => {
    elements.push(<p>{project.title}</p>);
    project.photos.forEach(({src}) => {
      elements.push(<img src={src}/>)
    })
  })


  return (
    <div>
      <TitleBar route="photo"/>
      {elements}
      <Footer/>
    </div>
  )
}
