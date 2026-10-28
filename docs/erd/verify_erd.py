"""Render the PDF for visual review and check exported document coverage."""
import sys, json, re
from pathlib import Path
sys.path.insert(0, 'C:/Users/kodec/AppData/Local/Temp/kodehub-erd-tools')
import pymupdf
from PIL import Image, ImageOps, ImageDraw

here=Path(__file__).resolve().parent
qa=Path('C:/Users/kodec/AppData/Local/Temp/kodehub-erd-qa')
qa.mkdir(exist_ok=True)
pdf=pymupdf.open(here/'KodeHub-ERD-Review-2026-10-28.pdf')
texts=[]; thumbnails=[]
for i,page in enumerate(pdf):
    text=page.get_text();texts.append(text)
    assert 'KODEHUB' in text and str(i+1) in text
    pix=page.get_pixmap(matrix=pymupdf.Matrix(1.5,1.5),alpha=False)
    pix.save(qa/f'page-{i+1:02}.png')
    im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
    im.thumbnail((700,495)); thumbnails.append(im)
    for word in page.get_text('words'):
        assert 0<=word[0]<word[2]<=843 and 0<=word[1]<word[3]<=596,(i,word)
sheet=Image.new('RGB',(2130,((len(thumbnails)+2)//3)*525),'#D7DFE8')
for i,im in enumerate(thumbnails):sheet.paste(im,((i%3)*710+5,(i//3)*525+20))
sheet.save(qa/'contact-sheet.png')
source=pymupdf.open('C:/Users/kodec/Downloads/00 - Kodecoon_Lesson_Checklist v4 - 21 Oct 2026 (1).pdf')
sheet=Image.new('RGB',(1530,740),'#D7DFE8')
for i,page in enumerate(source):
    pix=page.get_pixmap(matrix=pymupdf.Matrix(1,1),alpha=False)
    im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples);im.thumbnail((500,720))
    sheet.paste(im,(i*510+5,10))
sheet.save(qa/'source-checklist.png')
names=re.findall(r'(?im)^create table\s+(?:public\.)?(\w+)\s*\(', (here.parent.parent/'schema.sql').read_text(encoding='utf-8'))
alltext='\n'.join(texts)
assert len(pdf)==13 and len(names)==38
assert all(n in alltext for n in names),[n for n in names if n not in alltext]
assert all(len(p.read_text(encoding='utf-8').splitlines())<=300 for p in here.rglob('*.md'))
for p in (here/'schema-reference').glob('*.md'):
    assert len(re.findall(r'(?im)^create table',p.read_text(encoding='utf-8')))==1,p
summary={'pages':len(pdf),'all_existing_tables_in_pdf':len(names),'all_text_within_page':True,'markdown_ceiling_300':'passed','visual_review_files':str(qa),'runtime_tests':'not run; document verification only'}
(here/'verification.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8')
print(json.dumps(summary))
