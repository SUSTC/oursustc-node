PATH := ./node_modules/.bin:$(PATH)

env := development

default: npm clean build

node_modules: package.json
	npm install

npm: node_modules

js:
	uglifyjs public/static/js/global.js -c -o public/static/js/global.min.js
	cat public/static/js/jquery-1.10.2.min.js public/static/js/semantic.min.js public/static/js/global.min.js > all.min.js

css:
	cat public/static/css/semantic.min.css public/static/css/semantic-theme.css public/static/css/global.css public/static/css/bundle.css public/static/css/user.css public/static/css/layout.css | cleancss -o public/static/css/all.min.css

clean:
	rm -rf public/static/js/global.min.js
	rm -rf public/static/js/all.min.js
	rm -rf public/static/css/all.min.css

build: js css

.PHONY: default npm clean build
