"""Render the review document. Requires reportlab; no application code is run."""
from pathlib import Path
import json, re, hashlib, subprocess, sys
from xml.sax.saxutils import escape
sys.path.insert(0, 'C:/Users/kodec/AppData/Local/Temp/kodehub-erd-tools')
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
W, H = 842, 595
NAVY, BLUE, TEAL, GRAY = '#10213D', '#2563EB', '#087E75', '#54657B'
SHARE = '--share' in sys.argv
OUT = HERE / ('KodeHub-ERD-and-Data-Ownership.pdf' if SHARE else 'KodeHub-ERD-Review-2026-10-28.pdf')
doc = json.loads((HERE / ('share-content.json' if SHARE else 'review-content.json')).read_text(encoding='utf-8'))
c = canvas.Canvas(str(OUT), pagesize=(W,H), pageCompression=1)
c.setTitle('KodeHub | ERD and Data Ownership' if SHARE else 'KodeHub | Database relationships and ownership review')
c.setAuthor('KodeHub project')
md = ['# KodeHub ERD and Data Ownership', '', 'Version 1.0 | 2026-10-28', ''] if SHARE else ['# KodeHub ERD review', '', '2026-10-28 | Discussion draft; not a database migration.', '']
checks = []

def txt(s,x,y,size=10,color=NAVY,bold=False):
    c.setFillColor(HexColor(color)); c.setFont('Helvetica-Bold' if bold else 'Helvetica',size)
    c.drawString(x,H-y,s)

def para(s,x,y,width,size=10,color=NAVY):
    p=Paragraph(escape(s),ParagraphStyle('p',fontName='Helvetica',fontSize=size,leading=size*1.38,textColor=HexColor(color)))
    _,height=p.wrap(width,1000); p.drawOn(c,x,H-y-height)
    checks.append((page_no,s[:45],y+height))
    return height

def head(title,status):
    c.setFillColor(HexColor(NAVY));c.rect(0,H-86,W,86,fill=1,stroke=0)
    txt('KODEHUB  /  DATA COLLABORATION',36,25,9,'#AFC7F7',True)
    txt(title,36,58,22,'#FFFFFF',True)
    txt(status,36,105,9,TEAL if status.startswith('PROPOSED') else GRAY,True)
    c.setStrokeColor(HexColor('#DCE3ED'));c.line(36,33,W-36,33)
    txt('28 OCT 2026  |  Version 1.0  |  KodeHub ERD and Data Ownership' if SHARE else '28 OCT 2026  |  Review draft  |  Existing schema + proposed design',36,H-18,8,GRAY)
    txt(str(page_no),W-47,H-18,8,GRAY)
    md.extend(['## '+title,'',status,''])

def node(n):
    col,row=n['pos']; x=36+col*264;y=128+row*108;w=242;h=80
    color=TEAL if n.get('shared') or n.get('new') else BLUE
    c.setFillColor(HexColor('#F5F8FC'));c.setStrokeColor(HexColor('#C7D3E3'))
    c.roundRect(x,H-y-h,w,h,6,fill=1,stroke=1)
    c.setFillColor(HexColor(color));c.roundRect(x,H-y-24,w,24,5,fill=1,stroke=0)
    name=n['name'];size=min(10, 214/(max(len(name),1)*0.58))
    txt(name,x+10,y+16,size,'#FFFFFF',True)
    for i,field in enumerate(n['fields']):txt(field,x+10,y+39+i*13,8.6,GRAY)
    return (x,y,w,h)

def edge(a,b,label,boxes):
    x,y,w,h=boxes[a];X,Y,ww,hh=boxes[b]
    if Y>y and X==x: p=(x+w/2,y+h);q=(X+ww/2,Y)
    elif Y<y and X==x: p=(x+w/2,y);q=(X+ww/2,Y+hh)
    elif Y==y and X>x:p=(x+w,y+h/2);q=(X,Y+hh/2)
    elif Y==y and X<x:p=(x,y+h/2);q=(X+ww,Y+hh/2)
    else:p=(x+w/2,y+h);q=(X+ww/2,Y)
    c.setStrokeColor(HexColor('#7186A3'));c.setLineWidth(1)
    c.line(p[0],H-p[1],q[0],H-q[1])
    import math
    angle=math.atan2(q[1]-p[1],q[0]-p[0]);sz=4
    for offset in (-.55,.55):
        c.line(q[0],H-q[1],q[0]-sz*math.cos(angle+offset),H-(q[1]-sz*math.sin(angle+offset)))
    midx=(p[0]+q[0])/2;midy=(p[1]+q[1])/2
    if X==x:txt(label,midx+5,midy+3,7.2,GRAY)
    else:txt(label,midx-10,midy-5,7.2,GRAY)

def diagram(p):
    boxes={n['name']:node(n) for n in p['nodes']}
    for a,b,label in p['edges']:edge(a,b,label,boxes)
    txt('PK = row identifier  |  FK = linked record  |  1:N = one to zero/many  |  Additional links are listed in each box.',36,438,8,GRAY)
    y=452
    for s in p['notes']:
        y+=para(s,36,y,770,10)+7
    md.extend(['```mermaid','flowchart LR'])
    ids={n['name']:'n'+str(i) for i,n in enumerate(p['nodes'])}
    for n in p['nodes']:md.append(f'  {ids[n["name"]]}["{n["name"]}<br/>'+ '<br/>'.join(n['fields'])+'"]')
    for a,b,label in p['edges']:md.append(f'  {ids[a]} -->|{label}| {ids[b]}')
    md.extend(['```','']+p['notes']+[''])

def textpage(p):
    y=130
    for section in p['sections']:
        txt(section['title'],36,y,12,BLUE,True);y+=10
        y+=para(section['body'],36,y,770,10.5)+19
        md.extend(['### '+section['title'],'',section['body'],''])

def tablepage(p):
    widths=p['widths'];y=130
    for i,row in enumerate([p['headers']]+p['rows']):
        ps=[];height=0
        for cell,width in zip(row,widths):
            ps.append(Paragraph(escape(cell),ParagraphStyle('t',fontName='Helvetica-Bold' if i==0 else 'Helvetica',fontSize=9.2,leading=12.3,textColor=HexColor('#FFFFFF' if i==0 else NAVY))))
            height=max(height,ps[-1].wrap(width-16,1000)[1]+14)
        c.setFillColor(HexColor(NAVY if i==0 else ('#F0F5FB' if i%2 else '#FFFFFF')))
        c.rect(36,H-y-height,sum(widths),height,fill=1,stroke=0)
        x=36
        for pp,width in zip(ps,widths):
            ph=pp.wrap(width-16,1000)[1];pp.drawOn(c,x+8,H-y-7-ph);x+=width
        y+=height
    checks.append((page_no,'table',y))
    if p.get('notes'):para(p['notes'],36,y+14,770,10)
    md.extend(['| '+' | '.join(p['headers'])+' |','|'+'|'.join(['---']*len(widths))+'|'])
    md.extend('| '+' | '.join(row)+' |' for row in p['rows']);md.extend(['',p.get('notes',''),''])

for page_no,p in enumerate(doc['pages'],1):
    head(p['title'],p['status'])
    {'diagram':diagram,'text':textpage,'table':tablepage}[p['type']](p)
    c.showPage()
c.save()
assert all(y<553 for _,_,y in checks),[x for x in checks if x[2]>=553]
# Keep each editable narrative file below the agreed 300-line documentation ceiling.
parts='\n'.join(md).split('\n## ')
for idx,part in enumerate(parts):
    (HERE/f'{"share" if SHARE else "review"}-{idx:02}.md').write_text(part if idx==0 else '## '+part,encoding='utf-8')

if SHARE:
    import shutil
    shutil.copyfile(OUT, HERE / 'KodeHub-ERD-Review-2026-10-28.pdf')
    print(json.dumps({'pdf':str(OUT),'pages':len(doc['pages']),'layout_bounds':'passed'}))
    sys.exit(0)

# Exact CREATE TABLE declarations and later ALTER TABLE statements, no records or secrets.
sql=(ROOT/'schema.sql').read_text(encoding='utf-8')
matches=list(re.finditer(r'(?im)^create table\s+(?:public\.)?(\w+)\s*\(',sql))
assert len(matches)==38
index=['# Existing schema reference','','Extracted from schema.sql; current local implementation, not proposed design.','', '| Table | Source line | Reference |','|---|---:|---|']
refdir=HERE/'schema-reference';refdir.mkdir(exist_ok=True)
for m in matches:
    end=sql.find('\n);',m.end())+3
    block=sql[m.start():end]
    name=m.group(1);line=sql[:m.start()].count('\n')+1
    alters=re.findall(r'(?im)^alter table\s+(?:public\.)?'+re.escape(name)+r'\s+[^;]+;',sql)
    alters=[a for a in alters if 'enable row level security' not in a.lower()]
    content=f'# {name}\n\nExisting schema.sql:{line}. Not a standalone migration.\n\n```sql\n{block}\n'+ '\n'.join(alters)+'\n```\n'
    (refdir/f'{name}.md').write_text(content,encoding='utf-8')
    index.append(f'| {name} | {line} | [{name}](schema-reference/{name}.md) |')
(HERE/'schema-index.md').write_text('\n'.join(index)+'\n',encoding='utf-8')
manifest={'date':'2026-10-28','schema_sha256':hashlib.sha256(sql.encode()).hexdigest(),'tables':len(matches),'pdf_pages':len(doc['pages']),'source_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()}
(HERE/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'pdf':str(OUT),'pages':len(doc['pages']),'table_references':len(matches),'layout_bounds':'passed'}))
