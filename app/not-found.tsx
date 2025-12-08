'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-amber-600" />
          </div>
          <CardTitle className="text-4xl font-bold">404</CardTitle>
          <CardDescription className="text-base mt-2">
            Page non trouvée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-foreground font-medium">
              Désolé, la page que vous cherchez n&apos;existe pas.
            </p>
            <p className="text-sm text-muted-foreground">
              Elle a peut-être été supprimée ou le lien n&apos;est plus valide.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full"
            >
              Retour à la page précédente
            </Button>
            <Button asChild className="w-full">
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
