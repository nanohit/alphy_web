#!/bin/sh
# Usage: ./release.sh 1.0.1
# Pins index.html to the new tag, commits, then pushes the commit and the tag together,
# so jsDelivr can serve cdn/@1.0.1 as soon as Vercel redeploys the bootstrap.
set -eu
v="${1:?usage: ./release.sh <version>}"
perl -pi -e 's/\(document, "[^"]+"\)/(document, "'"$v"'")/' index.html
git add index.html cdn
git commit -m "Release $v"
git tag "$v"
git push --atomic origin HEAD "$v"
