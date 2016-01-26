#!/bin/bash
cd ./static/js
uglifyjs global.js -c -o global.min.js

#rm -f all.min.js
cat jquery-1.9.1.min.js > all.min.js
echo -e "\n" >> all.min.js
cat bootstrap.min.js >> all.min.js
echo -e "\n" >> all.min.js
cat global.min.js >> all.min.js
