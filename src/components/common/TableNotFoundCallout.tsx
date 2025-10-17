import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  tableName: string;
  onRetry?: () => void;
}

export function TableNotFoundCallout({ tableName, onRetry }: Props) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertTriangle className="w-4 h-4" />
      <AlertTitle>Migrations Pendentes</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          A tabela <code className="font-mono bg-destructive/10 px-1 rounded">{tableName}</code> não foi encontrada.
        </p>
        <p className="text-sm">
          Aplique os arquivos <code className="font-mono bg-muted px-1 rounded">db/migrations/*.sql</code> no Supabase 
          projeto <strong>qrfvdoecpmcnlpxklcsu</strong>.
        </p>
        <div className="flex gap-2 items-center">
          <a 
            href="https://supabase.com/dashboard/project/qrfvdoecpmcnlpxklcsu/editor/sql" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline hover:no-underline"
          >
            Abrir SQL Editor →
          </a>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
