import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { runConfigsDiagnostics, DiagnosticCheck } from '@/lib/api/diagnostics';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Shield } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function DiagnosticsConfigs() {
  const { isAdmin, loading: checkingAdmin } = useAdminAccess();
  const [checks, setChecks] = useState<DiagnosticCheck[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (isAdmin) {
      runDiagnostics();
    }
  }, [isAdmin]);
  
  async function runDiagnostics() {
    setLoading(true);
    try {
      const results = await runConfigsDiagnostics();
      setChecks(results);
    } catch (error) {
      console.error('Erro ao executar diagnósticos:', error);
    } finally {
      setLoading(false);
    }
  }
  
  if (checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  const hasErrors = checks.some(c => c.status === 'error');
  const errorCount = checks.filter(c => c.status === 'error').length;
  const okCount = checks.filter(c => c.status === 'ok').length;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Diagnóstico de Configurações
          </h1>
          <p className="text-muted-foreground mt-1">
            Verificação de integridade das tabelas e dados
          </p>
        </div>
        
        <Button onClick={runDiagnostics} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Recarregar
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total de Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{checks.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              OK
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{okCount}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              Erros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{errorCount}</p>
          </CardContent>
        </Card>
      </div>
      
      {hasErrors && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Migrations Pendentes</AlertTitle>
          <AlertDescription>
            Algumas tabelas não foram encontradas. 
            Aplique os arquivos <code className="font-mono">db/migrations/*.sql</code> no Supabase 
            projeto <strong>qrfvdoecpmcnlpxklcsu</strong> e recarregue esta página.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {checks.map((check, i) => (
          <Card key={i} className={check.status === 'error' ? 'border-red-300' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {check.status === 'ok' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                {check.status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                {check.status === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                {check.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant={check.status === 'ok' ? 'default' : 'destructive'}>
                  {check.status.toUpperCase()}
                </Badge>
                <p className="text-sm text-muted-foreground">{check.details}</p>
                {check.error && (
                  <p className="text-xs text-red-600 font-mono mt-2 p-2 bg-red-50 rounded">
                    {check.error}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
