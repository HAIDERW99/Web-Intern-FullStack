import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { Button } from '@components/ui/button';
import { APP_NAME } from '@config/constants';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 gap-6 p-4 text-center">
      <GraduationCap className="h-12 w-12 text-primary" aria-hidden="true" />
      <div>
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-xl font-semibold text-foreground">Page not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The page you're looking for doesn't exist in {APP_NAME}.
        </p>
      </div>
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}
