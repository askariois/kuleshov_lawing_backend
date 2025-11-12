import { Button } from "@/components/ui/button";

// components/ui/ConfirmModal.tsx
type ConfirmModalProps = {
   isOpen: boolean;
   title: string;
   message: string;
   confirmText?: string;
   cancelText?: string;
   onConfirm: () => void;
   onCancel: () => void;
};

export function ConfirmModal({
   isOpen,
   title,
   message,
   confirmText = 'Да',
   cancelText = 'Отмена',
   onConfirm,
   onCancel,
}: ConfirmModalProps) {
   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onCancel}>
         <div
            className="bg-white border-2 border-[#3C3D3E] rounded-[22px] p-8 max-w-md w-full mx-4"
            onClick={e => e.stopPropagation()}
         >
            <h3 className="text-2xl font-medium text-[#30A8F9] mb-4">{title}</h3>
            <p className="font-bold text-[#111111] text-[18px] w-full">{message}</p>

            <div className="flex justify-end gap-3 mt-4">
               <Button
                  variant={'red'}
                  size={'lg'}
                  onClick={onCancel}
                  className="px-6 py-2 "
               >
                  {cancelText}
               </Button>
               <Button
                  variant={'primary'}
                  size={'lg'}
                  onClick={onConfirm}
                  className="px-6 py-2transition"
               >
                  {confirmText}
               </Button>
            </div>
         </div>
      </div>
   );
}