// hooks/useConfirm.ts
import { ConfirmModal } from '@/components/widget/confirm-modal/confirm-modal';
import { useState } from 'react';

type ConfirmOptions = {
   title?: string;
   message?: string;
   confirmText?: string;
   cancelText?: string;
};

export function useConfirm() {
   const [promise, setPromise] = useState<null | {
      resolve: (value: boolean) => void;
      reject: () => void;
      options: ConfirmOptions;
   }>(null);

   const confirm = (options: ConfirmOptions = {}) => {
      return new Promise<boolean>((resolve, reject) => {
         setPromise({ resolve, reject, options });
      });
   };

   const handleClose = () => {
      if (promise) {
         promise.resolve(false);
         setPromise(null);
      }
   };

   const handleConfirm = () => {
      if (promise) {
         promise.resolve(true);
         setPromise(null);
      }
   };

   const ConfirmDialog = () => (
      <ConfirmModal
         isOpen={!!promise}
         title={promise?.options.title || 'Подтвердите действие'}
         message={promise?.options.message || 'Вы уверены?'}
         confirmText={promise?.options.confirmText}
         cancelText={promise?.options.cancelText}
         onConfirm={handleConfirm}
         onCancel={handleClose}
      />
   );

   return { confirm, ConfirmDialog };
}