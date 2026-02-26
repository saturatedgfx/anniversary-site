#!/bin/bash
# Media optimization script for anniversary site
# Converts MOV→MP4, compresses images, generates WebP + video posters

set -e

MEDIA_DIR="media"
WEB_DIR="media-web"
PHOTO_DIR="$WEB_DIR/photos"
VIDEO_DIR="$WEB_DIR/videos"

mkdir -p "$PHOTO_DIR" "$VIDEO_DIR"

echo "=== Converting MOV → MP4 ==="

convert_video() {
  local input="$1"
  local output="$2"
  local crf="${3:-23}"
  if [ -f "$output" ]; then
    echo "  SKIP (exists): $output"
    return
  fi
  echo "  Converting: $(basename "$input") → $(basename "$output")"
  ffmpeg -y -i "$input" \
    -c:v libx264 -crf "$crf" -preset fast \
    -c:a aac -b:a 128k \
    -movflags +faststart \
    -vf "scale=-2:720" \
    "$output" 2>/dev/null
}

convert_video "$MEDIA_DIR/IMG_3374.mov"  "$VIDEO_DIR/costa-rica-clip.mp4"
convert_video "$MEDIA_DIR/IMG_3458.MOV"  "$VIDEO_DIR/bowling.mp4"
convert_video "$MEDIA_DIR/IMG_3869.MOV"  "$VIDEO_DIR/bar-crawl.mp4"
convert_video "$MEDIA_DIR/IMG_6572.MOV"  "$VIDEO_DIR/costa-rica-zip.mp4"

echo ""
echo "=== Compressing TikTok MP4 (post-credits) ==="
if [ ! -f "$VIDEO_DIR/post-credits.mp4" ]; then
  echo "  Compressing post-credits video..."
  ffmpeg -y -i "$MEDIA_DIR/v09044g40000c2vah560nroc38lq9le0.mp4" \
    -c:v libx264 -crf 26 -movflags +faststart \
    "$VIDEO_DIR/post-credits.mp4" 2>/dev/null
else
  echo "  SKIP (exists): post-credits.mp4"
fi

echo ""
echo "=== Generating video posters ==="

gen_poster() {
  local input="$1"
  local output="$2"
  if [ -f "$output" ]; then
    echo "  SKIP (exists): $output"
    return
  fi
  echo "  Poster: $(basename "$output")"
  ffmpeg -y -i "$input" -frames:v 1 -q:v 3 "$output" 2>/dev/null
}

gen_poster "$VIDEO_DIR/costa-rica-clip.mp4"  "$VIDEO_DIR/costa-rica-clip-poster.jpg"
gen_poster "$VIDEO_DIR/bowling.mp4"          "$VIDEO_DIR/bowling-poster.jpg"
gen_poster "$VIDEO_DIR/bar-crawl.mp4"        "$VIDEO_DIR/bar-crawl-poster.jpg"
gen_poster "$VIDEO_DIR/costa-rica-zip.mp4"   "$VIDEO_DIR/costa-rica-zip-poster.jpg"
gen_poster "$VIDEO_DIR/post-credits.mp4"     "$VIDEO_DIR/post-credits-poster.jpg"

echo ""
echo "=== Resizing + compressing images ==="

process_image() {
  local input="$1"
  local output_name="$2"
  local jpg_out="$PHOTO_DIR/${output_name}.jpg"
  local webp_out="$PHOTO_DIR/${output_name}.webp"

  if [ -f "$jpg_out" ]; then
    echo "  SKIP (exists): ${output_name}.jpg"
  else
    echo "  Processing: $(basename "$input") → ${output_name}.jpg"
    sips --resampleWidth 1600 "$input" --out "$jpg_out" 2>/dev/null || \
      sips -s format jpeg --resampleWidth 1600 "$input" --out "$jpg_out" 2>/dev/null
  fi

  if [ -f "$webp_out" ]; then
    echo "  SKIP (exists): ${output_name}.webp"
  else
    echo "  WebP: ${output_name}.webp"
    cwebp -q 80 "$jpg_out" -o "$webp_out" 2>/dev/null
  fi
}

# Process all images in moment order
process_image "$MEDIA_DIR/100_0004.JPG"                           "the-beginning"
process_image "$MEDIA_DIR/CleanShot 2026-02-26 at 16.01.31@2x.png" "birthday-videos"
process_image "$MEDIA_DIR/IMG_0530.jpeg"                          "early-days"
process_image "$MEDIA_DIR/IMG_0854.jpeg"                          "big-reveal"
process_image "$MEDIA_DIR/IMG_0869.PNG"                           "toronto-canoeing"
process_image "$MEDIA_DIR/IMG_1147_Original.JPG"                  "before-us-1"
process_image "$MEDIA_DIR/IMG_1330.jpeg"                          "before-us-2"
process_image "$MEDIA_DIR/IMG_1384.jpeg"                          "where-it-started"
process_image "$MEDIA_DIR/IMG_1405.jpeg"                          "after-school"
process_image "$MEDIA_DIR/IMG_2371.jpeg"                          "washington-1"
process_image "$MEDIA_DIR/IMG_2372.jpeg"                          "washington-2"
process_image "$MEDIA_DIR/IMG_2503.jpeg"                          "always-happy"
process_image "$MEDIA_DIR/IMG_2514.jpeg"                          "style-twins-1"
process_image "$MEDIA_DIR/IMG_2528.jpeg"                          "style-twins-2"
process_image "$MEDIA_DIR/IMG_2549.jpeg"                          "princess-1"
process_image "$MEDIA_DIR/IMG_3045.jpeg"                          "princess-2"
process_image "$MEDIA_DIR/IMG_3101.jpeg"                          "princess-3"
process_image "$MEDIA_DIR/IMG_3454.jpeg"                          "bowling"
process_image "$MEDIA_DIR/IMG_3742.jpeg"                          "golf-day"
process_image "$MEDIA_DIR/IMG_3746.jpeg"                          "study-buddies-1"
process_image "$MEDIA_DIR/IMG_3754.jpeg"                          "study-buddies-2"
process_image "$MEDIA_DIR/IMG_3807.jpeg"                          "bar-crawl"
process_image "$MEDIA_DIR/IMG_4863.jpeg"                          "skiing"
process_image "$MEDIA_DIR/IMG_4884.jpeg"                          "pottery-1"
process_image "$MEDIA_DIR/IMG_5364.jpeg"                          "pottery-2"
process_image "$MEDIA_DIR/IMG_5367.jpeg"                          "pottery-3"
process_image "$MEDIA_DIR/IMG_5823.jpeg"                          "your-support"
process_image "$MEDIA_DIR/IMG_5953.jpeg"                          "avianca"
process_image "$MEDIA_DIR/IMG_6193.jpeg"                          "facetime-1"
process_image "$MEDIA_DIR/lp_image (1).jpeg"                      "facetime-2"
process_image "$MEDIA_DIR/IMG_6196.jpeg"                          "costa-rica-1"
process_image "$MEDIA_DIR/IMG_6288.JPG"                           "costa-rica-2"
process_image "$MEDIA_DIR/IMG_6299.jpeg"                          "costa-rica-3"
process_image "$MEDIA_DIR/IMG_6509.JPG"                           "costa-rica-4"
process_image "$MEDIA_DIR/IMG_6698.jpeg"                          "shopping"
process_image "$MEDIA_DIR/IMG_6984.jpeg"                          "milestones-1"
process_image "$MEDIA_DIR/IMG_7026.jpeg"                          "milestones-2"
process_image "$MEDIA_DIR/IMG_7142.jpeg"                          "road-trips-1"
process_image "$MEDIA_DIR/IMG_7154.jpeg"                          "road-trips-2"
process_image "$MEDIA_DIR/IMG_9966_Original.JPG"                  "artsci"
process_image "$MEDIA_DIR/Photo on 2023-03-13 at 7.25 PM #2.jpg" "cute-photos-1"
process_image "$MEDIA_DIR/Photo on 2023-03-13 at 7.27 PM.jpg"    "cute-photos-2"
process_image "$MEDIA_DIR/lp_image (2).jpeg"                      "photo-series-1"
process_image "$MEDIA_DIR/lp_image (3).jpeg"                      "photo-series-2"
process_image "$MEDIA_DIR/lp_image (4).jpeg"                      "photo-series-3"
process_image "$MEDIA_DIR/lp_image (5).jpeg"                      "mini-me"
process_image "$MEDIA_DIR/lp_image (6).jpeg"                      "two-princesses"
process_image "$MEDIA_DIR/lp_image.jpeg"                          "where-everything-started"
process_image "$MEDIA_DIR/pics.png"                               "five-years-one-scroll"
process_image "$MEDIA_DIR/IMG_1783.PNG"                           "surprise"

echo ""
echo "=== Done ==="
echo ""
du -sh "$WEB_DIR"
echo ""
echo "Photos: $(ls "$PHOTO_DIR"/*.jpg 2>/dev/null | wc -l) JPG + $(ls "$PHOTO_DIR"/*.webp 2>/dev/null | wc -l) WebP"
echo "Videos: $(ls "$VIDEO_DIR"/*.mp4 2>/dev/null | wc -l) MP4 + $(ls "$VIDEO_DIR"/*-poster.jpg 2>/dev/null | wc -l) posters"
