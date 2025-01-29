"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Layers } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import summaryData from "../../python-api/Summary.json";

const PDFViewer = dynamic(() => import("@/components/PDFViewer"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading PDF...</div>,
});

export default function SummaryPage() {
  const [activeTab, setActiveTab] = useState("overall");

  return (
    <div className="min-h-screen bg-background p-4">
      <main className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Card className=" overflow-hidden">
            <CardHeader>
              <CardTitle>Document Summary</CardTitle>
            </CardHeader>
            <CardContent className="h-full overflow-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overall">
                    <FileText className="mr-2 h-4 w-4" />
                    Overall Summary
                  </TabsTrigger>
                  <TabsTrigger value="page-wise">
                    <Layers className="mr-2 h-4 w-4" />
                    Page-wise Summary
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overall">
                  <ReactMarkdown className="prose dark:prose-invert max-w-none">
                    {summaryData.final_summary}
                  </ReactMarkdown>
                </TabsContent>
                <TabsContent value="page-wise">
                  <Accordion type="single" collapsible>
                    {Object.entries(summaryData.page_summaries).map(([page, summary]) => (
                      <AccordionItem key={page} value={`page-${page}`}>
                        <AccordionTrigger>Page {page}</AccordionTrigger>
                        <AccordionContent>
                          <ReactMarkdown className="prose dark:prose-invert max-w-none">{summary}</ReactMarkdown>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="h-[calc(100vh-1.2rem)] overflow-hidden">
            <CardHeader>
              <CardTitle>PDF Preview</CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <PDFViewer fileUrl="/tender.pdf" />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
