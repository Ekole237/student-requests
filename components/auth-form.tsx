'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth';
import { Eye, EyeOff } from 'lucide-react';

export function AuthForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      console.log('Submitting login form...');
      const result = await login(formData);
      console.log('Login result:', result);
      
      if (result.success && result.redirectUrl) {
        console.log('Login successful, redirecting to:', result.redirectUrl);
        // Add a delay to ensure cookie is set before navigating
        setTimeout(() => {
          console.log('Calling router.push() after delay...');
          try {
            router.push(result.redirectUrl);
            console.log('router.push() completed');
          } catch (err) {
            console.error('router.push() error:', err);
            setError('Erreur lors de la redirection');
            setIsLoading(false);
          }
        }, 200);
        return;
      }
      
      if (result.error) {
        console.log('Login failed:', result.error);
        setError(result.error);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setError('Une erreur est survenue lors de la connexion');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl font-bold">Connexion</h1>
        <p className="text-muted-foreground">
          Utilisez votre compte ENSPD pour accéder à la plateforme.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          disabled={isLoading}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="etudiant@enspd-udo.cm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Mot de passe
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            required
            disabled={isLoading}
            className="w-full px-3 py-2 pr-10 border rounded-md"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? 'Connexion en cours...' : 'Se connecter'}
      </button>
    </form>
  );
}
