set -x -e

# Push updated filter lists to the repo (without patches).
git status
git add report.txt
git add filters
git add platforms
git diff-index --quiet HEAD || git commit -m "skip ci. build from $(date)"
git push origin master
