"""Document QA only: render and inspect the technical ERD export."""
import sys,json,re,csv
from pathlib import Path
sys.path.insert(0,'C:/Users/kodec/AppData/Local/Temp/kodehub-erd-tools')
import pymupdf
from PIL import Image
here=Path(__file__).resolve().parent
data=json.loads((here/'table-model.json').read_text(encoding='utf-8'))
pdf=pymupdf.open(here/'KodeNexus-ERD-and-Data-Ownership.pdf')
qa=Path('C:/Users/kodec/AppData/Local/Temp/kodehub-table-erd-qa');qa.mkdir(exist_ok=True)
assert len(pdf)==len(data['pages'])
texts=[];thumbs=[]
for i,page in enumerate(pdf):
    t=page.get_text();texts.append(t)
    assert not re.search(r'CURRENT LOCAL|PROPOSED|Review draft|Existing table inventory',t)
    for word in page.get_text('words'):
        assert 0<=word[0]<word[2]<=1192 and 0<=word[1]<word[3]<=843,(i,word)
    pix=page.get_pixmap(matrix=pymupdf.Matrix(1.2,1.2),alpha=False)
    pix.save(qa/f'page-{i+1:02}.png')
    im=Image.frombytes('RGB',(pix.width,pix.height),pix.samples);im.thumbnail((900,637));thumbs.append(im)
sheet=Image.new('RGB',(1820,((len(thumbs)+1)//2)*657),'#DAE0E5')
for i,im in enumerate(thumbs):sheet.paste(im,((i%2)*910+5,(i//2)*657+5))
sheet.save(qa/'contact-sheet.png')
text='\n'.join(texts)
for name,e in data['entities'].items():
    assert name in text,name
    assert len(e['fields'])<=9,(name,'field count')
    for key,field,typ in e['fields']:
        if 'FK' in key:assert field in e['references'],(name,field)
for parent,pk,child,fk,*kind in data['relationships']:
    assert any(k=='PK' and n==pk for k,n,_ in data['entities'][parent]['fields'])
    assert any('FK' in k and n==fk for k,n,_ in data['entities'][child]['fields'])
rows=list(csv.DictReader((here/'relationship-register.csv').open(encoding='utf-8-sig')))
assert len(rows)==len(data['relationships'])
assert len(pdf)==15
source_text=next(page.get_text() for page in pdf if 'Legacy data-source mapping' in page.get_text())
source_text=re.sub(r'\s+',' ',source_text.lower())
for phrase in ['Student Progress Tracker','OClass','current credits left','previous end-module feedback','class code','Finance owns financial records','canonical dataset']:
    assert phrase.lower() in source_text,phrase
report_fields={name:(kind,typ) for kind,name,typ in data['entities']['feedback_reports']['fields']}
assert report_fields['cycle_id'][1]=='uuid?'
assert 'report_date' in report_fields and 'source_system' in report_fields
summary={'pages':len(pdf),'entities':len(data['entities']),'foreign_key_relationships':len(rows),'field_references':'complete','page_bounds':'passed','legacy_source_map':'passed','review_comparison_removed':True,'rendered_to':str(qa),'application_tests':'not run'}
(here/'table-erd-verification.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps(summary))
