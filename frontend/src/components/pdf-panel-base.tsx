import {
  Button,
  Slider,
  Pagination,
  Stack,
  Title,
  Text,
} from "@mantine/core";
import { useDebounceFn } from "@umijs/hooks";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PDF from "../pdf/pdf-renderer";
import IconButton from "./icon-button";
import Panel from "./panel";
import {
  IconArrowUp,
} from "@tabler/icons-react";

interface PdfPanelBaseProps {
  isOpen: boolean;
  toggle: () => void;
  renderer?: PDF;

  title?: string;
  subtitle?: string;

  inViewPages?: Set<number>;
  
  /**
   * Use this to limit the pagination to only the specified pages.
   */
  visiblePages?: Set<number>;

  /**
   * The initial width of the document
   */
  maxWidth: number;
  /**
   * Function to set the width of the document
   */
  setMaxWidth: (newWidth: number) => void;

  /**
   * Additional action buttons to be displayed in a Button.Group component
   */
  additionalActions?: React.ReactNode[];

  children?: React.ReactNode;
}

/**
 * A panel component for controlling the display of a PDF document. Shows
 * a pagination component, a zoom control, and jump-to-top button by default.
 * Use `additionalActions` to add more IconButtons to the panel.
 * Any child components will be rendered below the document controls.
 */
const PdfPanelBase: React.FC<PdfPanelBaseProps> = ({
  isOpen,
  toggle,
  renderer,

  title,
  subtitle,

  inViewPages,
  visiblePages,

  maxWidth,
  setMaxWidth,

  additionalActions,

  children,
}) => {
  // Keep track of the current width value represented by the slider
  const [widthValue, setWidthValue] = useState(maxWidth);

  // Create a wrapper function that debounces the document width change
  const { run: changeWidth } = useDebounceFn(
    (val: number) => setMaxWidth(val),
    500,
  );
  const handler = (val: number) => {
    // On slider change, update the state and call the debounced function
    setWidthValue(val);
    changeWidth(val);
  };
  const scrollToTop = useCallback(() => {
    const c = document.documentElement.scrollTop || document.body.scrollTop;
    if (c > 0) {
      window.requestAnimationFrame(scrollToTop);
      window.scrollTo(0, c - c / 10 - 1);
    } else {
      toggle();
    }
  }, [toggle]);


  const inViewPage = useMemo(
    () => {
      return inViewPages ? Math.min(...Array.from(inViewPages)) : undefined
    }
  , [inViewPages])  

  return (
    <Panel isOpen={isOpen} toggle={toggle}>
      <Stack gap="xs">
        {title && (
          <div>
            <Title order={2}>{title}</Title>
            {subtitle && (
              <Text size="sm" fs="italic">
                {subtitle}
              </Text>
            )}
          </div>
        )}
        <Title order={6}>Pages</Title>
        {!!renderer && (
          <Pagination
            value={inViewPage}
            total={visiblePages?.size || renderer.document.numPages}
            getItemProps={page => ({
              component: "a",
              // #page-n will be the nth page that is shown in the screen, not
              // the nth page in the PDF document.
              href: `#page-${page}`,
            })}
            withControls={false}
          />
        )}
        <Title order={6}>Size</Title>
        <Slider
          label={null}
          min={500}
          max={2000}
          value={widthValue}
          onChange={handler}
        />
        <Title order={6}>Actions</Title>
        <Button.Group>
          <IconButton
            tooltip="Back to the top"
            icon={<IconArrowUp />}
            onClick={scrollToTop}
          />
          {additionalActions?.map((action, index) => (
            <React.Fragment key={index}>{action}</React.Fragment>
          ))}
        </Button.Group>
        {children}
      </Stack>
    </Panel>
  );
};
export default PdfPanelBase;
