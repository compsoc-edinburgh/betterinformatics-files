# Exam Solution Exchange

Setup with visdev test:

1. Create Bucket pdfs on Minio Browser.

2. Start: Depends on what mode you want to run:

    a)  Database based: final version and good for backend updates run with: visdev test .  
    And use verify_pw method for verification in hellovis.py

    b) Without Database: for debugging front end: run with "visdev test ." in this directory, but also run "npm run start" in frontend folder (get there with "cd frontend") to run a static server which directly propagates all updates of the frontend
    Also use dummyVerify method in hellovis.py and don't run a browser with XSS enabled, thus on a mac you would start chrome like: 

> open -a Google\ Chrome --args --disable-web-security --user-data-dir

**When going into production move to real ser.vis and change from dummyVerfiy to verify_pw**

# Feedback Alpha stage
https://hackmd.io/0MMmtHNgTxyRWSGvaG9qkA

## Bugs
* I can upvote my own answers
* Disable "Add answer" during adding of a new answer (or replace the "Fertig button" with it)
* Strategy for malicous cuts
    * Admins müssen irgendwie cuts löschen können
    * Vielleicht ein downvote oder ban system?
* PDF rendering blurry on high-DPI displays
    * Seems to render at traditional DPI, then scale
* Strange stuff: ![Uploading file..._jko083f2x]()


## Styling
* Make answer blocks in a different styling
* Make it clear that comment input field is not an answer field
* Prettier upvote count
* Padding in answer section (the white block)
* Change `Remove` to `Remove answer` and visually make it clearer what exactly it removes
* Clearer structure (which button/label is part of what)
    * Generally need more careful alignment or borders

## Feature requests
* Folders - super important for structuring stuff. E.g. 
```
app
├── exams
│   ├── dmdb
│   │   ├── 2015
│   │   ├── 2016
│   │   └── 2018
│   └── fmfp
│       ├── 2015
│       ├── 2016
│       └── 2017
└── exercises
    ├── dmdb
    │   ├── 2017
    │   │   ├── ex1
    │   │   ├── ex2
    │   │   ├── ex4
    │   │   ├── ex5
    │   │   ├── ex6
    │   │   ├── ex7
    │   │   └── ex8
    │   └── 2018
    │       ├── ex1
    │       ├── ex2
    │       ├── ex3
    │       ├── ex4
    │       ├── ex5
    │       ├── ex6
    │       ├── ex7
    │       └── ex8
    └── fmfp
        ├── 2017
        │   ├── ex1
        │   ├── ex2
        │   ├── ex4
        │   ├── ex5
        │   ├── ex6
        │   ├── ex7
        │   └── ex8
        └── 2018
            └── ex3
```
* Strategy for uploads (e.g. exercises) not done by board
* PDF name (or better exam name) in page title
    * Otherwise tab name `Prüfung` is not helpful
* Live preview always on
* Small documentation
	* Upload new files
	* How to add answer section
* Disable deletion of an answer for normal users if it has enough upvotes or comments?
* Consider a different UI for adding answers
    * For example, after 1s of cursor on pdf show "Click to add answer"
* Possibility to hide ansewers (click to reveal)
    * Maybe "collapse all answers"?
* Zooming
    * Browser zoom actually works, but gets pixelated
* Code blocks 
* Latex blocks that are not inline
* Upload API
	* Give the oportunity to Upload exams/exercises via API 
* Notifications:
	* "Notify me for every activity on this [answer / document / folder]"
* Bilder Upload (ggf mit OCR)
* Profile von Usern mit Punktzahl
	* So könnten wir Belohnungen machen 