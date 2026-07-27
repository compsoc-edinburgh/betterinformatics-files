# Changelog

All changes to this project are documented here.

## v2026.07.p0

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
- Minor bug fixes (!726, !692, !734)

Many thanks to contributors Luca, Burak, Yuto, Jacques, Severin, Carole, and Demir.

## v2026.04.p0 - Coding Weekend!

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

### Changed

- Upgrade Yarn from v1 to v4 (!636, !654)
- Upgrade react-router from v6 to v7 (!635)
- Upgrade UI library (Mantine) from v8 to v9 (!658)
- Upgrade dependencies: vite (!620), typescript (!631), pdfjs (!632), react-syntax-highlighter (!670), faro-react (!666)
- Rewrote Images API to be OpenAPI-compliant (!656)

### Fixed

- Annoying layout shift when cutting exams (!641)
- Pinch-zoom not working on mobile modals (!659)
- Syntax highlighting broken (!660)
- Tons of requests firing off in home page (!664)
- Overflowing text editor icons on mobile (!647)
- Various frontend linter warnings (!629, !630, !673)

Many thanks to contributors Luca, Yuto, Burak, Severin, Marius, Jacques, Metehan, Bogdan, Clemens, and Emily.

## v2026.03.p0

### Added

- Support for Typst files when uploading documents (!618)
- Auto-generated API documentation using Django Ninja (!614)
- Mermaid explanations in supported functions (!617)
- Backend support for official answers in exams (!429)
- Caching parts of the home page improving load times (!545)

### Changed

- Migrated Node LTS to v24 (!619)
- Migrated React Router to v6 (!579)
- Migrated ahooks to v2 (!615)

### Fixed

- Auth token flagged as expired before expiry time due to timezone offset handling (!612)
- Cannot select text from the source code of supported markdown functions (!616)
- List meta categories getting called separately for each meta category (!623)
- Failing to use refresh token due to not passing the scope variable to Keycloak (!624)

## Previous Changes

The changes before this point were not tagged and don't have a changelog. Check the commit history for more information.
