import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SteerCoOCR: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleOCR = async () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setOcrResult(null);
    setProgress(0);

    try {
      if (selectedFile.type === 'application/pdf') {
        // Handle PDF
        const reader = new FileReader();
        reader.onload = async e => {
          const pdfData = new Uint8Array(e.target?.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            if (context) {
              await page.render({ canvasContext: context, viewport: viewport })
                .promise;
              const {
                data: { text },
              } = await Tesseract.recognize(canvas, 'eng', {
                logger: m => {
                  if (m.status === 'recognizing text') {
                    setProgress(Math.round(m.progress * 100));
                  }
                },
              });
              fullText += text + '\n';
            }
          }
          setOcrResult(fullText);
        };
        reader.readAsArrayBuffer(selectedFile);
      } else {
        // Handle Image
        const {
          data: { text },
        } = await Tesseract.recognize(selectedFile, 'eng', {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          },
        });
        setOcrResult(text);
      }
    } catch (err) {
      setError('An error occurred during OCR processing.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SteerCo Document OCR</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Input id="picture" type="file" onChange={handleFileChange} />
        </div>
        <Button
          onClick={handleOCR}
          disabled={isLoading || !selectedFile}
          className="mt-4"
        >
          {isLoading ? 'Processing...' : 'Process Document'}
        </Button>
        {isLoading && <Progress value={progress} className="w-full mt-4" />}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {ocrResult && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold">OCR Result:</h3>
            <pre className="p-4 mt-2 bg-gray-100 rounded-md">{ocrResult}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SteerCoOCR;
