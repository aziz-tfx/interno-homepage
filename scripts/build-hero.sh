#!/usr/bin/env bash
# Сборка ассетов hero из исходных переходов Higgsfield.
#
#   scripts/build-hero.sh <папка с исходниками>
#
# В папке лежат t1-d.mp4 … t7-d.mp4 (16:9) и t1-m.mp4 … t7-m.mp4 (9:16):
# t{k} — переход из сцены k-1 в сцену k (s0 — пустая коробка, s1…s7 — направления).
# Скрипт сжимает видео для сайта в MP4 (H.264) и WebM (VP9, легче — берут браузеры, которые его умеют),
# без звука, и вырезает кадры-заглушки
# из тех же видео, чтобы заглушка совпадала с первым/последним кадром перехода.
set -euo pipefail
src=${1:?укажите папку с исходниками}
out=$(dirname "$0")/../assets/hero
mkdir -p "$out"

enc() { # вход, выход без расширения, ширина
  ffmpeg -v error -y -i "$1" -an -vf "scale=$3:-2" -c:v libx264 -preset slow -crf 27 \
    -pix_fmt yuv420p -movflags +faststart "$2.mp4"
  ffmpeg -v error -y -i "$1" -an -vf "scale=$3:-2" -c:v libvpx-vp9 -crf 37 -b:v 0 -row-mt 1 \
    -deadline good -cpu-used 2 -pix_fmt yuv420p "$2.webm"
}
frame() { # видео, выход, ширина, first|last
  local seek=(); [ "$4" = last ] && seek=(-sseof -0.05)
  ffmpeg -v error -y "${seek[@]}" -i "$1" -frames:v 1 -vf "scale=$3:-2" -q:v 3 "$2"
}

for v in d m; do
  w=1920; pw=1920; [ "$v" = m ] && { w=720; pw=1080; }  # постеры мобилки крупнее — их же показывают полосы направлений
  for k in 1 2 3 4 5 6 7; do
    f="$src/t$k-$v.mp4"
    [ -f "$f" ] || { echo "нет $f — пропускаю"; continue; }
    enc "$f" "$out/t$k-$v" "$w"
    [ "$k" = 1 ] && frame "$f" "$out/s0-$v.jpg" "$pw" first
    frame "$f" "$out/s$k-$v.jpg" "$pw" last
  done
done
ls -la "$out"
