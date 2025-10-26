from PIL import Image
import os

png_files = [f for f in os.listdir('public') if f.endswith('.png')]
for filename in sorted(png_files):
    try:
        img = Image.open(f'public/{filename}')
        print(f'{filename}: {img.size[0]}x{img.size[1]} ({img.mode})')
    except Exception as e:
        print(f'{filename}: Error - {e}')
