"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Sparkles, Upload } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

const PDFViewer = dynamic(() => import("@/components/PDFViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

interface SummaryResponse {
  success: boolean;
  final_summary: string;
  error: string | null;
}

export default function SummaryPage() {
  const [finalSummary, setFinalSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file");
        return;
      }
      setSelectedFile(file);
      setPdfUrl(URL.createObjectURL(file));
      setFinalSummary("");
    }
  };

  const generateSummary = async () => {
    if (!selectedFile) {
      setError("Please upload a PDF file before analyzing");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("http://localhost:8000/summarize", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data: SummaryResponse = await response.json();

      if (!data.success || data.error) {
        throw new Error(data.error || "Failed to generate summary");
      }

      setFinalSummary(data.final_summary);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to generate summary");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="px-2 space-y-4">
        <div className="w-3xl m-4 px-2">
          <div className="flex items-center space-x-4">
            <Input type="file" accept=".pdf" onChange={handleFileChange} className="flex-1" id="file-upload" />
            <Button onClick={generateSummary} disabled={isLoading || !pdfUrl}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {isLoading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="grid md:grid-cols-2 gap-4 px-2">
          <Card className="h-[calc(100vh-8rem)] overflow-hidden">
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
              <CardDescription>A high-level overview of the document</CardDescription>
            </CardHeader>
            <CardContent className="h-full overflow-auto">
              <AnimatePresence mode="wait">
                {finalSummary ? (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <ReactMarkdown className="prose dark:prose-invert max-w-none">{finalSummary}</ReactMarkdown>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center justify-center h-full text-center"
                  >
                    <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground">
                      Upload a tender document and click "Analyze" to begin
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
          <Card className="h-[calc(100vh-8rem)] overflow-hidden">
            <CardHeader>
              <CardTitle>PDF Preview</CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <AnimatePresence mode="wait">
                {pdfUrl ? (
                  <motion.div
                    key="pdf"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="h-full"
                  >
                    <PDFViewer fileUrl={pdfUrl} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center justify-center h-full text-center"
                  >
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground">PDF preview will appear here</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
