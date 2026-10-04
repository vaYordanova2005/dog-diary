"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { prepareUpload, saveAttachment } from "@/lib/actions";
import { validateFile } from "@/lib/fileTypes";
import { GENERIC_ERROR } from "@/lib/runAction";

const ACCEPT = "image/*,.heic,.heif,.pdf,.doc,.docx";

// Uploads files straight to Cloudinary with a signature from the server, then saves them to the profile.
// Files from the computer can be dropped anywhere in the section; dropped onto a folder
// (an element with data-folder-id) they go straight into it.
export function AttachmentUploader({ dogId }: { dogId: string }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function uploadOne(file: File, folderId: string | null) {
    // Checked here already — so we don't wait for the server on an obviously unsuitable file
    const invalid = validateFile(file);
    if (invalid) throw new Error(invalid);

    const prepared = await prepareUpload(dogId, { name: file.name, type: file.type, size: file.size });
    if ("error" in prepared) throw new Error(prepared.error);
    const { upload } = prepared;

    const body = new FormData();
    body.append("file", file);
    body.append("api_key", upload.apiKey);
    body.append("signature", upload.signature);
    for (const [key, value] of Object.entries(upload.params)) body.append(key, String(value));

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${upload.cloudName}/${upload.resourceType}/upload`,
      { method: "POST", body },
    );
    if (!response.ok) throw new Error("upload failed");

    const saved = await saveAttachment(dogId, {
      publicId: upload.params.public_id as string,
      resourceType: upload.resourceType,
      name: file.name,
      folderId,
    });
    if (saved.error) throw new Error(saved.error);
  }

  async function uploadFiles(files: File[], folderId: string | null = null) {
    if (files.length === 0 || busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    setError(null);
    const failed: string[] = [];
    for (const [index, file] of files.entries()) {
      setStatus(`Uploading ${index + 1} of ${files.length}: ${file.name}`);
      try {
        await uploadOne(file, folderId);
      } catch (e) {
        // Messages from uploadOne are ours; anything else (e.g. a dropped connection) is generic
        const message = e instanceof Error && e.message ? e.message : GENERIC_ERROR;
        failed.push(`${file.name} (${message})`);
      }
    }
    setStatus(null);
    busyRef.current = false;
    setBusy(false);
    if (failed.length > 0) setError(`Not uploaded: ${failed.join("; ")}`);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  // Dropping a file from the computer is caught for the whole page: otherwise the browser
  // opens the file in place of the profile if you miss the upload zone.
  const uploadRef = useRef(uploadFiles);
  useEffect(() => {
    uploadRef.current = uploadFiles;
  });
  useEffect(() => {
    const isFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files") ?? false;
    const section = () => rootRef.current?.closest("details") ?? rootRef.current;
    const inSection = (event: DragEvent) =>
      event.target instanceof Node && (section()?.contains(event.target) ?? false);

    function onDragOver(event: DragEvent) {
      if (!isFiles(event)) return;
      event.preventDefault();
      const inside = inSection(event);
      if (event.dataTransfer) event.dataTransfer.dropEffect = inside ? "copy" : "none";
      setDragging(inside);
    }
    function onDragLeave(event: DragEvent) {
      if (event.relatedTarget === null) setDragging(false); // the cursor left the window
    }
    function onDrop(event: DragEvent) {
      if (!isFiles(event)) return;
      event.preventDefault();
      setDragging(false);
      if (!inSection(event)) return;
      const folder = (event.target as Element).closest?.("[data-folder-id]") as HTMLElement | null;
      void uploadRef.current(Array.from(event.dataTransfer?.files ?? []), folder?.dataset.folderId ?? null);
    }

    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  return (
    <div ref={rootRef} className="flex flex-col gap-2">
      <div
        className={`flex flex-col items-center gap-2 rounded-md border-2 border-dashed p-6 text-center text-sm ${
          dragging ? "border-[#ff964f] bg-[#fbe4cf]" : "border-[#fbe4cf] bg-white"
        } ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <p className="text-zinc-700">Drop files here (or straight onto a folder)</p>
        <label className="cursor-pointer rounded-md bg-[#ff964f] px-4 py-2 font-medium text-white hover:bg-[#f2803a]">
          + Choose files
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT}
            disabled={busy}
            onChange={(event) => void uploadFiles(Array.from(event.target.files ?? []))}
            className="hidden"
          />
        </label>
        <p className="text-xs text-zinc-500">Photos, PDF and Word, up to 10 MB each.</p>
      </div>
      {status && <p className="text-sm text-zinc-700">{status}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
