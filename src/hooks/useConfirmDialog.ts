import { useState } from 'react';

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
}

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    description: '',
  });
  const [resolveCallback, setResolveCallback] = useState<((value: boolean) => void) | null>(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    
    return new Promise((resolve) => {
      setResolveCallback(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolveCallback?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveCallback?.(false);
  };

  return {
    isOpen,
    options,
    confirm,
    handleConfirm,
    handleCancel,
  };
}
