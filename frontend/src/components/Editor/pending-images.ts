import { useCallback, useEffect, useRef, useState } from "react";
import { imageHandler } from "../../api/image-utils";
import { ImageHandle } from "./utils/types";

interface PendingEntry {
  file: File;
  objectUrl: string;
}

/**
 * Defers image uploads until the user submits, so spammed/cancelled pastes
 * don't fill the bucket. Pending images live in a local registry and are
 * previewed via object URLs; flushPendingImages uploads still-referenced
 * ones and rewrites the text with their final filenames.
 */
export function usePendingImages() {
  const registryRef = useRef<Map<string, PendingEntry>>(new Map());
  const [pendingObjectUrls, setPendingObjectUrls] = useState<
    Map<string, string>
  >(new Map());

  const syncObjectUrls = useCallback(() => {
    setPendingObjectUrls(
      new Map([...registryRef.current].map(([id, e]) => [id, e.objectUrl])),
    );
  }, []);

  useEffect(() => {
    const registry = registryRef.current;
    return () => {
      for (const entry of registry.values())
        URL.revokeObjectURL(entry.objectUrl);
    };
  }, []);

  const deferredImageHandler = useCallback(
    (file: File): Promise<ImageHandle> => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const id = `pending:${crypto.randomUUID()}.${ext}`;
      const objectUrl = URL.createObjectURL(file);
      registryRef.current.set(id, { file, objectUrl });
      syncObjectUrls();
      return Promise.resolve({
        name: file.name,
        src: id,
        remove: () => {
          const entry = registryRef.current.get(id);
          if (entry) URL.revokeObjectURL(entry.objectUrl);
          registryRef.current.delete(id);
          syncObjectUrls();
          return Promise.resolve();
        },
      });
    },
    [syncObjectUrls],
  );

  const flushPendingImages = useCallback(
    async (text: string): Promise<string> => {
      const entries = [...registryRef.current].filter(([id]) =>
        text.includes(id),
      );
      if (entries.length === 0) return text;

      const replacements = await Promise.all(
        entries.map(async ([id, entry]) => {
          const { src } = await imageHandler(entry.file);
          URL.revokeObjectURL(entry.objectUrl);
          registryRef.current.delete(id);
          return [id, src] as const;
        }),
      );
      syncObjectUrls();
      return replacements.reduce((t, [id, src]) => t.split(id).join(src), text);
    },
    [syncObjectUrls],
  );

  return { deferredImageHandler, flushPendingImages, pendingObjectUrls };
}
