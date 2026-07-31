# Changelog

## v2026.08.01

(This release is based on upstream v2026.07.p1)

### Things that affect you

- Answer and comment drafts are now saved in browser storage (!696)
- You can no longer flag your own answers (!704)
- Transcripts (and exams, for admins) can be uploaded directly to a course (!720)
- Removed the limit on uploadable file extensions (!709, !729)
- Ownership of document bundles can now be transferred between users (!172, !387, !708)
- You can now pin courses on the homepage (!725)
- Badges across the app are no longer bugged (!722, !738)
- "This answer may be AI-generated" only appears after 3 user reports (!703)
- Overhaul of how changelogs are displayed (!751)

### Behind the scenes

- Reduce initial JavaScript size slightly (!684, !733, !741)
- Improve developer local environment setup (!674, !698, !739)
- Adapt to VSETH authentication changes (!688)
- Upgrade Django from 4.1 to 5.2, Python from 3.9 to 3.12 (!685)
- Use ruff as the backend code formatter (!686, !689, !699)
- Fix storage filling up with unreferenced images (!667)
- Rewrote Documents API to be OpenAPI-compliant (!716, !728, !745)
- Improve unit test robustness (!700)
- Fix an instance of N+1 queries in backend SQL (!707)
- Autogenerate frontend code from backend contracts (!693, !710, !711)
- Clean up frontend code (!715, !717, !706, !723)
- Use the React Compiler for optimizations (!721)
- Improved URL generation when naming documents with umlauts (!730)
- Minor bug fixes (!726, !692, !734, !752, !753)

Many thanks to contributors Luca, Burak, Yuto, Jacques, Severin, Carole, and Demir.

## v2026.06.15

- Show number of active student users in stats page ([\#118](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/118))
- Show standard deviation in grades using error bars ([\#117](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/117))
- Fix AnswerSection stats not calculating minimum per section ([\#116](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/116))

## v2026.06.01-2

- Hotfix for "Internal Server Error" introduced in v2026.06.01-1 ([\#113](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/113))

## v2026.06.01-1

- Improve performance of site-wide stat calculation ([\#110](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/110))

## v2026.06.01

- Fix noncompliance of privacy policy with UK GDPR ([\#108](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/108))
- Fix scroll bar showing up when clicking on category page tabs ([\#101](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/101))
- Switch from @mantine/charts to Apache ECharts for charts ([\#107](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/107))
- Make navigation bar slim to save screen space ([\#105](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/105))
- More CI improvements for automatic releases ([\#102](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/102)) ([\#103](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/103)) ([\#104](https://github.com/compsoc-edinburgh/betterinformatics-files/pull/104))

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
