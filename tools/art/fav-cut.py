# fav-cut.py — the browser tab icon: Quill's head cut from raw/mascot-point.png, outlined in plum and rimmed in white like
# the other stickers, on no background (owner, 4 Oct: Bizzing Bee's tab icon has no square). Painted art could not be
# made that day (the image model's credits had run out), so this cut stands in; write face-512.png down to
# app/public/icons/favicon-32.png and favicon-64.png.
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops
SP='/tmp/fav-'   
im=Image.open('/home/user/Bizzing_English/tools/art/raw/mascot-point.png').convert('RGB')
W,H=im.size; px=im.load()
# the ground: flood from the corners over magenta, its pink blends and the white sticker rim, so the fox is
# its plum-outlined shape only (the quill, eyes and teeth are inside the outline and are kept)
def ground(p):
  r,g,b=p
  return (r>150 and b>130 and g<175) or (r>212 and g>212 and b>212)
bg=bytearray(W*H); stack=[(0,0),(W-1,0),(0,H-1),(W-1,H-1)]
while stack:
  x,y=stack.pop()
  if x<0 or y<0 or x>=W or y>=H: continue
  i=y*W+x
  if bg[i] or not ground(px[x,y]): continue
  bg[i]=1; stack.extend(((x+1,y),(x-1,y),(x,y+1),(x,y-1)))
fox=Image.frombytes('L',(W,H),bytes(0 if v else 255 for v in bg))
# the head: the face, ears and quill, cut along the jaw and clear of the pointing arm
R=Image.new('L',(W,H),0); d=ImageDraw.Draw(R)
d.polygon([(262,470),(240,400),(250,330),(290,250),(285,95),(380,120),(440,175),(560,165),(640,140),(720,90),(870,95),(800,230),(700,330),(715,420),(690,480),(640,515),(560,540),(470,548),(380,535),(310,510)], fill=255)
M=ImageChops.multiply(fox,R).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
# a white sticker rim round the new silhouette, as the original has
plum=M.filter(ImageFilter.MaxFilter(13)); rim=plum.filter(ImageFilter.MaxFilter(25))
out=Image.new('RGBA',(W,H),(0,0,0,0))
out.paste(Image.new('RGBA',(W,H),(255,255,255,255)),(0,0),rim.filter(ImageFilter.GaussianBlur(1)))
out.paste(Image.new('RGBA',(W,H),(74,28,44,255)),(0,0),plum.filter(ImageFilter.GaussianBlur(1)))
src=im.convert('RGBA'); out.paste(src,(0,0),M)
bb=out.getbbox(); out=out.crop(bb); w,h=out.size; s=max(w,h)+8
sq=Image.new('RGBA',(s,s),(0,0,0,0)); sq.paste(out,((s-w)//2,(s-h)//2))
sq.resize((512,512),Image.LANCZOS).save(SP+'face-512.png')
prev=Image.new('RGBA',(512,256),(222,232,214,255))
for i,(n,bg) in enumerate([(32,(222,232,214,255)),(32,(40,40,48,255))]):
  t=sq.resize((n,n),Image.LANCZOS).resize((128,128),Image.NEAREST); bgim=Image.new('RGBA',(128,128),bg); bgim.alpha_composite(t); prev.paste(bgim,(i*140,0))
prev.alpha_composite(sq.resize((240,240),Image.LANCZOS),(270,8))
prev.save(SP+'preview.png')
