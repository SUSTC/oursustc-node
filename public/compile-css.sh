#!/bin/bash
cd static/css
rm -f all.css
cat bootstrap.min.css bootstrap-responsive.min.css global.css bundle.css user.css store.css journal.css layout.css > all.css
cleancss -o all.min.css all.css 
