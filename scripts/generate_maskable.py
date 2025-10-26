from PIL import Image

# Open and crop to square
img = Image.open('public/AmiOD.png')
w, h = img.size
side = min(w, h)
left = (w - side) // 2
top = (h - side) // 2
sq = img.crop((left, top, left + side, top + side))

# Generate 192x192 maskable (80% safe zone with white background)
mask192 = Image.new('RGB', (192, 192), (255, 255, 255))
logo_size = int(192 * 0.8)
logo = sq.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
offset = (192 - logo_size) // 2
if logo.mode == 'RGBA':
    mask192.paste(logo, (offset, offset), logo)
else:
    mask192.paste(logo, (offset, offset))
mask192.save('public/icon-maskable-192.png')

# Generate 512x512 maskable (80% safe zone with white background)
mask512 = Image.new('RGB', (512, 512), (255, 255, 255))
logo_size_512 = int(512 * 0.8)
logo_512 = sq.resize((logo_size_512, logo_size_512), Image.Resampling.LANCZOS)
offset_512 = (512 - logo_size_512) // 2
if logo_512.mode == 'RGBA':
    mask512.paste(logo_512, (offset_512, offset_512), logo_512)
else:
    mask512.paste(logo_512, (offset_512, offset_512))
mask512.save('public/icon-maskable-512.png')

print('Generated maskable icons (80% safe zone with white background):')
print('  icon-maskable-192.png')
print('  icon-maskable-512.png')
