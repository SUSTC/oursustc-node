cd static/css
del all.css
type semantic.min.css semantic-theme.css layout.css user.css > all.css
cleancss -o all.min.css all.css