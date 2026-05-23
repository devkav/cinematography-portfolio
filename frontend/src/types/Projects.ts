export interface Project {
  id: number;
  title: string;
  subtitle: string;
  src: string;
  link?: string;
  laurels?: boolean;
}

export interface Photo {
  src: string;
}

export interface PhotoProject {
  title: string;
  collection: string;
  photos: Photo[];
}
