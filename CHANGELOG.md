# Changelog

## v2026.06.01

- Fix noncompliance of privacy policy with UK GDPR ([\#108](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/108))
- Improve Charts: Switch from @mantine/charts to Apache ECharts ([\#107](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/107))
- Fix line endings in some migration files in CRLF to be LF ([\#106](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/106))
- Slimmer navigation bar ([\#105](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/105))
- Fix sed removing preceding character in auto-generated changelog ([\#104](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/104))
- Improve the PR description for auto-generated changelog PRs ([\#103](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/103))
- Fix changelog generator modifying past release entries ([\#102](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/102))
- Fix scroll bar showing up when clicking on category page tabs ([\#101](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/101))

## v2026.05.25

- Improve the dissertation feature ([\#85](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/85))
- CI improvements for automatic releases ([\#96](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/96)) ([\#98](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/98))

## v2026.04.edi2

- Fixed labels overlapping in grade stats graphs (#94)
- Next version onwards will be tagged as vYYYY.MM.DD(-\<id>)

## v2026.04.edi1

- Fixed visual regressions from previous version
- Added last edit time of documents in the course page (by user request)

## v2026.04.edi0

(This release is based on upstream v2026.04.p0)

- Merged all changes from upstream up to and including v2026.04.p0. See below for changelog (#86).

### Added

- "What's New" page (!643)
- Display recently viewed exams on homepage (!668)
- Mark exams as 'Solved' for your own study (!669)
- Score percentiles in user profile page (!518)
- Marking answers as AI-generated for transparency (!626)
- Frontend support for embedding PDFs in markdown (!633)
- Page number input for long PDFs (!493)
- Admins can now reply to feedbacks by users (!661)
- More intelligent file extension renders for documents (!445)
- Delete exam button in modqueue (!652)
- Support for setting homeorg to something other than ethz.ch (!639)
- Support for .xlsx, .csv, .ods document formats (!628)
- Support for Typst files when uploading documents (!618)
- Auto-generated API documentation using Django Ninja (!614)
- Mermaid explanations in supported functions (!617)
- Backend support for official answers in exams (!429)
- Caching parts of the home page improving load times (!545)

### Changed

- Upgrade Yarn from v1 to v4 (!636, !654)
- Upgrade react-router from v5 to v7 (!579, !635)
- Upgrade UI library (Mantine) from v8 to v9 (!658)
- Upgrade dependencies: vite (!620), typescript (!631), pdfjs (!632), react-syntax-highlighter (!670), faro-react (!666)
- Rewrote Images API to be OpenAPI-compliant (!656)
- Migrated Node LTS to v24 (!619)
- Migrated ahooks to v2 (!615)

### Fixed

- Annoying layout shift when cutting exams (!641)
- Pinch-zoom not working on mobile modals (!659)
- Syntax highlighting broken (!660)
- Tons of requests firing off in home page (!664)
- Overflowing text editor icons on mobile (!647)
- Various frontend linter warnings (!629, !630, !673)
- Auth token flagged as expired before expiry time due to timezone offset handling (!612)
- Cannot select text from the source code of supported markdown functions (!616)
- List meta categories getting called separately for each meta category (!623)
- Failing to use refresh token due to not passing the scope variable to Keycloak (!624)

Many thanks to contributors Luca, Yuto, Burak, Severin, Marius, Jacques, Metehan, Bogdan, Clemens, and Emily.

## Previous Changes

The changes before this point were not tagged and don't have a changelog. Check the commit history or pull request history on GitHub for more information.
