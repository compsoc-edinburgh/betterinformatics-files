import {
  Badge,
  Card,
  CardBody,
  CardTitle,
  Icon,
  ICONS,
  Label,
  LikeFilledIcon,
  LikeIcon,
  Modal,
} from "@vseth/components";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSummaries } from "../api/hooks";
import CreateSummaryForm from "./create-summary-form";
import Grid from "./grid";
import TooltipButton from "./TooltipButton";
interface Props {
  slug: string;
}

const SummaryList: React.FC<Props> = ({ slug }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, loading, summaries] = useSummaries(slug);
  return (
    <>
      <Modal isOpen={isOpen} toggle={() => setIsOpen(r => !r)}>
        <CreateSummaryForm
          categorySlug={slug}
          toggle={() => setIsOpen(r => !r)}
        />
      </Modal>

      <Grid>
        {summaries &&
          summaries.map(summary => (
            <Card key={summary.slug}>
              <CardBody>
                <Link to={`/user/${summary.author}/summary/${summary.slug}`}>
                  <CardTitle tag="h6">{summary.display_name}</CardTitle>
                </Link>
                <div>
                  <Link to={`/user/${summary.author}`} className="text-muted">
                    @{summary.author}
                  </Link>
                  {summary.liked ? (
                    <span className="text-danger ml-2">
                      <LikeFilledIcon className="mr-1" /> {summary.like_count}
                    </span>
                  ) : (
                    <span className="text-muted ml-2">
                      <LikeIcon className="mr-1" /> {summary.like_count}
                    </span>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        <Card style={{ minHeight: "4em" }}>
          <TooltipButton
            tooltip="Add a new summary"
            onClick={() => setIsOpen(true)}
            className="position-cover w-100"
          >
            <Icon icon={ICONS.PLUS} size={40} className="m-auto" />
          </TooltipButton>
        </Card>
      </Grid>
    </>
  );
};
export default SummaryList;
