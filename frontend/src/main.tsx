import "./styles/index.css";

import { BrowserRouter, Routes, Route } from "react-router";
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

import Home from "./pages/home"
import Reel from "./pages/reel"
import Work from "./pages/work"
import Contact from "./pages/contact"
import Photo from "./pages/photo";

export interface Project {
  id: number;
  title: string;
  subtitle: string;
  src: string;
  link?: string;
  laurels?: any[]
}

export interface Photo {
  src: string
}

export interface PhotoProject {
  title: string;
  collection: string;
  photos: Photo[]
}

const API_URL = "https://zydhwibd16.execute-api.us-east-1.amazonaws.com/prod"

function App() {
  const [photos, setPhotos] = useState<PhotoProject[]>([])
  const [filmProjects, setFilmProjects] = useState<Project[]>([])
  
  useEffect(() => {
    fetch(`${API_URL}/assets?page=photo`).then((data) => 
      data.json().then((data) =>
        setPhotos(data)
      )
    )
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/assets?page=film`).then((data) => 
      data.json().then((data) =>
        setFilmProjects(data)
      )
    )
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/reel" element={<Reel/>} />
        <Route path="/film" element={<Work projects={filmProjects}/>} />
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
