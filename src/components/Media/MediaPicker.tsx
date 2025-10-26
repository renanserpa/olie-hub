import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { toast } from 'sonner';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

interface MediaPickerProps {
  bucket: 'product-media' | 'material-media';
  onSelect?: (url: string, assetId: string) => void;
  allowUpload?: boolean;
  allowDelete?: boolean;
}

export function MediaPicker({ 
  bucket, 
  onSelect, 
  allowUpload = false,
  allowDelete = false 
}: MediaPickerProps) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { isAdmin } = useAdminAccess();

  const canUpload = allowUpload && isAdmin;
  const canDelete = allowDelete && isAdmin;

  useEffect(() => {
    loadFiles();
  }, [bucket]);

  async function loadFiles() {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage
        .from(bucket)
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;
      setFiles(data || []);
    } catch (e: any) {
      toast.error('Erro ao carregar mídias: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 5MB');
      return;
    }

    try {
      setUploading(true);

      // Gerar nome único
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `${fileName}`;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      toast.success('Upload realizado com sucesso!');
      loadFiles(); // Recarregar lista
    } catch (e: any) {
      toast.error('Erro no upload: ' + e.message);
    } finally {
      setUploading(false);
      e.target.value = ''; // Limpar input
    }
  }

  async function handleDelete(file: StorageFile) {
    if (!confirm('Deseja realmente excluir esta mídia?')) return;

    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([file.name]);

      if (error) throw error;

      toast.success('Mídia excluída');
      loadFiles();
    } catch (e: any) {
      toast.error('Erro ao excluir: ' + e.message);
    }
  }

  function getPublicUrl(path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  if (loading) {
    return <div className="p-6">Carregando biblioteca...</div>;
  }

  return (
    <div className="space-y-4">
      {canUpload && (
        <div className="flex gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="flex-1"
          />
          <Button disabled={uploading} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Enviando...' : 'Upload'}
          </Button>
        </div>
      )}

      {files.length === 0 ? (
        <Alert>
          <ImageIcon className="w-4 h-4" />
          <AlertDescription>
            Nenhuma mídia encontrada neste bucket.
            {canUpload && ' Faça upload da primeira imagem.'}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => {
            const url = getPublicUrl(file.name);
            return (
              <Card key={file.id} className="overflow-hidden">
                <CardContent className="p-2">
                  <img
                    src={url}
                    alt={file.name}
                    className="w-full h-32 object-cover rounded"
                  />
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground truncate">
                      {file.name}
                    </p>
                    <div className="flex gap-1">
                      {onSelect && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => onSelect(url, file.id)}
                        >
                          Selecionar
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(file)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
