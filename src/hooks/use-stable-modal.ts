'use client';

import { useCallback, useRef, useState } from 'react';

interface UseStableModalOptions {
  onOpen?: () => void;
  onClose?: () => void;
  preventMultipleOpens?: boolean;
}

export function useStableModal(options: UseStableModalOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const isOpeningRef = useRef(false);
  const isClosingRef = useRef(false);
  const callbacksRef = useRef(options);
  
  // Update callbacks without triggering re-renders
  callbacksRef.current = options;

  const openModal = useCallback(() => {
    if (isOpeningRef.current || (options.preventMultipleOpens && isOpen)) {
      return;
    }
    
    isOpeningRef.current = true;
    isClosingRef.current = false;
    
    setIsOpen(true);
    
    // Execute callback after state update
    setTimeout(() => {
      callbacksRef.current.onOpen?.();
      isOpeningRef.current = false;
    }, 0);
  }, [isOpen, options.preventMultipleOpens]);

  const closeModal = useCallback(() => {
    if (isClosingRef.current || !isOpen) {
      return;
    }
    
    isClosingRef.current = true;
    isOpeningRef.current = false;
    
    setIsOpen(false);
    
    // Execute callback after state update
    setTimeout(() => {
      callbacksRef.current.onClose?.();
      isClosingRef.current = false;
    }, 0);
  }, [isOpen]);

  const toggleModal = useCallback(() => {
    if (isOpen) {
      closeModal();
    } else {
      openModal();
    }
  }, [isOpen, openModal, closeModal]);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
    isOpening: isOpeningRef.current,
    isClosing: isClosingRef.current
  };
}

// Hook especializado para modales con datos
export function useStableDataModal<T = any>(options: UseStableModalOptions = {}) {
  const modal = useStableModal(options);
  const [data, setData] = useState<T | null>(null);
  const dataRef = useRef<T | null>(null);

  const openWithData = useCallback((newData: T) => {
    dataRef.current = newData;
    setData(newData);
    modal.openModal();
  }, [modal]);

  const closeAndClearData = useCallback(() => {
    modal.closeModal();
    // Clear data after a delay to prevent flickering
    setTimeout(() => {
      dataRef.current = null;
      setData(null);
    }, 150);
  }, [modal]);

  return {
    ...modal,
    data,
    openWithData,
    closeAndClearData,
    closeModal: closeAndClearData
  };
}