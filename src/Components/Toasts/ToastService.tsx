// components/ToastService.ts
import type { ToastType, ToastPosition } from './CustomToast';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  position?: ToastPosition;
  duration?: number;
}

interface ToastRef {
  show: (options: ToastOptions) => void;
  hide: () => void;
}

let toastRef: ToastRef | null = null;

const ToastService = {
  setRef: (ref: ToastRef) => {
    toastRef = ref;
  },
  show: (options: ToastOptions) => {
    if (toastRef) {
      toastRef.show(options);
    } else {
    }
  },
  hide: () => {
    toastRef?.hide();
  },
};

export default ToastService;
