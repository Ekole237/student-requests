'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-red-200 bg-red-50/50 dark:bg-red-950/10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-red-600" />
          </div>
          <CardTitle className="text-4xl font-bold">500</CardTitle>
          <CardDescription className="text-base mt-2">
            Erreur serveur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-foreground font-medium">
              Une erreur s&apos;est produite.
            </p>
            <p className="text-sm text-muted-foreground">
              Notre équipe a été notifiée. Veuillez réessayer.
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-4 font-mono bg-muted p-2 rounded">
                Erreur ID: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => reset()}
              className="w-full"
            >
              Réessayer
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">
                Aller au tableau de bord
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/">
                Aller à l&apos;accueil
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
