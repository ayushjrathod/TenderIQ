"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

interface PDFViewerProps {
  fileUrl: string;
}

const PDFViewer = ({ fileUrl }: PDFViewerProps) => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return (
    <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
      <div style={{ height: "100%" }}>
        {!fileUrl ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">Upload a PDF to view</div>
        ) : (
          <Viewer theme="dark" fileUrl={fileUrl} plugins={[defaultLayoutPluginInstance]} />
        )}
      </div>
    </Worker>
  );
};

export default PDFViewer;
