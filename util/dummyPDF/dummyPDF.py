#!/usr/bin/env python3

import argparse
import os
import shutil
import subprocess

def generate_content(exam_file):
    def count_indentation(line):
        for i in range(len(line)):
            if line[i] not in [' ', '\t']:
                return i
        return len(line)

    section_names = ['section*', 'subsection*', 'subsubsection*', 'paragraph', 'subparagraph']
    section_content = '\n\n' + r'\begin{center}\dots\end{center}\vspace{1cm}' + '\n\n'

    with open(exam_file) as f:
        lines = [line for line in f]
        title = lines[0]
        date = lines[1]
        lines = lines[2:]
        content = ''
        for line in lines:
            try:
                content += '\\' + section_names[count_indentation(line)] + '{' + line.strip() + '}' + section_content
            except IndexError as e:
                print("Too many levels of indentations! Reduce the number of levels or figure out how to do more levels in LaTeX!")
                raise e
    return title, date, content

def prepare_build(build_dir):
    if os.path.exists(build_dir):
        shutil.rmtree(build_dir)
    os.mkdir(build_dir)
    for f in ['vis_logo.png']:
        shutil.copyfile(f, os.path.join(build_dir, f))

def generate_latex(build_dir, template, content):
    with open (template) as f:
        full_content = f.read()
    for key, value in zip(['title', 'date', 'content'], content):
        full_content = full_content.replace('{{' + key + '}}', value)
    with open(os.path.join(build_dir, 'dummy.tex'), 'w') as f:
        f.write(full_content)

def build_pdf(build_dir):
    old_wd = os.getcwd()
    os.chdir(build_dir)
    subprocess.run(['pdflatex', 'dummy.tex'])
    os.chdir(old_wd)

def finish_build(build_dir, output_file, omit_remove):
    result_file = os.path.join(build_dir, 'dummy.pdf')
    if os.path.exists(result_file):
        shutil.copyfile(result_file, output_file)
        print("Generated PDF:", output_file)
    else:
        print("Could not find generated PDF.")
    if not omit_remove:
        shutil.rmtree(build_dir)

def main():
    parser = argparse.ArgumentParser(description="Generate dummy PDFs for exams which can not be downloaded")
    parser.add_argument('exam_file', help="The file containing the structure of the exam")
    parser.add_argument('--template', default='template.tex', help="LaTeX template for the generated PDF")
    parser.add_argument('--build-dir', default='__build__', help="Temporary directory used to build the PDF")
    parser.add_argument('--output-file', help="Name of the generated PDF")
    parser.add_argument('--omit-remove', action='store_true', help="Omit deleting build directory")
    args = parser.parse_args()
    content = generate_content(args.exam_file)
    prepare_build(args.build_dir)
    generate_latex(args.build_dir, args.template, content)
    build_pdf(args.build_dir)
    finish_build(args.build_dir, args.output_file or (os.path.splitext(args.exam_file)[0] + ".pdf"), args.omit_remove)

if __name__ == '__main__':
    main()
