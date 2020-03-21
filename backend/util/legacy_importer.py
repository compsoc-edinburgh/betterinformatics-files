import urllib.request
import html
import html.parser
import re
import sys

SOURCE_RE = re.compile("<textarea.*?>(.*?)</textarea>", re.DOTALL)


class VISkiParser(html.parser.HTMLParser):

    result = ""
    indentation = ""
    listtype = []
    inmath = False
    incode = False
    headerCount = 0

    def error(self, message):
        pass

    def handle_starttag(self, tag, attrs):
        if tag == "ol" or tag == "ul":
            self.indentation += "  "
            listtype = "*  "
            if tag == "ol":
                listtype = "1. "
            self.listtype.append(listtype)
        elif tag == "li":
            self.result += self.indentation[2:] + self.listtype[-1]
            self.indentation += "  "
        elif tag == "math":
            self.inmath = True
            self.result += " $"
        elif tag == "br" or tag == "p":
            self.result += "\n\n"
        elif tag == "source" or tag == "pre":
            self.result += "\n```"
            for key, val in attrs:
                if key == "lang":
                    self.result += val
                    break
            self.result += "\n"
            self.incode = True
        elif tag == "table":
            self.result += "\n\n"
        elif tag == "tr":
            pass
        elif tag == "th":
            self.result += " | "
            self.headerCount += 1
        elif tag == "td":
            self.result += " | "
        elif tag == "i":
            self.result += "*"
        elif tag == "b":
            self.result += "**"
        else:
            print("VISki Parser: Unknown tag", tag, file=sys.stderr)

    def handle_endtag(self, tag):
        if tag == "ol" or tag == "ul":
            self.indentation = self.indentation[:-2]
            self.listtype.pop()
        elif tag == "li":
            self.indentation = self.indentation[:-2]
            self.result += "\n"
        elif tag == "math":
            self.inmath = False
            self.result += "$ "
        elif tag == "p":
            self.result += "\n\n"
        elif tag == "source" or tag == "pre":
            self.result += "```\n"
            self.incode = False
        elif tag == "table":
            self.result += "\n\n"
        elif tag == "tr":
            self.result += " |\n"
            for i in range(self.headerCount):
                self.result += "|---"
            if self.headerCount > 0:
                self.result += "|\n"
            self.headerCount = 0
        elif tag == "td":
            pass
        elif tag == "i":
            self.result += "*"
        elif tag == "b":
            self.result += "**"

    def handle_data(self, data):
        lines = list(map(lambda s: s.strip(), data.split("\n")))
        if not data:
            return
        if self.inmath:
            for line in lines:
                self.result += line + " "
        elif self.incode:
            for line in data.split("\n"):
                self.result += line + "\n"
        else:

            def check_header(line):
                if line.startswith("'''") and line.endswith("'''"):
                    self.result += "\n\n#### " + line[3:-3] + "\n"
                    return True
                if line.startswith("====") and line.endswith("===="):
                    self.result += "\n\n### " + line[4:-4] + "\n"
                    return True
                if line.startswith("===") and line.endswith("==="):
                    self.result += "\n\n## " + line[3:-3] + "\n"
                    return True
                if line.startswith("==") and line.endswith("=="):
                    self.result += "\n\n# " + line[2:-2] + "\n"
                    return True
                return False

            for line in lines:
                if not check_header(line):
                    if line:
                        self.result += line + " "
                    else:
                        self.result += "\n"


def get_source(examname):
    with urllib.request.urlopen('https://wiki.vis.ethz.ch/index.php?title={}&action=edit'.format(urllib.request.quote(examname))) as f:
        src_html = f.read().decode('utf-8')
    match = SOURCE_RE.search(src_html)
    src_quoted = match.group(1)
    src = html.unescape(src_quoted)
    return src


def transform_wiki(examname):
    src = get_source(examname)
    parser = VISkiParser()
    parser.feed(src)
    parser.close()
    return parser.result


if __name__ == '__main__':
    with open("legacy.txt") as f:
        parser = VISkiParser()
        parser.feed(f.read())
        parser.close()
        print(parser.result)
