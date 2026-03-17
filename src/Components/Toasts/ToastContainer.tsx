// components/ToastContainer.tsx
import React, { useState, useEffect, useCallback } from 'react';
import CustomToast, { ToastType, ToastPosition } from './CustomToast';
import ToastService, { ToastOptions } from './ToastService';

const ToastContainer: React.FC = () => {
  const [toast, setToast] = useState<ToastOptions & { visible: boolean }>({
    visible: false,
    message: '',
    type: 'info',
    position: 'top',
    duration: 2000,
  });

  const hide = useCallback(() => setToast(t => ({ ...t, visible: false })), []);
  const show = useCallback((options: ToastOptions) => setToast({ ...options, visible: true }), []);

  useEffect(() => {
    ToastService.setRef({ show, hide });
  }, [show, hide]);

  return (
    <CustomToast
      visible={toast.visible}
      message={toast.message}
      type={toast.type as ToastType}
      position={toast.position as ToastPosition}
      duration={toast.duration}
      onHide={hide}
    />
  );
};

export default ToastContainer;
