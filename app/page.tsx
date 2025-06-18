"use client"; // This component must be a client component

import React, { useState, useEffect } from "react";
import Header from "@/components/header";
import ImageGallery from "@/components/image-gallery";
import UploadModal from "@/components/upload-modal";
import { toast } from "sonner";
import { upload } from "@imagekit/next";
import { Loader } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import Sidebar from "@/components/Sidebar";
import { ImageType } from "@/lib/types";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = React.useState(13);
  const [images, setImages] = useState<ImageType[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      console.log(1);
      const resImage = await fetch("/api/images");
      console.log(2);
      
      if (!resImage.ok) {
        const errData = await resImage.json();
        console.error("Server error:", errData.error);
        toast.error(errData.error || "Unknown error");
        return;
      }

      const imageData: ImageType[] = await resImage.json();
      setImages(imageData);
      console.log(imageData)
    } catch (err) {
      console.error("Failed to load images", err);
      toast.error("Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 5;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowContent(true), 100); // Slight delay to trigger animation
          return 100;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleUpload = async (file: File) => {
    try {
      const res = await fetch("/api/upload-auth");
      const { token, expire, signature, publicKey } = await res.json();
      const isImage = file.type.startsWith("image/");
      if (isImage) {
        const uploadResponse = await upload({
          file,
          fileName: file.name,
          token,
          publicKey,
          signature,
          expire,
          folder: `uploads/image`,
          useUniqueFileName: true,
        });

        const uploadedFile = {
          src: uploadResponse.url || URL.createObjectURL(file),
          alt: isImage ? uploadResponse.name : file.name,
          fileId: uploadResponse.fileId!,
          fileWidth: uploadResponse.width!,
          fileHeight: uploadResponse.height!,
        };

        await fetch("/api/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: uploadedFile.src,
            fileId: uploadedFile.fileId,
            fileWidth: uploadedFile.fileWidth,
            fileHeight: uploadedFile.fileHeight,
            alt: uploadedFile.alt,
          }),
        });

        setImages([
          { ...uploadedFile, alt: file.name } as ImageType,
          ...images,
        ]);
        toast.success("Image uploaded successfully");
      } else {
        toast.error("Image Only");
      }
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Upload failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Progress Screen */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in ${
          showContent ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="w-1/2 max-w-md space-y-4">
          <p className="text-center text-gray-500">Loading app...</p>
          <Progress value={progress} className="h-4" />
        </div>
      </div>

      <div
        className={`transition-opacity duration-700 ease-in ${
          showContent ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <Header onUploadClick={handleUploadClick} />

        <main className="flex-1 flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center text-gray-500 h-64">
              <Loader className="animate-spin w-6 h-6 mb-2" />
              <p>Loading...</p>
            </div>
          ) : images.length > 0 ? (
            <div className="flex ">
              <ScrollArea className="h-[calc(100vh-80px)]">
                <Sidebar />
              </ScrollArea>

              <ScrollArea className="h-[calc(100vh-80px)] w-full pr-1 pb-6 ">
                <ImageGallery
                  images={images}
                  setImages={setImages}
                  fetchFiles={fetchFiles}
                />
              </ScrollArea>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500 h-64">
              <p className="font-semibold">Nothing to show here yet.</p>
              <button
                onClick={handleUploadClick}
                className="mt-2 text-blue-500 hover:underline"
              >
                Upload your first image
              </button>
            </div>
          )}
        </main>
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleUpload}
        />
      </div>
    </div>
  );
};

export default Index;