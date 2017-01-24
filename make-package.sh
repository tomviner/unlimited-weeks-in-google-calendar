set -ex

mkdir -p dist
export version=$(grep -Po '(?<="version": ")[^"]*(?=",)' manifest.json)
echo "$version"
apack "dist/gcal-unlimited-weeks-${version:?}.zip" .
