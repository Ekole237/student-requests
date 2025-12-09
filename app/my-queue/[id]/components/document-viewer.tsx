'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { getSignedFileUrl } from '@/app/actions/attachments';

interface Attachment {
  id: string;
  requete_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
}

interface DocumentViewerProps {
  attachments: Attachment[];
}

type FileType = 'pdf' | 'image' | 'text' | 'unknown';

function getFileType(fileName: string): FileType {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (extension === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
  if (['txt', 'md', 'log', 'csv'].includes(extension)) return 'text';
  
  return 'unknown';
}

export default function DocumentViewer({ attachments }: DocumentViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);

  const currentAttachment = attachments[selectedIndex];
  
  if (!currentAttachment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Documents Fournis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Aucun document disponible</p>
        </CardContent>
      </Card>
    );
  }

  const fileType = getFileType(currentAttachment.file_name);
  
  // Generate signed URL when attachment changes
  useEffect(() => {
    const attachment = attachments[selectedIndex];
    if (!attachment || signedUrls[attachment.id]) return;

    const generateSignedUrl = async () => {
      setLoadingUrl(attachment.id);
      console.log('[VIEWER] Generating signed URL for:', attachment.file_path);
      
      const result = await getSignedFileUrl(attachment.file_path);
      console.log('[VIEWER] Signed URL result:', result);
      
      if (result.success && result.url) {
        setSignedUrls(prev => ({
          ...prev,
          [attachment.id]: result.url!
        }));
      } else {
        console.error('[VIEWER] Failed to get signed URL:', result.error);
      }
      setLoadingUrl(null);
    };

    generateSignedUrl();
  }, [selectedIndex, attachments, signedUrls]);

  const currentUrl = signedUrls[currentAttachment.id] || '';
  const isLoadingUrl = loadingUrl === currentAttachment.id;

  return (
    <Card className={fullscreen ? 'fixed inset-0 rounded-none' : ''}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Documents Fournis</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedIndex + 1} / {attachments.length} - {currentAttachment.file_name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFullscreen(!fullscreen)}
            title={fullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            {fullscreen ? '↙' : '⛶'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <a
              href={currentUrl}
              download
              title="Télécharger"
            >
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardHeader>

      <CardContent className={fullscreen ? 'h-screen overflow-auto p-0' : ''}>
        {/* Document Viewer */}
        <div className={`flex items-center justify-center ${fullscreen ? 'h-full bg-black' : 'min-h-96 bg-muted rounded-lg'}`}>
          {isLoadingUrl && (
            <div className="text-center p-8">
              <p className="text-muted-foreground">Chargement du document...</p>
            </div>
          )}

          {!isLoadingUrl && !currentUrl && (
            <div className="text-center p-8">
              <p className="text-muted-foreground">Impossible de charger le document</p>
            </div>
          )}

          {currentUrl && !isLoadingUrl && fileType === 'pdf' && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <iframe
                src={`${currentUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                className="w-full h-full rounded-lg"
                style={{ minHeight: fullscreen ? '100vh' : '600px' }}
              />
            </div>
          )}

          {currentUrl && !isLoadingUrl && fileType === 'image' && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="relative w-full h-full max-w-2xl max-h-96">
                <Image
                  src={currentUrl}
                  alt={currentAttachment.file_name}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}

          {currentUrl && !isLoadingUrl && fileType === 'text' && (
            <div className="w-full p-4">
              <TextFileViewer fileUrl={currentUrl} fileName={currentAttachment.file_name} />
            </div>
          )}

          {currentUrl && !isLoadingUrl && fileType === 'unknown' && (
            <div className="text-center p-8">
              <p className="text-muted-foreground mb-4">
                Format de fichier non supporté pour la visualisation: {currentAttachment.file_name}
              </p>
              <Button asChild>
                <a href={currentUrl} download>
                  Télécharger le fichier
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        {attachments.length > 1 && (
          <div className="flex items-center justify-between mt-4 px-4 pb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedIndex((i) => (i - 1 + attachments.length) % attachments.length)}
              disabled={attachments.length === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Document List */}
            <div className="flex gap-2 overflow-x-auto flex-1 mx-4 pb-2">
              {attachments.map((att, idx) => (
                <button
                  key={att.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`px-3 py-1 text-xs whitespace-nowrap rounded-md transition ${
                    idx === selectedIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-accent'
                  }`}
                  title={att.file_name}
                >
                  Doc {idx + 1}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedIndex((i) => (i + 1) % attachments.length)}
              disabled={attachments.length === 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Document List Detail */}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-semibold mb-2">Tous les documents:</p>
          <div className="space-y-2">
            {attachments.map((att, idx) => (
              <button
                key={att.id}
                onClick={() => setSelectedIndex(idx)}
                className={`w-full text-left p-2 rounded-md text-sm transition ${
                  idx === selectedIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{att.file_name}</span>
                  <span className="text-xs opacity-75">
                    {(att.file_size / 1024).toFixed(2)} KB
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component to display text files
function TextFileViewer({ fileUrl, fileName }: { fileUrl: string; fileName: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load text file content
  const loadTextFile = async () => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Failed to load file');
      const text = await response.text();
      setContent(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading file');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    loadTextFile();
  }

  if (error) {
    return <p className="text-destructive">Erreur: {error}</p>;
  }

  if (!content) {
    return <p className="text-muted-foreground">Chargement...</p>;
  }

  return (
    <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs font-mono">
      {content}
    </pre>
  );
}
