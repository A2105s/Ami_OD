from PIL import Image

# Generate maskable icons with full coverage from AmiOD.png
img = Image.open('public/AmiOD.png')
w, h = img.size

# Make it square by padding to max dimension
side = max(w, h)
square_img = Image.new('RGBA', (side, side), (0, 0, 0, 0))
left = (side - w) // 2
top = (side - h) // 2
square_img.paste(img, (left, top))

# Generate 192x192 maskable with white background (full coverage)
mask192 = Image.new('RGB', (192, 192), (255, 255, 255))
logo_192 = square_img.resize((192, 192), Image.Resampling.LANCZOS)
if logo_192.mode == 'RGBA':
    mask192.paste(logo_192, (0, 0), logo_192)
else:
    mask192.paste(logo_192, (0, 0))
mask192.save('public/icon-maskable-192.png')

# Generate 512x512 maskable with white background (full coverage)
mask512 = Image.new('RGB', (512, 512), (255, 255, 255))
logo_512 = square_img.resize((512, 512), Image.Resampling.LANCZOS)
if logo_512.mode == 'RGBA':
    mask512.paste(logo_512, (0, 0), logo_512)
else:
    mask512.paste(logo_512, (0, 0))
mask512.save('public/icon-maskable-512.png')

print('Generated maskable icons with full edge-to-edge coverage')
print('  icon-maskable-192.png')
print('  icon-maskable-512.png')
