"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextAreaBox } from "@/components/inputs";

type AdminRejectReasonModalProps = {
  open: boolean;
  title: string;
  reasonLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  isSaving?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
};

export function AdminRejectReasonModal({
  open,
  title,
  reasonLabel,
  confirmLabel,
  cancelLabel,
  isSaving = false,
  onClose,
  onConfirm,
}: AdminRejectReasonModalProps) {
  const [reason, setReason] = useState("");

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleConfirm = async () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    await onConfirm(trimmed);
    setReason("");
  };

  return (
    <Modal isOpen={open} onClose={handleClose} title={title} size="sm">
      <div className="space-y-4 p-6">
        <TextAreaBox
          label={reasonLabel}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={isSaving}
          rows={4}
        />
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" disabled={isSaving} onClick={handleClose}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={isSaving || !reason.trim()}
            onClick={() => void handleConfirm()}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
