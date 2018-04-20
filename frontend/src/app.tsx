import * as React from "react";
import { renderDocument, SectionRenderer } from "./split-render";
import { Section, SectionKind } from "./interfaces";
import Exam from "./exam";
import * as pdfjs from "pdfjs-dist";

const SECTIONS: Section[] = [
  {
    key: 0,
    kind: SectionKind.Answer,
  },
  {
    key: 1,
    kind: SectionKind.Pdf,
    start: {
      page: 1,
      position: 0.2,
    },
    end: {
      page: 1,
      position: 0.5,
    },
  },
];

const WIDTH = 800;

interface State {
  renderer?: SectionRenderer;
}

export default class App extends React.Component<{}, State> {
  state: State = {};

  async componentWillMount() {
    // tslint:disable-next-line:no-any
    const PDFJS: pdfjs.PDFJSStatic = pdfjs as any;
    const pdf = await PDFJS.getDocument("/exam10.pdf");
    this.setState({ renderer: await renderDocument(pdf, WIDTH) });
  }

  render() {
    const { renderer } = this.state;
    if (!renderer) {
      return <div>Loading...</div>;
    }
    return <Exam sections={SECTIONS} renderer={renderer} width={WIDTH} />;
  }
}
