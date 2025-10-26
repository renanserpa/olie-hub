import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MediaPicker } from './MediaPicker';

interface MediaAssetDialogProps {
  open: boolean;
  onClose: () => void;
  bucket: 'product-media' | 'material-media';
  onSelect: (url: string, assetId: string) => void;
  title?: string;
  description?: string;
}

export function MediaAssetDialog({
  open,
  onClose,
  bucket,
  onSelect,
  title = 'Selecionar Mídia',
  description = 'Escolha uma imagem da biblioteca ou faça upload de uma nova',
}: MediaAssetDialogProps) {
  function handleSelect(url: string, assetId: string) {
    onSelect(url, assetId);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <MediaPicker
          bucket={bucket}
          onSelect={handleSelect}
          allowUpload={true}
          allowDelete={false}
        />
      </DialogContent>
    </Dialog>
  );
}
