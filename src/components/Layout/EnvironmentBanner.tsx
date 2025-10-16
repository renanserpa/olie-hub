import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { runtimeEnv, isCorrectEnvironment } from '@/lib/runtime/env';

export function EnvironmentBanner() {
  const isCorrect = isCorrectEnvironment();

  return (
    <div className="border-b bg-muted/50 px-4 py-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="font-mono font-semibold">
            ENV: {runtimeEnv.appEnv.toUpperCase()}
          </span>
          <span className="font-mono">
            SUPABASE: {runtimeEnv.supabaseRef}
          </span>
        </div>
        
        {!isCorrect && (
          <Alert variant="destructive" className="inline-flex items-center gap-2 p-2 border-0">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-xs">
              Conectado a <strong>{runtimeEnv.supabaseRef}</strong>, esperado <strong>{runtimeEnv.allowedRef}</strong>
            </AlertDescription>
          </Alert>
        )}
        
        {isCorrect && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>Ambiente correto</span>
          </div>
        )}
      </div>
    </div>
  );
}
