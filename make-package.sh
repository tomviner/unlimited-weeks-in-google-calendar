set -ex

mkdir -p dist
export version=$(grep -Po '(?<="version": ")[^"]*(?=",)' manifest.json)
apack "dist/gcal-unlimited-weeks-${version:?}.zip" . -- --exclude '/.*' '/dist/*'
