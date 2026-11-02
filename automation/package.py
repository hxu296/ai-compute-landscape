#!/usr/bin/env python3
"""Package a checked-out public site, including a portable offline HTML copy."""
import argparse,base64,hashlib,re,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def package(root,out):
    if out.exists():shutil.rmtree(out)
    out.mkdir(parents=True)
    for name in ['index.html','style.css','AUDIT.md','README.md','.nojekyll']:
        if (root/name).exists():shutil.copy2(root/name,out/name)
    for name in ['js','data','fonts','research']:shutil.copytree(root/name,out/name)
    html=(root/'index.html').read_text()
    # Strip old content hashes before calculating the new release.
    html=re.sub(r'((?:src|href)="[^"?]+)\?v=[a-f0-9]+"',r'\1"',html)
    def version(m):
        path=m.group(2);digest=hashlib.sha256((root/path).read_bytes()).hexdigest()[:12]
        return m.group(1)+'="'+path+'?v='+digest+'"'
    (out/'index.html').write_text(re.sub(r'(src|href)="((?:js/|data/)[^"?]+\.js|style\.css)"',version,html))
    fonts=(root/'fonts/fonts.css').read_text()
    fonts=re.sub(r'url\(([\w-]+\.woff2)\)',lambda m:'url(data:font/woff2;base64,'+base64.b64encode((root/'fonts'/m.group(1)).read_bytes()).decode()+')',fonts)
    css=(root/'style.css').read_text().replace('@import url("fonts/fonts.css");',fonts)
    html=html.replace('<link rel="stylesheet" href="style.css">','<style>\n'+css+'</style>')
    html=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>\n'+(root/m.group(1)).read_text().replace('</script','<\\/script')+'</script>',html)
    html=re.sub(r'href="((?:research/[^"#]+|AUDIT\.md|data/[^"#]+\.(?:csv|json)))"',lambda m:'href="https://hxu296.github.io/ai-compute-landscape/'+m.group(1)+'"',html)
    (out/'ai-compute-landscape.html').write_text(html)
    print('Packaged public assets and offline bundle:',out)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=ROOT);p.add_argument('--out',type=Path,default=ROOT/'_site');a=p.parse_args();package(a.root,a.out)
