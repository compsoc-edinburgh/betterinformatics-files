import { Card, Modal, PlusIcon } from "@vseth/components";
import React, { useState } from "react";
import { useDocuments } from "../api/hooks";
import CreateDocumentForm from "./create-document-modal";
import Grid from "./grid";
import TooltipButton from "./TooltipButton";
import DocumentCard from "./document-card";

interface Props {
  slug: string;
}

const DocumentList: React.FC<Props> = ({ slug }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [documents] = useDocuments(slug);
  return (
    <>
      <Modal isOpen={isOpen} toggle={() => setIsOpen(r => !r)}>
        <CreateDocumentForm
          categorySlug={slug}
          toggle={() => setIsOpen(r => !r)}
        />
      </Modal>

      <Grid>
        {documents &&
          documents.map(document => (
            <DocumentCard key={document.slug} document={document} />
          ))}
        <Card style={{ minHeight: "4em" }}>
          <TooltipButton
            tooltip="Add a new document"
            onClick={() => setIsOpen(true)}
            className="position-cover w-100"
          >
            <PlusIcon size={40} className="m-auto" />
          </TooltipButton>
        </Card>
      </Grid>
    </>
  );
};
export default DocumentList;
