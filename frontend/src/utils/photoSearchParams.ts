export const FOLDER_SEARCH_PARAM_NAME = "folder";
export const PHOTO_SEARCH_PARAM_NAME = "photo";

export const getProjectSearchParam = (title: string) => title.toLowerCase().trim().split(" ").join("_");

export const getPhotoSearch = (folder: string, photoIndex: number) =>
  `?${new URLSearchParams({
    [FOLDER_SEARCH_PARAM_NAME]: getProjectSearchParam(folder),
    [PHOTO_SEARCH_PARAM_NAME]: String(photoIndex + 1)
  })}`;
