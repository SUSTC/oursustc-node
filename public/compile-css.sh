#!/bin/bash
cd static/css
rm -f all.css
# remove store.css journal.css
cat semantic.min.css semantic-theme.css global.css bundle.css user.css layout.css > all.css
cleancss -o all.min.css all.css 
