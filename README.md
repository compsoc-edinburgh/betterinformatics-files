# Exam Solution Exchange

Setup with visdev test:

1. Create Bucket pdfs on Minio Browser.
2. Start: Depends on what mode you want to run:
    a)  Database based: final version and good for backend updates run with: visdev test .  
    And use verify_pw method for verification in hellovis.py
    b) Without Database: for debugging front end: run with "visdev test ." in this directory, but also run "npm run start" in frontend folder (get there with "cd frontend") to run a static server which directly propagates all updates of the frontend
    Also use dummyVerify method in hellovis.py and don't run a browser with XSS enabled, thus on a mac you would start chrome like: 

> open -a Google\ Chrome --args --disable-web-security --user-data-dir

