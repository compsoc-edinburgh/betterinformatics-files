import { useState, useEffect, useCallback } from "react";
import { download } from "../api/fetch-utils";
import { Document } from "../interfaces";
import {
  downloadZipFile,
  type ZipFileItem,
} from "../utils/download-zip-file.js";

export const useDocumentDownload = (doc: Document | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (doc === undefined) return;
    if (!isLoading) return;
    const controllers: AbortController[] = [];
    let cancel = false;

    const abort = () => {
      cancel = true;
      for (const controller of controllers) {
        controller.abort();
      }
    };

    void (async () => {
      if (doc.files.length === 0) return;
      if (doc.files.length === 1) {
        download(`/api/document/file/${doc.files[0].filename}`);
        setIsLoading(false);
        return;
      }

      const zipFileItems = doc.files.map(
        async (file): Promise<ZipFileItem | undefined> => {
          const controller = new AbortController();
          controllers.push(controller);

          const response = await fetch(`/api/document/file/${file.filename}`, {
            signal: controller.signal,
          }).catch((e: unknown) => {
            if (e instanceof DOMException && e.name === "AbortError") return;
            console.error(e);
            abort();
          });
          if (cancel) return;
          if (response === undefined) return;

          return {
            displayName: file.display_name,
            filename: file.filename,
            file: response.arrayBuffer(),
          };
        },
      );

      const name = `${doc.display_name}.zip`;
      await downloadZipFile(name, zipFileItems);
      setIsLoading(false);
    })();

    return abort;
  }, [isLoading, doc]);
  const startDownload = useCallback(() => setIsLoading(true), []);
  return [isLoading, startDownload] as const;
};
