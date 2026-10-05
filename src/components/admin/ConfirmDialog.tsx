import { X, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'info';
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info'
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 space-y-6">
          <div className="flex justify-center">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              variant === 'danger' ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"
            )}>
              <AlertCircle className="w-8 h-8" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-50 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-all text-sm"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={cn(
                "px-6 py-3 text-white font-bold rounded-2xl transition-all text-sm shadow-lg",
                variant === 'danger' ? "bg-rose-500 hover:bg-rose-600 shadow-rose-200" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
