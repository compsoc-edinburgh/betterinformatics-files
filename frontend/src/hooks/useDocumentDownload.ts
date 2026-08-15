import { useState, useEffect, useCallback } from "react";
import { download } from "../api/fetch-utils";
import { downloadZipFile, type ZipFileItem } from "../utils/download-zip-file";
import type { DocumentSchema } from "../api/model/documentSchema";

export const useDocumentDownload = (doc: DocumentSchema | undefined) => {
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const files = doc.files!;

      if (files.length === 0) return;
      if (files.length === 1) {
        download(`/api/document/${doc.slug}/file/${files[0].filename}`);
        setIsLoading(false);
        return;
      }

      const zipFileItems = files.map(
        async (file): Promise<ZipFileItem | undefined> => {
          const controller = new AbortController();
          controllers.push(controller);

          const response = await fetch(
            `/api/document/${doc.slug}/file/${file.filename}`,
            {
              signal: controller.signal,
            },
          ).catch((e: unknown) => {
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
