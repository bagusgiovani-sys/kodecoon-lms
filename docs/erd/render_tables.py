"""Render a shareable logical ERD with field rows and crow's-foot relationships."""
from pathlib import Path
from xml.sax.saxutils import escape
import sys, json, math, heapq, shutil
sys.path.insert(0,'C:/Users/kodec/AppData/Local/Temp/kodehub-erd-tools')
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib.colors import HexColor
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

HERE=Path(__file__).resolve().parent
DATA=json.loads((HERE/'table-model.json').read_text(encoding='utf-8'))
W,H=1191,842
OUT=HERE/'KodeHub-ERD-and-Data-Ownership.pdf'
COL={'shared':'#127D68','kodehub':'#233D58','external':'#626B76'}
C=Canvas(str(OUT),pagesize=(W,H),pageCompression=1)
C.setTitle('KodeHub - Entity Relationship Diagram and Data Ownership')
C.setAuthor('KodeHub | Kodecoon Academy')
TEXT=[]; BOUNDS=[]; ROUTES=[]

def line(a,b,color='#82909D',width=.9):
    C.setStrokeColor(HexColor(color));C.setLineWidth(width)
    C.line(a[0],H-a[1],b[0],H-b[1])

def label(t,x,y,size=10,bold=False,color='#26394B'):
    C.setFillColor(HexColor(color));C.setFont('Helvetica-Bold' if bold else 'Helvetica',size)
    C.drawString(x,H-y,t)

def paragraph(t,x,y,w,size=11):
    p=Paragraph(escape(t),ParagraphStyle('body',fontName='Helvetica',fontSize=size,leading=size*1.4,textColor=HexColor('#34485A')))
    _,h=p.wrap(w,1000);p.drawOn(C,x,H-y-h);BOUNDS.append((page_no,y+h));return h

def header(p):
    label('KODECOON ACADEMY / KODEHUB',44,33,10,True,'#127D68')
    label(p['title'],44,70,25,True)
    label(p['subtitle'],44,96,11,color='#526578')
    line((44,111),(1147,111),'#D1DBE2')
    line((44,803),(1147,803),'#D1DBE2')
    label('28 OCT 2026  |  Version '+DATA['version']+'  |  KodeHub logical data model',44,822,9,color='#526578')
    label(str(page_no),1135,822,9)

def boxinfo(n):
    name=n['table']; e=DATA['entities'][name]
    return {'name':name,'x':54+n['pos'][0]*402,'y':145+n['pos'][1]*252,
            'w':274,'h':33+len(e['fields'])*19,'entity':e}

def field_y(b,field):
    return b['y']+33+19*(next(i for i,f in enumerate(b['entity']['fields']) if f[1]==field)+.5)

def table(b,reference=False):
    x,y,w,h=b['x'],b['y'],b['w'],b['h'];e=b['entity'];color=COL[e['owner']]
    C.setFillColor(HexColor('#FFFFFF'));C.setStrokeColor(HexColor('#798793'));C.setLineWidth(.8)
    C.roundRect(x,H-y-h,w,h,4,fill=1,stroke=1)
    C.setFillColor(HexColor(color));C.rect(x,H-y-33,w,33,fill=1,stroke=0)
    title=b['name']+(' [ref]' if reference else '')
    label(title,x+10,y+21,min(12,250/max(len(title)*.59,1)),True,'#FFFFFF')
    line((x+45,y+33),(x+45,y+h),'#B8C4CC',.6)
    line((x+w-62,y+33),(x+w-62,y+h),'#D2DAE0',.5)
    for i,(key,name,typ) in enumerate(e['fields']):
        yy=y+33+i*19
        if key:
            C.setFillColor(HexColor('#E3F1E9' if 'PK' in key else '#EFF3F6'))
            C.rect(x+1,H-yy-19,43,19,fill=1,stroke=0)
        if i:line((x,yy),(x+w,yy),'#DAE1E6',.45)
        label(key,x+5,yy+13,8.4,True)
        label(name,x+52,yy+13,9.7,'PK' in key)
        label(typ,x+w-56,yy+13,8.4,color='#617281')

def route(a,b,source,target,obstacles,used):
    # Ports attach to actual PK/FK field rows, with orthogonal segments outside tables.
    if a['x']==b['x']: side_a=side_b=-1
    elif a['x']<b['x']:side_a=1;side_b=-1
    else:side_a=-1;side_b=1
    pa=(a['x']+(a['w'] if side_a==1 else 0),field_y(a,source))
    pb=(b['x']+(b['w'] if side_b==1 else 0),field_y(b,target))
    def anchor(p,side):return (round((p[0]+side*28)/8)*8,round(p[1]/8)*8)
    start,end=anchor(pa,side_a),anchor(pb,side_b)
    def blocked(q):
        x,y=q
        return x<24 or x>1168 or y<128 or y>650 or any(o['x']-12<x<o['x']+o['w']+12 and o['y']-12<y<o['y']+o['h']+12 for o in obstacles)
    queue=[(0,0,start,None)];cost={(start,None):0};prev={};finish=None
    while queue:
        _,g,q,direction=heapq.heappop(queue)
        if q==end:finish=(q,direction);break
        for d,(dx,dy) in enumerate(((8,0),(-8,0),(0,8),(0,-8))):
            v=(q[0]+dx,q[1]+dy)
            if blocked(v):continue
            ng=g+1+(0 if direction is None or d==direction else 3)+used.get(v,0)*5
            state=(v,d)
            if ng<cost.get(state,1e20):
                cost[state]=ng;prev[state]=(q,direction)
                heapq.heappush(queue,(ng+(abs(v[0]-end[0])+abs(v[1]-end[1]))/8,ng,v,d))
    if finish is None:raise RuntimeError(('Unroutable',a['name'],b['name'],start,end))
    pts=[];state=finish
    while state in prev:pts.append(state[0]);state=prev[state]
    pts.append(start);pts.reverse()
    for p in pts:used[p]=used.get(p,0)+1
    return [pa,(start[0],pa[1])]+pts+[(end[0],pb[1]),pb],(pa,side_a),(pb,side_b)

def cardinal(port,kind):
    (x,y),side=port
    def p(d,t=0):return (x+side*d,y+t)
    color='#536879'
    if kind in ('many','one_optional'):
        C.setFillColor(HexColor('#FFFFFF'));C.setStrokeColor(HexColor(color));C.setLineWidth(.9)
        C.circle(x+side*21,H-y,3.3,fill=1,stroke=1)
    if kind=='many':
        for t in (-5,0,5):line(p(1,t),p(12),color)
    else:
        line(p(8,-5),p(8,5),color)
        if kind=='one':line(p(13,-5),p(13,5),color)

def diagram(p):
    boxes={n['table']:boxinfo(n) for n in p['nodes']};used={};ports=[]
    for edge in p['edges']:
        parent,pk,child,fk,*kind=edge
        pts,pa,pb=route(boxes[parent],boxes[child],pk,fk,list(boxes.values()),used)
        for s,t in zip(pts,pts[1:]):line(s,t)
        ports.append((pa,'one_optional' if kind and kind[0]=='optional_parent' else 'one'))
        ports.append((pb,'one_optional' if kind and kind[0]=='unique' else 'many'))
        ROUTES.append((page_no,parent,pk,child,fk))
    for n in p['nodes']:table(boxes[n['table']],n.get('ref',False))
    for port,kind in ports:cardinal(port,kind)
    label('PK  Primary key     FK  Foreign key     ||  Exactly one     o|  Zero or one     o<  Zero or many',44,677,10)
    label('GREEN  Shared registry     NAVY  KodeHub     [ref]  Entity repeated from another sheet',44,698,9.5,color='#526578')
    y=720
    for note in p['notes']:y+=paragraph(note,44,y,1103,10.7)+7

def textpage(p):
    y=145
    for title,body in p['sections']:
        label(title,44,y,14,True,'#127D68');y+=12
        y+=paragraph(body,44,y,1103,12)+27

def matrix(p):
    y=145;widths=p['widths']
    for i,row in enumerate([p['headers']]+p['rows']):
        paras=[];height=0
        for t,w in zip(row,widths):
            q=Paragraph(escape(t),ParagraphStyle('cell',fontName='Helvetica-Bold' if i==0 else 'Helvetica',fontSize=11,leading=15,textColor=HexColor('#FFFFFF' if i==0 else '#26394B')))
            _,h=q.wrap(w-20,1000);paras.append((q,h));height=max(height,h+20)
        C.setFillColor(HexColor('#233D58' if i==0 else ('#F0F5F7' if i%2 else '#FFFFFF')))
        C.rect(44,H-y-height,sum(widths),height,fill=1,stroke=0)
        x=44
        for (q,h),w in zip(paras,widths):q.drawOn(C,x+10,H-y-10-h);x+=w
        y+=height
    BOUNDS.append((page_no,y))
    if p.get('notes'):paragraph(p['notes'],44,y+20,1103,11)

def dataflow(p):
    boxes={}
    for n in p['nodes']:
        x=54+n['pos'][0]*402;y=165+n['pos'][1]*245;w=274;h=112
        boxes[n['id']]=(x,y,w,h)
        color=COL[n['owner']]
        C.setFillColor(HexColor('#FFFFFF'));C.setStrokeColor(HexColor(color))
        C.roundRect(x,H-y-h,w,h,5,fill=1,stroke=1)
        C.setFillColor(HexColor(color));C.rect(x,H-y-31,w,31,fill=1,stroke=0)
        label(n['title'],x+10,y+21,12,True,'#FFFFFF')
        paragraph(n['body'],x+12,y+43,w-24,11)
    for e in p['edges']:
        points=e['path']
        for a,b in zip(points,points[1:]):line(a,b,'#526D81',1.2)
        a,b=points[-2:];theta=math.atan2(b[1]-a[1],b[0]-a[0])
        for angle in (-.5,.5):line(b,(b[0]-8*math.cos(theta+angle),b[1]-8*math.sin(theta+angle)),'#526D81',1.2)
        x,y=e['label_pos'];label(e['label'],x,y,9.2,False,'#34485A')
    y=605
    for heading,body in p['notes']:
        label(heading,44,y,12,True,'#127D68');y+=10
        y+=paragraph(body,44,y,1103,11)+18

for page_no,p in enumerate(DATA['pages'],1):
    header(p);{'diagram':diagram,'text':textpage,'matrix':matrix,'dataflow':dataflow}[p['type']](p);C.showPage()
C.save()
assert all(y<790 for _,y in BOUNDS),BOUNDS
shutil.copyfile(OUT,HERE/'KodeHub-ERD-Review-2026-10-28.pdf')
lines=['# KodeHub logical entity dictionary','','Version '+DATA['version']+' - 28 October 2026. Logical interface names; physical integration maps these to the shared registry.','']
for name,e in DATA['entities'].items():
    lines.extend(['## '+name,'','Owner: '+e['owner'],'','| Key | Field | Type | References |','|---|---|---|---|'])
    lines.extend('| '+' | '.join(f+[e['references'].get(f[1],'')])+' |' for f in e['fields']);lines.append('')
# One entity per file keeps the agreed documentation ceiling intact.
folder=HERE/'data-design';folder.mkdir(exist_ok=True)
for part in '\n'.join(lines).split('\n## ')[1:]:
    (folder/(part.split('\n',1)[0]+'.md')).write_text('## '+part+'\n',encoding='utf-8')
(HERE/'data-design-manifest.json').write_text(json.dumps({'pages':len(DATA['pages']),'entities':len(DATA['entities']),'relationships_drawn':len(ROUTES),'logical_model_version':DATA['version']},indent=2),encoding='utf-8')
import csv
with (HERE/'relationship-register.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.writer(f);writer.writerow(['parent_table','parent_key','child_table','foreign_key','parent_required','children_per_parent'])
    for parent,pk,child,fk,*kind in DATA['relationships']:
        field=next(t for _,n,t in DATA['entities'][child]['fields'] if n==fk)
        writer.writerow([parent,pk,child,fk,'no' if '?' in field else 'yes','0..1' if kind and kind[0]=='unique' else '0..many'])
print(json.dumps({'pdf':str(OUT),'pages':len(DATA['pages']),'entities':len(DATA['entities']),'relationships_drawn':len(ROUTES)}))
