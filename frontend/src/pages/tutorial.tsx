import * as React from "react";
import { css } from "glamor";
import { useState } from "react";
interface SectionProps {
  backgroundColor?: string;
  background?: string;
  backgroundSize?: string;
}
const sectionStyle = css({
  position: "relative",
  width: "100%",
  height: "100%",
  fontSize: "1.5em",
});
const Section: React.FC<SectionProps> = ({
  children,
  background,
  backgroundColor,
}) => {
  return (
    <div
      style={
        backgroundColor || background === undefined
          ? { backgroundColor: backgroundColor || "white" }
          : {
              backgroundImage: `url('${background}')`,
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
      }
      {...sectionStyle}
    >
      <div
        style={{
          position: "absolute",
          top: "0",
          padding: "2em",
          backgroundColor: "white",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const slideshowStyle = css({
  position: "absolute",
  top: "0",
  left: "0",
  right: "0",
  bottom: "0",
  zIndex: "100000",
  background: "white",
});
const leftPanelStyle = css({
  position: "absolute",
  left: "0",
  top: "0",
  bottom: "0",
  width: "50%",
  zIndex: "100001",
});
const rightPanelStyle = css({
  position: "absolute",
  right: "0",
  top: "0",
  bottom: "0",
  width: "50%",
  zIndex: "100001",
});
interface SlideshowProps {
  children: React.ReactElement<typeof Section>[];
}
const wrappingMod = (a: number, b: number) => ((a % b) + b) % b;
const Slideshow: React.FC<SlideshowProps> = ({ children }) => {
  const [slideNumber, setSlideNumber] = useState(0);
  return (
    <div {...slideshowStyle}>
      <div
        {...leftPanelStyle}
        onClick={() =>
          setSlideNumber(prevNum => wrappingMod(prevNum - 1, children.length))
        }
      />
      <div
        {...rightPanelStyle}
        onClick={() =>
          setSlideNumber(prevNum => wrappingMod(prevNum + 1, children.length))
        }
      />
      {children[slideNumber]}
    </div>
  );
};
const TutorialPage: React.FC<{}> = () => {
  return (
    <Slideshow>
      <Section backgroundColor="#394b59">
        <img
          style={{ background: "none" }}
          alt="VIS Logo"
          src="https://static.vis.ethz.ch/img/spirale_yellow.svg"
        />
        <h1>VIS Community Solutions</h1>
      </Section>
      <Section
        background="static/tutorial/mainpage.png"
        backgroundSize="contain"
      >
        <span>Overview</span>
      </Section>
      <Section
        background="static/tutorial/mainpage-filter.png"
        backgroundSize="contain"
      >
        <span>Filter Courses</span>
      </Section>
      <Section
        background="static/tutorial/category.png"
        backgroundSize="contain"
      >
        <span>Course Overview</span>
      </Section>
      <Section background="static/tutorial/answer.png" backgroundSize="contain">
        <span>Discuss Answers</span>
      </Section>
      <Section
        background="static/tutorial/userprofile.png"
        backgroundSize="contain"
      >
        <span>User Profile</span>
      </Section>
      <Section
        background="static/tutorial/scoreboard.png"
        backgroundSize="contain"
      >
        <span>Scoreboard</span>
      </Section>
      <Section>
        <h2>Migration Party</h2>
      </Section>
      <Section>
        <h2>Migration Party</h2>
        <ul>
          <li>Set cuts</li>
          <li>Set metadata</li>
          <li>Import VISki solutions</li>
        </ul>
        <p>(PDFs are all imported)</p>
      </Section>
      <Section
        background="static/tutorial/importqueue.png"
        backgroundSize="contain"
      >
        <span>Import Queue</span>
      </Section>
      <Section
        background="static/tutorial/metadata.png"
        backgroundSize="contain"
      >
        <span>Metadata</span>
      </Section>
      <Section>
        <h2>Migrate Exam</h2>
        <ol>
          <li>Claim exam in import queue</li>
          <li>Find exam in old exam collection</li>
          <li>
            Check if solutions exists
            <ol>
              <li>If VISki exists, enter URL in meta data</li>
              <li>
                If VISki does not exist,
                <br />
                mark 'Finished Wiki Transfer'
              </li>
              <li>
                If official solution exists,
                <br />
                check if already uploaded
              </li>
            </ol>
          </li>
          <li>Set all cuts (don't need to click exactly)</li>
          <li>Mark 'Finshed cuts' and set public</li>
        </ol>
      </Section>
      <Section>
        <h2>Migrate Exam</h2>
        <p>If exam ≥ 2016 and VISki solution exists</p>
        <ol>
          <li>Open VISki solution</li>
          <li>Open 'Transform VISki to Markdown'</li>
          <li>Copy solutions to the correct question</li>
          <li>Check generated Markdown with VISki</li>
          <li>Mark 'Finished Wiki Transfer'</li>
        </ol>
      </Section>
    </Slideshow>
  );
};
export default TutorialPage;
