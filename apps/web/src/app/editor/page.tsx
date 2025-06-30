"use client";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import "./editor.css";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../../components/ui/resizable";
import { MediaPanel } from "../../components/editor/media-panel";
// import { PropertiesPanel } from "../../components/editor/properties-panel";
import { Timeline } from "../../components/editor/timeline";
import { PreviewPanel } from "../../components/editor/preview-panel";
import { usePanelStore } from "@/stores/panel-store";
import { useProjectStore } from "@/stores/project-store";
import { EditorProvider } from "@/components/editor-provider";
import { usePlaybackControls } from "@/hooks/use-playback-controls";

const EditorHeader = dynamic(
  () => import("@/components/editor-header").then((mod) => mod.EditorHeader),
  { ssr: false }
);

export default function Editor() {
  const {
    toolsPanel,
    previewPanel,
    mainContent,
    timeline,
    setToolsPanel,
    setPreviewPanel,
    setMainContent,
    setTimeline,
  } = usePanelStore();

  const { activeProject, createNewProject } = useProjectStore();

  usePlaybackControls();

  useEffect(() => {
    if (!activeProject) {
      createNewProject("Untitled Project");
    }
  }, [activeProject, createNewProject]);

  return (
    <EditorProvider>
      <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
        <EditorHeader />
        <div className="flex-1 min-h-0 min-w-0">
          <ResizablePanelGroup direction="vertical" className="h-full w-full">
            <ResizablePanel
              defaultSize={mainContent}
              minSize={30}
              maxSize={85}
              onResize={setMainContent}
              className="min-h-0"
            >
              {/* Main content area */}
              <ResizablePanelGroup
                direction="horizontal"
                className="h-full w-full"
              >
                {/* Tools Panel */}
                <ResizablePanel
                  defaultSize={toolsPanel}
                  minSize={15}
                  maxSize={40}
                  onResize={setToolsPanel}
                  className="min-w-0"
                >
                  <MediaPanel />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Preview Area */}
                <ResizablePanel
                  defaultSize={previewPanel}
                  minSize={30}
                  onResize={setPreviewPanel}
                  className="min-w-0 min-h-0 flex-1"
                >
                  <PreviewPanel />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Timeline */}
            <ResizablePanel
              defaultSize={timeline}
              minSize={15}
              maxSize={70}
              onResize={setTimeline}
              className="min-h-0"
            >
              <Timeline />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </EditorProvider>
  );
}
