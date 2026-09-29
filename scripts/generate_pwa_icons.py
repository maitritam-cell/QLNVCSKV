import zlib
import struct
import math
import os

def create_png(width, height, pixel_func, output_path):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0 (None)
        for x in range(width):
            r, g, b, a = pixel_func(x, y, width, height)
            raw_data.extend([int(r) & 0xff, int(g) & 0xff, int(b) & 0xff, int(a) & 0xff])
    
    compressed = zlib.compress(bytes(raw_data), 9)
    
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    png.extend(struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc))
    
    # IDAT
    idat_crc = zlib.crc32(b'IDAT' + compressed)
    png.extend(struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc))
    
    # IEND
    iend_crc = zlib.crc32(b'IEND')
    png.extend(struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc))
    
    with open(output_path, 'wb') as f:
        f.write(png)
    print(f"Generated {output_path} ({width}x{height})")

def point_in_polygon(px, py, poly):
    inside = False
    n = len(poly)
    p1x, p1y = poly[0]
    for i in range(1, n + 1):
        p2x, p2y = poly[i % n]
        if min(p1y, p2y) < py <= max(p1y, p2y):
            if px <= max(p1x, p2x):
                if p1y != p2y:
                    xinters = (py - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                if p1x == p2x or px <= xinters:
                    inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def get_star_poly(cx, cy, r_outer, r_inner):
    poly = []
    for i in range(10):
        angle = -math.pi / 2 + i * math.pi / 5
        r = r_outer if i % 2 == 0 else r_inner
        poly.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    return poly

def is_inside_shield(nx, ny):
    # normalized coordinates [-1, 1] horizontally, [0, 1] vertically
    if ny < 0 or ny > 1.0:
        return False
    ax = abs(nx)
    if ax > 0.85:
        return False
    # Top peak to shoulder
    if ny < 0.12:
        max_y = 0.12 - ax * 0.10
        if ny < 0.05 + (1 - ax) * 0.07:
            pass
    # Side curvature towards bottom tip
    if ny >= 0.12:
        # width narrows down as ny approaches 1.0
        allowed_w = 0.85 * (1.0 - ((ny - 0.12) / 0.88) ** 1.8)
        if ax > allowed_w:
            return False
    return True

def icon_pixel(x, y, w, h, is_maskable=False):
    if is_maskable:
        # Full bleed dark crimson background
        bg_r, bg_g, bg_b = 136, 19, 19
        bg_r2, bg_g2, bg_b2 = 69, 10, 10
        t = y / h
        cur_r = int(bg_r * (1 - t) + bg_r2 * t)
        cur_g = int(bg_g * (1 - t) + bg_g2 * t)
        cur_b = int(bg_b * (1 - t) + bg_b2 * t)
        
        # Center shield in safe 72% zone
        cx, cy = w / 2.0, h / 2.0
        scale = 0.72
        sx = (x - cx) / (scale * w / 2.0)
        sy = (y - (cy - 0.04 * h)) / (scale * h) + 0.5
    else:
        # Transparent background outside shield
        cx, cy = w / 2.0, h / 2.0
        sx = (x - cx) / (w * 0.46)
        sy = y / float(h)
        cur_r, cur_g, cur_b, cur_a = 0, 0, 0, 0

    star_poly = get_star_poly(w / 2.0, h * (0.47 if is_maskable else 0.44), w * (0.16 if is_maskable else 0.22), w * (0.07 if is_maskable else 0.10))

    in_shield = is_inside_shield(sx, sy)

    if in_shield:
        # Shield fill gradient (Crimson red)
        t_shield = sy
        sr = int(220 * (1 - t_shield * 0.5))
        sg = int(28 * (1 - t_shield * 0.3))
        sb = int(28 * (1 - t_shield * 0.2))

        # Check gold border
        border_shield = not is_inside_shield(sx * 1.08, sy * 1.08)
        if border_shield:
            return 251, 191, 36, 255  # Gold border

        # Check Star
        if point_in_polygon(x, y, star_poly):
            # Gold Star gradient
            dist_c = math.sqrt((x - w/2.0)**2 + (y - h*(0.47 if is_maskable else 0.44))**2) / (w * 0.2)
            dist_c = min(1.0, max(0.0, dist_c))
            gr = int(254 * (1 - dist_c * 0.15))
            gg = int(240 * (1 - dist_c * 0.25))
            gb = int(138 * (1 - dist_c * 0.7))
            return gr, gg, gb, 255

        return sr, sg, sb, 255
    else:
        if is_maskable:
            return cur_r, cur_g, cur_b, 255
        else:
            return 0, 0, 0, 0

os.makedirs('public', exist_ok=True)

# Generate standard icons
create_png(192, 192, lambda x, y, w, h: icon_pixel(x, y, w, h, False), 'public/pwa-192x192.png')
create_png(512, 512, lambda x, y, w, h: icon_pixel(x, y, w, h, False), 'public/pwa-512x512.png')
create_png(180, 180, lambda x, y, w, h: icon_pixel(x, y, w, h, False), 'public/apple-touch-icon.png')
create_png(512, 512, lambda x, y, w, h: icon_pixel(x, y, w, h, True), 'public/pwa-maskable-512x512.png')

# Create favicon.ico (can copy 180x180 or write a 32x32)
create_png(32, 32, lambda x, y, w, h: icon_pixel(x, y, w, h, False), 'public/favicon.ico')
print("All PWA icons generated successfully!")
