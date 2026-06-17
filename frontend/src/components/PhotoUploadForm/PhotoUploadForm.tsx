import { useState } from "react";
import "./photo-upload-form.css";

import Dropdown from "../Dropdown/Dropdown";
import FileUpload from "../FileUpload/FileUpload";

interface Props {
  collections: string[];
  folders: string[];
}

export default function PhotoUploadForm({ collections, folders }: Props) {
  const [collectionIndex, setCollection] = useState<number>();
  const [newCollectionName, setNewCollectionName] = useState<string>();
  const [folderIndex, setFolder] = useState<number>();
  const [newFolderName, setNewFolderName] = useState<string>();

  const onCollectionChange = (e: any) => {
    const selectedIndex: number = e.target.value;

    if (selectedIndex >= 0) {
      setCollection(selectedIndex);
    }
  };

  const onCollectionNameChange = (e: any) => {
    setNewCollectionName(e.target.value);
  };

  const onFolderChange = (e: any) => {
    const selectedIndex: number = e.target.value;

    if (selectedIndex >= 0) {
      setFolder(selectedIndex);
    }
  };

  const onFolderNameChange = (e: any) => {
    setNewFolderName(e.target.value);
  };

  const showCollectionInput = collectionIndex == collections.length;
  const showFolderDropdown = collectionIndex && (!showCollectionInput || (showCollectionInput && newCollectionName));
  const showFolderInput = folderIndex == folders.length;
  const showUploadButton = folderIndex && (!showFolderInput || (showFolderInput && newFolderName));

  return (
    <div id="photo-upload-form">
      <p>Collection</p>
      <Dropdown
        placeholder="Select collection..."
        options={[...collections, "Create new..."]}
        onChange={onCollectionChange}
      />
      {showCollectionInput && (
        <>
          <p>Collection name</p>
          <input type="text" onChange={onCollectionNameChange} />
        </>
      )}

      {showFolderDropdown && (
        <>
          <p>Folder</p>
          <Dropdown placeholder="Select folder..." options={[...folders, "Create new..."]} onChange={onFolderChange} />
          {showFolderInput && (
            <>
              <p>Folder name</p>
              <input type="text" onChange={onFolderNameChange} />
            </>
          )}
        </>
      )}

      {showUploadButton && <FileUpload />}
    </div>
  );
}
