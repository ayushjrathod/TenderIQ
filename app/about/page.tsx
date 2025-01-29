import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Zap } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">About Our PDF Summary Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg text-muted-foreground">
            Our PDF Summary Tool is designed to help professionals quickly extract key information from lengthy
            documents. Using advanced AI technology, we provide concise summaries of complex PDFs, saving you time and
            enhancing your productivity.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <FileText className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Efficient Summaries</CardTitle>
              </CardHeader>
              <CardContent>Get comprehensive overviews of entire documents and page-by-page breakdowns.</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Fast Processing</CardTitle>
              </CardHeader>
              <CardContent>Our AI-powered system quickly analyzes documents, providing rapid insights.</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Chat With PDFs</CardTitle>
              </CardHeader>
              <CardContent>
                You can Chat with your PDFs to ask questions, get clarifications, and discuss key points with our AI
              </CardContent>
            </Card>
          </div>

          <p className="text-muted-foreground">
            Whether you're dealing with legal documents, research papers, or business reports, our tool is here to make
            your work easier and more efficient.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
