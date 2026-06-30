import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6 min-h-[60vh] select-none space-y-6">
      <div className="rounded-full bg-destructive/10 border border-destructive/20 p-5 text-destructive animate-bounce">
        <HelpCircle className="h-10 w-10" />
      </div>
      
      <div className="space-y-2 max-w-[400px]">
        <h1 className="text-3xl font-bold tracking-tight">404 - Page Not Found</h1>
        <p className="text-sm text-muted-foreground leading-normal">
          The dispatch coordinates you searched for do not exist, or the route has been updated.
        </p>
      </div>

      <div className="pt-2">
        <Link to="/dashboard">
          <Button variant="primary" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
