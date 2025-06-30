"use client";

import { Button } from "../ui/button";
import { AspectRatio } from "../ui/aspect-ratio";
import { DragOverlay } from "../ui/drag-overlay";
import { useMediaStore } from "@/stores/media-store";
import { processMediaFiles } from "@/lib/media-processing";
import { Plus, Image, Video, Music, Trash2, Upload } from "lucide-react";
import { useDragDrop } from "@/hooks/use-drag-drop";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { VoiceoverRecorder } from "./voiceover-recorder";
import { AiVoiceGenerator } from "./ai-voice-generator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

// MediaPanel lets users add, view, and drag media (images, videos, audio) into the project.
// You can upload files or drag them from your computer. Dragging from here to the timeline adds them to your video project.

export function MediaPanel() {
  const { mediaItems, addMediaItem, removeMediaItem } = useMediaStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = async (files: FileList | File[]) => {
    // If no files, do nothing
    if (!files?.length) return;

    setIsProcessing(true);
    try {
      // Process files (extract metadata, generate thumbnails, etc.)
      const items = await processMediaFiles(files);
      // Add each processed media item to the store
      items.forEach((item) => {
        addMediaItem(item);
      });
    } catch (error) {
      // Show error if processing fails
      console.error("File processing failed:", error);
      toast.error("Failed to process files");
    } finally {
      setIsProcessing(false);
    }
  };

  const { isDragOver, dragProps } = useDragDrop({
    // When files are dropped, process them
    onDrop: processFiles,
  });

  const handleFileSelect = () => fileInputRef.current?.click(); // Open file picker

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // When files are selected via file picker, process them
    if (e.target.files) processFiles(e.target.files);
    e.target.value = ""; // Reset input
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    // Remove a media item from the store
    e.stopPropagation();
    removeMediaItem(id);
  };

  const formatDuration = (duration: number) => {
    // Format seconds as mm:ss
    const min = Math.floor(duration / 60);
    const sec = Math.floor(duration % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const startDrag = (e: React.DragEvent, item: any) => {
    // When dragging a media item, set drag data for timeline to read
    e.dataTransfer.setData(
      "application/x-media-item",
      JSON.stringify({
        id: item.id,
        type: item.type,
        name: item.name,
      })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  const filteredMediaItems = mediaItems;

  const renderPreview = (item: any) => {
    // Render a preview for each media type (image, video, audio, unknown)
    // Each preview is draggable to the timeline
    const baseDragProps = {
      draggable: true,
      onDragStart: (e: React.DragEvent) => startDrag(e, item),
    };

    if (item.type === "image") {
      return (
        <img
          src={item.url}
          alt={item.name}
          className="w-full h-full object-cover rounded cursor-grab active:cursor-grabbing"
          loading="lazy"
          {...baseDragProps}
        />
      );
    }

    if (item.type === "video") {
      if (item.thumbnailUrl) {
        return (
          <div
            className="relative w-full h-full cursor-grab active:cursor-grabbing"
            {...baseDragProps}
          >
            <img
              src={item.thumbnailUrl}
              alt={item.name}
              className="w-full h-full object-cover rounded"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
              <Video className="h-6 w-6 text-white drop-shadow-md" />
            </div>
            {item.duration && (
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                {formatDuration(item.duration)}
              </div>
            )}
          </div>
        );
      }
      return (
        <div
          className="w-full h-full bg-muted/30 flex flex-col items-center justify-center text-muted-foreground rounded cursor-grab active:cursor-grabbing"
          {...baseDragProps}
        >
          <Video className="h-6 w-6 mb-1" />
          <span className="text-xs">Video</span>
          {item.duration && (
            <span className="text-xs opacity-70">
              {formatDuration(item.duration)}
            </span>
          )}
        </div>
      );
    }

    if (item.type === "audio") {
      return (
        <div
          className="w-full h-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex flex-col items-center justify-center text-muted-foreground rounded border border-green-500/20 cursor-grab active:cursor-grabbing"
          {...baseDragProps}
        >
          <Music className="h-6 w-6 mb-1" />
          <span className="text-xs">Audio</span>
          {item.duration && (
            <span className="text-xs opacity-70">
              {formatDuration(item.duration)}
            </span>
          )}
          <audio src={item.url} className="w-full mt-2" controls />
        </div>
      );
    }

    return (
      <div
        className="w-full h-full bg-muted/30 flex flex-col items-center justify-center text-muted-foreground rounded cursor-grab active:cursor-grabbing"
        {...baseDragProps}
      >
        <Image className="h-6 w-6" />
        <span className="text-xs mt-1">Unknown</span>
      </div>
    );
  };

  return (
    <>
      {/* Hidden file input for uploading media */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        className={`h-full flex flex-col transition-colors relative ${
          isDragOver ? "bg-accent/30" : ""
        }`}
        {...dragProps}
      >
        {/* Show overlay when dragging files over the panel */}
        <DragOverlay isVisible={isDragOver} />

        <div className="p-2 border-b">
          {/* Button to add/upload media */}
          <div className="space-y-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handleFileSelect}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Upload className="h-4 w-4 animate-spin mr-2" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  <span>Upload Video</span>
                </>
              )}
            </Button>
            <Tabs defaultValue="record" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="record">Record</TabsTrigger>
                <TabsTrigger value="generate">Generate</TabsTrigger>
              </TabsList>
              <TabsContent value="record">
                <VoiceoverRecorder />
              </TabsContent>
              <TabsContent value="generate">
                <AiVoiceGenerator />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {/* Show message if no media, otherwise show media grid */}
          {filteredMediaItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center h-full">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <Image className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No media in project
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Drag files here or use the button above
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {/* Render each media item as a draggable button */}
              {filteredMediaItems.map((item) => (
                <div key={item.id} className="relative group">
                  <Button
                    variant="outline"
                    className="flex flex-col gap-2 p-2 h-auto w-full relative"
                  >
                    <AspectRatio ratio={item.aspectRatio}>
                      {renderPreview(item)}
                    </AspectRatio>
                    <span
                      className="text-xs truncate px-1 max-w-full"
                      aria-label={item.name}
                      title={item.name}
                    >
                      {item.name.length > 8
                        ? `${item.name.slice(0, 4)}...${item.name.slice(-3)}`
                        : item.name}
                    </span>
                  </Button>

                  {/* Show remove button on hover */}
                  <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => handleRemove(e, item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
