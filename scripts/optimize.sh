#!/usr/bin/env bash
# Reduce screenshots to 256-colour PNG (≈ half the size, text stays sharp). Needs ffmpeg.
# usage: optimize.sh <imagesDir>
set -e
DIR="${1:?usage: optimize.sh <imagesDir>}"
for f in "$DIR"/*.png; do
  ffmpeg -loglevel error -y -i "$f" -vf "split[a][b];[a]palettegen=max_colors=256:stats_mode=full[p];[b][p]paletteuse=dither=none" -pix_fmt pal8 "$f.tmp.png"
  mv "$f.tmp.png" "$f"
done
du -sh "$DIR"
