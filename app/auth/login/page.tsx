import { login } from "@/app/actions/auth";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <form action={login} className="space-y-4">
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-2xl font-bold">Connexion</h1>
            <p className="text-muted-foreground">
              Utilisez votre compte ENSPD pour accéder à la plateforme.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-3 py-2 border rounded-md"
              placeholder="etudiant@enspd.cm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
