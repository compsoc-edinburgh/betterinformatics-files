import { css } from "@emotion/css";
import { Button } from "@vseth/components";
import useToggle from "../../hooks/useToggle";
import CodeBlock from "../code-block";
import MarkdownText from "../markdown-text";


const EditorMdString = 
`
Answers are rendered with Markdown (specifically following the [CommonMark](https://commonmark.org/) specification).
In the editor, there are buttons that will help you getting started with basic formatting.
You can also preview your rendered contribution at any point.

Note that this message is also written in Markdown.
If you want to see how some of the formatting is generated, you can "toggle source code mode" and see the actual "code" behind it.

This can be done for every answer and comment too, so if you want to format your contribution in the same way someone else did, simply use this to see how they did it.

### Examples and Features
#### Math and Latex
You can also use "Latex" Math symbols in your answers. 
Here are the most import points:
* Most standard operations should be supported.
* You can do inline math, and block math \`$\` and \`$$\` respectively.
* Even align blocks are fully supported!
* Persistent macros can be used throughout one post. See below for more info!
* See full list of supported operations in math mode [here](https://katex.org/docs/supported.html)

As an example, \`$\\int_a^b \\sin x dx$\` generates the following math expression: $\\int_a^b \\sin x dx$.

It is rendered using the \`react-katex\` package, so it fully supports the [Katex](https://github.com/KaTeX/KaTeX) specification. See the list of [supported functions](https://katex.org/docs/supported.html) to get more detail.

$\\gdef\\comment#1{}$
$\\comment{PERSISTENT MACRO DEFINITION IS JUST ABOVE HERE! :)}$
Furthermore, macros can be defined persistently throughout a post using \`$\\gdef...$\`. 
Use source mode to see what is hidden in this answer and how to use it! 
$\\comment{Comment is a persistent macro and is available as command throughout the post!}$

#### Code
You can write \`inline code\` using the backtick symbols \`\` \`inline code\` \`\`. Code Blocks are also supported with \`\`\`\` \`\`\` ... \`\`\` \`\`\`\`: 
\`\`\` 
Note that there must be a new line after the backticks!
This code block also spans multiple lines.
\`\`\`

You can also use syntax highlighting for different languages:
\`\`\`java
class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}
\`\`\`

Toggle source code mode to see how to do this! It makes it much more pleasant for any reader to read your code, so please use it.
`;

const divider = css`
  margin: 1rem;
  opacity: 0.2;
`;
const EditorHelp = () => {
  const [viewSource, toggleViewSource] = useToggle(false);

  return (
    <div>
      {viewSource ? (
        <CodeBlock value={EditorMdString} language="markdown"/>
      ) : (
        <MarkdownText value={EditorMdString} />
      )}

      <hr className={divider}/>
      <Button onClick={toggleViewSource}>Toggle Source Code Mode</Button>
    </div>
  );
};


export default EditorHelp;
