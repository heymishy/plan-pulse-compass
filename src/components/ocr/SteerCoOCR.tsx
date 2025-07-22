import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Users,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { extractEntitiesFromText } from '@/utils/ocrExtraction';
import {
  mapExtractedEntitiesToExisting,
  generateContextUpdates,
} from '@/utils/ocrMapping';
import type {
  OCRExtractionResult,
  EntityMappingResult,
  MappingCandidate,
  ExtractedEntity,
} from '@/types/ocrTypes';
// Heavy libraries - loaded dynamically
type TesseractType = typeof import('tesseract.js');
type PDFJSType = typeof import('pdfjs-dist');

// Lazy loaded imports
const loadTesseract = async (): Promise<TesseractType> => {
  const tesseractModule = await import('tesseract.js');
  return tesseractModule;
};

const loadPDFJS = async (): Promise<PDFJSType> => {
  const pdfjsModule = await import('pdfjs-dist');
  return pdfjsModule;
};

// Configure PDF.js worker - use local worker to avoid CORS issues in corporate networks
pdfjsLib.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.js';

// Helper function to extract text from PowerPoint slide content
const extractTextFromSlideContent = (content: unknown): string => {
  let text = '';

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    content.forEach(item => {
      text += extractTextFromSlideContent(item) + ' ';
    });
  } else if (content && typeof content === 'object') {
    // Extract text from common PowerPoint content properties
    const obj = content as Record<string, unknown>;
    if (typeof obj.text === 'string') {
      text += obj.text + ' ';
    }
    if (typeof obj.value === 'string') {
      text += obj.value + ' ';
    }
    if (obj.content) {
      text += extractTextFromSlideContent(obj.content) + ' ';
    }
    if (obj.children) {
      text += extractTextFromSlideContent(obj.children) + ' ';
    }

    // Recursively check all object properties
    Object.values(obj).forEach(value => {
      if (typeof value === 'string') {
        text += value + ' ';
      } else if (value && typeof value === 'object') {
        text += extractTextFromSlideContent(value) + ' ';
      }
    });
  }

  return text.trim();
};

const SteerCoOCR: React.FC = () => {
  const {
    projects,
    epics,
    teams,
    milestones,
    people,
    config,
    setProjects,
    setEpics,
    setTeams,
    actualAllocations,
    setActualAllocations,
  } = useApp();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] =
    useState<OCRExtractionResult | null>(null);
  const [mappingResult, setMappingResult] =
    useState<EntityMappingResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<
    'upload' | 'ocr' | 'extraction' | 'mapping' | 'review'
  >('upload');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-powerpoint', // .ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
      ];

      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError(
          'Please select a PDF, PowerPoint, or image file (PDF, PPT, PPTX, PNG, JPG, JPEG, WebP).'
        );
        setSelectedFile(null);
      }
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
      if (
        selectedFile.type === 'application/vnd.ms-powerpoint' ||
        selectedFile.type ===
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ) {
        // Handle PowerPoint files
        const reader = new FileReader();
        reader.onload = async e => {
          try {
            setCurrentStep('ocr');
            setProgress(25);

            // Parse PowerPoint content
            const pptxData = new Uint8Array(e.target?.result as ArrayBuffer);
            const pptx2json = await import('pptx2json');
            const Parser = pptx2json.default || pptx2json;
            const pptxContent = await new Parser().parse(pptxData);

            setProgress(50);

            // Extract text content from slides
            let fullText = '';
            if (pptxContent && pptxContent.slides) {
              for (let i = 0; i < pptxContent.slides.length; i++) {
                const slide = pptxContent.slides[i];
                setProgress(50 + (i / pptxContent.slides.length) * 30);

                // Extract text from slide content
                if (slide.content) {
                  const slideText = extractTextFromSlideContent(slide.content);
                  fullText += `\nSlide ${i + 1}:\n${slideText}\n`;
                }
              }
            }

            setProgress(80);
            setOcrResult(fullText);
            setCurrentStep('extraction');
            await processExtraction(fullText);
          } catch (pptxError) {
            console.error('PowerPoint parsing error:', pptxError);
            setError(
              'Error processing PowerPoint file. Please try exporting as PDF or contact support.'
            );
          }
        };
        reader.readAsArrayBuffer(selectedFile);
      } else if (selectedFile.type === 'application/pdf') {
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
          setCurrentStep('extraction');
          await processExtraction(fullText);
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
        setCurrentStep('extraction');
        await processExtraction(text);
      }
    } catch (err) {
      setError('An error occurred during OCR processing.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const processExtraction = async (rawText: string) => {
    try {
      setProgress(50);
      const result = extractEntitiesFromText(rawText, {
        documentType: 'steering-committee',
        extractionMode: 'comprehensive',
        confidenceThreshold: 0.6,
      });

      setExtractionResult(result);
      setCurrentStep('mapping');

      // Perform mapping to existing data
      const mapping = mapExtractedEntitiesToExisting(result, {
        projects,
        epics,
        teams,
        milestones,
        people,
      });

      setMappingResult(mapping);
      setCurrentStep('review');
      setProgress(100);
    } catch (err) {
      setError('Error during entity extraction and mapping.');
      console.error(err);
    }
  };

  const applyMappings = async (mappingsToApply: MappingCandidate[]) => {
    try {
      if (!extractionResult || !mappingResult || !config) {
        setError('Missing required data for applying mappings.');
        return;
      }

      const updates = generateContextUpdates(
        { ...mappingResult, mappings: mappingsToApply },
        extractionResult,
        {
          projects,
          epics,
          teams,
          milestones,
          actualAllocations,
        }
      );

      // Apply updates to contexts
      if (
        updates?.projects &&
        projects &&
        updates.projects.length !== projects.length
      ) {
        setProjects(updates.projects);
      }

      if (updates?.epics && epics && updates.epics.length !== epics.length) {
        setEpics(updates.epics);
      }

      // Note: Milestones would need to be handled if they were part of a context
      // For now, we'll just note that they would be updated

      if (
        updates?.actualAllocations &&
        actualAllocations &&
        updates.actualAllocations.length !== actualAllocations.length
      ) {
        setActualAllocations(updates.actualAllocations);
      }

      // Create summary of what was updated
      const updatedProjects =
        updates?.projects && projects
          ? updates.projects.filter(
              (proj, index) =>
                JSON.stringify(proj) !== JSON.stringify(projects[index])
            )
          : [];
      const updatedEpics =
        updates?.epics && epics
          ? updates.epics.filter(
              (epic, index) =>
                JSON.stringify(epic) !== JSON.stringify(epics[index])
            )
          : [];

      const summary = [
        updatedProjects.length > 0
          ? `${updatedProjects.length} projects updated`
          : null,
        updatedEpics.length > 0 ? `${updatedEpics.length} epics updated` : null,
        (updates?.newRisks?.length || 0) > 0
          ? `${updates.newRisks.length} new risks identified`
          : null,
        updates?.actualAllocations &&
        actualAllocations &&
        updates.actualAllocations.length - actualAllocations.length > 0
          ? `${updates.actualAllocations.length - actualAllocations.length} new allocations added`
          : null,
      ]
        .filter(Boolean)
        .join(', ');

      alert(
        `Successfully applied ${mappingsToApply.length} mappings! ${summary || 'No changes made.'}`
      );
    } catch (err) {
      setError('Error applying mappings.');
      console.error(err);
    }
  };

  const resetProcess = () => {
    setSelectedFile(null);
    setOcrResult(null);
    setExtractionResult(null);
    setMappingResult(null);
    setCurrentStep('upload');
    setProgress(0);
    setError(null);
  };

  const getEntityDisplayName = (entity: ExtractedEntity): string => {
    if ('projectName' in entity) return entity.projectName;
    if ('teamName' in entity) return entity.teamName;
    if ('milestoneName' in entity) return entity.milestoneName;
    if ('riskDescription' in entity)
      return entity.riskDescription.substring(0, 50) + '...';
    return 'Unknown Entity';
  };

  const getConflictVariant = (
    level: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (level) {
      case 'none':
        return 'default';
      case 'low':
        return 'secondary';
      case 'medium':
        return 'outline';
      case 'high':
        return 'destructive';
      default:
        return 'secondary';
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

        {/* Step Indicator */}
        <div className="mt-6 mb-4">
          <div className="flex items-center space-x-2">
            <Badge variant={currentStep === 'upload' ? 'default' : 'secondary'}>
              1. Upload
            </Badge>
            <Badge variant={currentStep === 'ocr' ? 'default' : 'secondary'}>
              2. OCR
            </Badge>
            <Badge
              variant={currentStep === 'extraction' ? 'default' : 'secondary'}
            >
              3. Extract
            </Badge>
            <Badge
              variant={currentStep === 'mapping' ? 'default' : 'secondary'}
            >
              4. Map
            </Badge>
            <Badge variant={currentStep === 'review' ? 'default' : 'secondary'}>
              5. Review
            </Badge>
          </div>
        </div>

        {/* Raw OCR Result */}
        {ocrResult && currentStep !== 'upload' && (
          <Card className="mt-4" data-testid="ocr-result">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Raw OCR Result</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-gray-100 rounded-md text-xs overflow-auto max-h-40">
                {ocrResult.length > 500
                  ? `${ocrResult.substring(0, 500)}...`
                  : ocrResult}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Extraction Results */}
        {extractionResult && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Extracted Entities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {extractionResult.projectStatuses?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Project Updates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {extractionResult.risks?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Risks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {extractionResult.milestones?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Milestones</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {extractionResult.teamUpdates?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Team Updates</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm">
                    <strong>Confidence:</strong>{' '}
                    {Math.round(
                      (extractionResult.extractionMetadata?.totalConfidence ||
                        0) * 100
                    )}
                    % |<strong>Processing:</strong>{' '}
                    {extractionResult.extractionMetadata?.processingTime || 0}ms
                    |<strong>Total Entities:</strong>{' '}
                    {extractionResult.extractionMetadata?.extractedEntities ||
                      0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mapping Results */}
        {mappingResult && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Entity Mapping Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-lg font-bold">
                      {mappingResult.mappings.length}
                    </div>
                    <div className="text-sm text-gray-600">Mapped</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded">
                    <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-lg font-bold">
                      {mappingResult.conflicts.length}
                    </div>
                    <div className="text-sm text-gray-600">Conflicts</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <div className="text-lg font-bold">
                      {mappingResult.unmappedEntities.length}
                    </div>
                    <div className="text-sm text-gray-600">Unmapped</div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-blue-50 p-4 rounded">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Recommendations
                  </h4>
                  <ul className="text-sm space-y-1">
                    {mappingResult.recommendations.suggestedActions.map(
                      (action, index) => (
                        <li key={index} className="text-blue-700">
                          • {action}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* Detailed Mappings */}
                {mappingResult.mappings.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Successful Mappings</h4>
                    <div className="space-y-2">
                      {mappingResult.mappings.map((mapping, index) => (
                        <div
                          key={index}
                          className="border rounded p-3 bg-green-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium">
                                {getEntityDisplayName(mapping.extractedEntity)}
                                <Badge className="ml-2">
                                  {mapping.existingEntityType}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                {mapping.mappingReason}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {Math.round(mapping.matchConfidence * 100)}%
                              </div>
                              <Badge
                                variant={getConflictVariant(
                                  mapping.conflictLevel
                                )}
                              >
                                {mapping.conflictLevel}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conflicts */}
                {mappingResult.conflicts.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-yellow-700">
                      Conflicts Requiring Review
                    </h4>
                    <div className="space-y-2">
                      {mappingResult.conflicts.map((conflict, index) => (
                        <div
                          key={index}
                          className="border rounded p-3 bg-yellow-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium">
                                {getEntityDisplayName(conflict.extractedEntity)}
                                <Badge className="ml-2">
                                  {conflict.existingEntityType}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                {conflict.mappingReason}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="destructive">
                                {conflict.conflictLevel} conflict
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={() =>
                      applyMappings(
                        mappingResult.mappings.filter(
                          m => m.matchConfidence > 0.8
                        )
                      )
                    }
                    disabled={
                      mappingResult.mappings.filter(
                        m => m.matchConfidence > 0.8
                      ).length === 0
                    }
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Apply High Confidence (
                    {
                      mappingResult.mappings.filter(
                        m => m.matchConfidence > 0.8
                      ).length
                    }
                    )
                  </Button>
                  <Button
                    onClick={() => applyMappings(mappingResult.mappings)}
                    variant="outline"
                  >
                    Apply All Mappings ({mappingResult.mappings.length})
                  </Button>
                  <Button onClick={resetProcess} variant="outline">
                    Start Over
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default SteerCoOCR;
