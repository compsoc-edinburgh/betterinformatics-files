import { HighlightedMatch } from "../interfaces";

export const HighlightedContent: React.FC<{
  content: HighlightedMatch;
  level?: number;
}> = ({ content, level = 0 }) => {
  if (typeof content === "string") {
    if (level > 1) {
      return <mark>{content}</mark>;
    }
    return <span>{content}</span>;
  } else {
    return (
      <>
        {content.map((child, i) => (
          <HighlightedContent key={i} content={child} level={level + 1} />
        ))}
      </>
    );
  }
};
