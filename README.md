# Exam Solution Exchange

Setup with visdev test:

1. Create Bucket pdfs on Minio Browser.
2. Check in what mode you want to run:
    a)  Database based: final version and good for backend updates run with: visdev test .  
        might have to add the line:     window.__cuts__ = {{cuts|tojson|safe}};
    b) Without Database: for debugging front end: run with "visdev test ." but also run "npm run start" in frontend folder to run a static server which directly propagates all updates of the frontend
    might need to remove line:     window.__cuts__ = {{cuts|tojson|safe}};

