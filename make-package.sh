set -ex

export name=$(jq -r '.name | gsub(" "; "-") | ascii_downcase' manifest.json)
export version=$(jq -r '.version' manifest.json)

mkdir -p 'dist'
apack "dist/${name:?}-${version:?}.zip" . -- --exclude '/.*' '/dist/*'
