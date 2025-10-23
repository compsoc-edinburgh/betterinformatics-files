import { Collapse, Group } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import TooltipButton from "./TooltipButton";

interface Props {
  title: React.ReactNode;
  contentOutsideCollapse: React.ReactNode;
  contentInsideCollapse: React.ReactNode;
  is_collapsed: () => Boolean;
  collapse_expand: () => void;
}

const CollapseWrapper: React.FC<Props> = ({title, contentInsideCollapse, contentOutsideCollapse, is_collapsed, collapse_expand}) => {
  return (
  <>
    <Group
      gap="md"
      justify="space-between"
    >
      <Group>
          {title}
          <TooltipButton
            variant={"transparent"}
            size={"compact-sm"}
            color={"text"}
            tooltip={`${is_collapsed() ? "Expand" : "Collapse"}`}
            onClick={() => {collapse_expand()}}>
            {is_collapsed() ? <IconChevronDown/> : <IconChevronUp/>}
          </TooltipButton>
      </Group>
          {contentOutsideCollapse}
    </Group>
    <Collapse in={!is_collapsed()}>
      {contentInsideCollapse}
    </Collapse>
  </>);
} 
export default CollapseWrapper;