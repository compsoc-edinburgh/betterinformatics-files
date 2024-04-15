import { Button } from "@mantine/core";
import CodeBlock from "../code-block";
import MarkdownText from "../markdown-text";
import classes from "./EditorHelp.module.css";
import { useDisclosure } from "@mantine/hooks";

const EditorMdString = `
In the editor, there are buttons that will help you getting started with basic formatting.
You can also preview your rendered contribution at any point.

Note that this message is also written in the supported format.
If you want to see how some of the formatting is generated, you can "toggle source code mode" with the button below and see the actual "code" behind it.
This can be done for every answer and comment too, so if you want to format your contribution in the same way someone else did, simply use this to see how they did it.

In the following the specific aspects about **Markdown Basics, Math and Code Blocks** are listed.

### Examples and Features
#### Markdown / Standard Formatting

Answers are rendered with Markdown (specifically following the [CommonMark](https://commonmark.org/) specification).
Here is a quick overview of the most useful markdown features.
| Formatting Operation            | Snippet                                          | Example                                      |
| ------------------------------- | ------------------------------------------------ | -------------------------------------------- |
| Italic Text                     | \`*This text is in italics*\`                      | *This text is in italics*                    |
| Bold Text                       | \`**This text is bold**\`                          | **This text is bold**                        |
| Bold Italic Text                | \`***This text is both***\`                        | ***This text is both***                      |
| Headers                         | \`# This is a header\`                             | Not rendered in tables                       |
| Smaller Headers (1 to 6 \`#\`s)   | \`### This is a smaller header (level 3)\`         | Not rendered in tables                       |
| Bullet List                     | \`* This is a bullet point\`                       | * Not rendered properly in tables            |
| Numbered List                   | \`1. This is a numbered List\`                     | 1. Not rendered properly in tables           |
| Link                            | \`[Link Text](URL)\`                               | [Link Text](#)                               |
| Images                          | \`![Example](/static/editor_help_example.png)\`    | ![Example](/static/editor_help_example.png)  |

Some Remarks:
* This table itself is done purely with markdown. Toggle source code mode to see how it works!
* You need *2 new lines to start a new paragraph*. If you only write a single new line, Markdown will just continue in the same paragraph.
* You can either upload images by copy-pasting or using the upload tool.
* Note the space after bullets or numbered list items.
  * This is an example of a nested bullet list.

#### Math and Latex

Math is rendered using the \`react-katex\` package, so it fully supports the [Katex](https://github.com/KaTeX/KaTeX) specification. 
See the **[list of supported functions](https://katex.org/docs/supported.html)** to get all the details. 
Here are the most important points.

* Most standard operations should be supported. For example, align blocks are fully supported!
* You can do inline math, and block math with \`$...$\` and \`$$...$$\` respectively. Note that block math requires new lines: \`$$\\n <your-math> \\n$$\` where each \`\\n\` should be replaced with an actual new line.
* Persistent macros can be used throughout one post. See below for more info!

As an example, \`$\\int_a^b \\sin x \\, dx$\` generates the following math expression: $\\int_a^b \\sin x \\,dx$, and as block math:
$$
\\int_a^b \\sin x \\, dx
$$
Once again, if you cannot get block math to work, you can toggle source code mode and see for yourself how it's done.

##### Persistent Macros
$\\gdef\\comment#1{}$
$\\gdef\\cent{\\char"00A2}$
$\\gdef\\diff{\\mathop{}\\!\\mathrm{d}}$
$\\comment{PERSISTENT MACRO DEFINITION IS JUST ABOVE HERE! :)}$


**Macros are persistent throughout a post** using \`$\\gdef...$\`.
Declare any commands you may need at the top of your answer and use them in other Math Blocks throughout your answer.

This is often useful in case you need a symbol that isn't predefined in Katex. Just write these definitions once at the top and use the commands multiple times in different blocks.
* The "diff" symbol in integrals, that can be defined like this: \`$\\gdef\\diff{\\mathop{}\\!\\mathrm{d}}$\`. You can then use it in integrals: $\\int_a^b \\sin x \\diff x$. Probably the most widely used example!
* The "cent" symbol: \`\\gdef\\cent{\\char"00A2}\`. Now use \`$\\cent$\` in the post to get $\\cent$.

Use source mode to see what is hidden in this answer and for one more example to define a \`\\comment\` command! 
This is occasionally useful to hide e.g. Matlab code to check correctness of a solution.
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

const EditorHelp = () => {
  const [viewSource, {toggle: toggleViewSource}] = useDisclosure();

  return (
    <div>
      {viewSource ? (
        <CodeBlock value={EditorMdString} />
      ) : (
        <MarkdownText value={EditorMdString} />
      )}

      <hr className={classes.divider} />
      <Button onClick={toggleViewSource}>Toggle Source Code Mode</Button>
    </div>
  );
};

export default EditorHelp;
