"use client";

import { useState, type ReactNode } from "react";
import { EditableSection } from "./EditableSection";

export function LinkedSections({
  leftKey,
  leftTitle,
  leftView,
  leftForm,
  rightKey,
  rightTitle,
  rightView,
  rightForm,
}: {
  leftKey?: string;
  leftTitle: string;
  leftView: ReactNode;
  leftForm: ReactNode;
  rightKey?: string;
  rightTitle: string;
  rightView: ReactNode;
  rightForm: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((o) => !o);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <EditableSection
        key={leftKey}
        title={leftTitle}
        view={leftView}
        form={leftForm}
        open={open}
        onToggle={toggle}
      />
      <EditableSection
        key={rightKey}
        title={rightTitle}
        view={rightView}
        form={rightForm}
        open={open}
        onToggle={toggle}
      />
    </div>
  );
}
