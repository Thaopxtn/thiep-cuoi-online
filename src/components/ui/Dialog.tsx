"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  id?: string;
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  className?: string;
}

const activeDialogs = new Set<HTMLDialogElement>();
let previousBodyOverflow = "";

/** Native modality keeps focus in the dialog and makes the page behind it inert. */
export default function Dialog({
  isOpen,
  onClose,
  children,
  id,
  label,
  labelledBy,
  describedBy,
  className = "flex min-h-full items-center justify-center p-4",
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    if (activeDialogs.size === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    activeDialogs.add(dialog);

    return () => {
      dialog.close();
      activeDialogs.delete(dialog);
      if (activeDialogs.size === 0) document.body.style.overflow = previousBodyOverflow;
      if (opener?.isConnected && !document.querySelector("dialog:modal")) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      id={id}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none overflow-y-auto overscroll-contain border-0 bg-transparent p-0 text-inherit backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div
        className={className}
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        {children}
      </div>
    </dialog>
  );
}
