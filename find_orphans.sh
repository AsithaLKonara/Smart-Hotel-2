#!/bin/bash
orphans=()
for file in $(find app/api -name "route.ts"); do
  raw_path=$(echo "$file" | sed 's|^app||' | sed 's|/route.ts$||')
  search_path=$(echo "$raw_path" | sed -E 's|/\[.*\]||g')
  
  # If search path is just /api, skip to avoid false positives
  if [ "$search_path" = "/api" ]; then continue; fi
  
  # Search for the string in app, components, lib. Exclude app/api directory.
  # We also check if it's used in hooks or services
  count=$(grep -rF "$search_path" app components lib hooks services 2>/dev/null | grep -v "app/api/" | wc -l)
  
  if [ "$count" -eq 0 ]; then
    echo "$raw_path"
  fi
done
