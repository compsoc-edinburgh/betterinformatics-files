import React from "react";
import { PageResponse } from "../api/model";
import { ExtremelyTrustedHTML } from "./extremely-trusted-html";
import MarkdownText from "./markdown-text";
import styles from "./page-article-content.module.css";

export const PageArticleContent: React.FC<{
  page: PageResponse;
}> = ({ page }) => {
  return (
    <div className={styles.pageArticleContent}>
      {page.kind === "static_html" ? (
        <ExtremelyTrustedHTML
          html={page.content.trim() || "Nothing here yet."}
        />
      ) : (
        <MarkdownText
          value={
            page.content.trim() ||
            "*Nothing here yet. But everyone can write here! Click 'edit'!*"
          }
          addAnchors={true}
          localLinkBase="https://betterinformatics.com"
          ignoreHtml={true}
        />
      )}
    </div>
  );
};
