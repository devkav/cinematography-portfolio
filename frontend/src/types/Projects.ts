export interface Project {
  id: number;
  title: string;
  subtitle: string;
  src: string;
  link?: string;
  laurels?: boolean;
  laurelImages?: string[];
}

export interface Photo {
  src: string;
}

export interface PhotoProject {
  title: string;
  collection: string;
  photos: Photo[];
}

export interface PhotoLayoutCell {
  src: string;
  folder: string;
  index: number;
  flex: number;
}

export interface PhotoLayoutRow {
  width: number;
  gap: number;
  space: number;
  cells: PhotoLayoutCell[];
}
