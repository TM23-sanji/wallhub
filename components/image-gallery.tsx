import React from "react";
import ImageCard from "./image-card";
// import type { Image as ImageType } from "@/app/page";
import { ImageType } from "@/lib/types";
import { favorite } from "@/hooks/use-favorite";

interface ImageGalleryProps {
  images: ImageType[];
  setImages: React.Dispatch<React.SetStateAction<ImageType[]>>;
  fetchFiles: () => void;
}

const ImageGallery = ({ images, setImages, fetchFiles }: ImageGalleryProps) => {
    const isOpen = favorite((state) => state.isOpen);
  
  return (
    <div className="w-full p-6">
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {isOpen ? (
  images.filter((img)=>img.isFavorited===true).map((image) => (
    <div key={image.fileId} className="break-inside-avoid">
      <ImageCard
        {...image}
        setImages={setImages}
        fetchFiles={fetchFiles}
      />
    </div>
  ))
) : images.map((image) => (
          <div key={image.fileId} className="break-inside-avoid">
            <ImageCard
              {...image}
              setImages={setImages}
              fetchFiles={fetchFiles}
            />
          </div>
        ))}

      </div>
    </div>
  );
};

export default ImageGallery;