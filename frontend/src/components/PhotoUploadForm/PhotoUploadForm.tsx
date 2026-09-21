import { useState } from "react";
import "./photo-upload-form.css";

import Dropdown from "../Dropdown/Dropdown";
import FileUpload from "../FileUpload/FileUpload";

interface Props {
  collections: string[];
  foldersByCollection: Record<string, string[]>;
}

export default function PhotoUploadForm({ collections, foldersByCollection }: Props) {
  const [collectionIndex, setCollection] = useState<number>();
  const [newCollectionName, setNewCollectionName] = useState<string>();
  const [folderIndex, setFolder] = useState<number>();
  const [newFolderName, setNewFolderName] = useState<string>();

  const onCollectionChange = (e: any) => {
    const selectedIndex: number = e.target.value;

    if (selectedIndex >= 0) {
      setCollection(selectedIndex);
      setFolder(undefined);
      setNewFolderName(undefined);
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
  const collection = showCollectionInput ? newCollectionName : collections[collectionIndex!];

  const folders = (collection && foldersByCollection[collection]) || [];

  const showFolderDropdown = collectionIndex && (!showCollectionInput || (showCollectionInput && newCollectionName));
  const showFolderInput = folderIndex == folders.length;
  const folder = showFolderInput ? newFolderName : folders[folderIndex!];
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

      {showUploadButton && collection && folder && <FileUpload collection={collection} folder={folder} />}
    </div>
  );
}
