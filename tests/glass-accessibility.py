"""Run with HOMEWORK_MARIONETTE_PORT pointing to a disposable Firefox launched
with --remote-allow-system-access. Preference changes affect that profile only.
"""
from marionette_client import Browser
from pathlib import Path
import json,time
b=Browser();out=Path('docs/verification/bright-glass');results=[]
configs=[('reduced-transparency',{'layout.css.prefers-reduced-transparency.enabled':True,'ui.prefersReducedTransparency':1},'(prefers-reduced-transparency:reduce)','#fff'),('high-contrast',{'browser.display.document_color_use':2},'(prefers-contrast:more)','#fff'),('no-blur-support',{'layout.css.backdrop-filter.enabled':False},None,'rgba(255,255,255,.9)'),('reduced-motion',{'ui.prefersReducedMotion':1},'(prefers-reduced-motion:reduce)',None)]
def prefs(values,clear=False):
 b.call('Marionette:SetContext',{'value':'chrome'})
 script=''
 for key,value in values.items():
  if clear:script+='Services.prefs.clearUserPref('+json.dumps(key)+');'
  else:script+='Services.prefs.'+('setBoolPref' if isinstance(value,bool) else 'setIntPref')+'('+json.dumps(key)+','+json.dumps(value)+');'
 b.call('WebDriver:ExecuteScript',{'script':script+'return true;','args':[]})
 b.call('Marionette:SetContext',{'value':'content'})
try:
 for name,values,query,expected in configs:
  prefs(values)
  b.call('WebDriver:Navigate',{'url':'http://127.0.0.1:8766/'});time.sleep(.5);b.js(Path('tests/glass-seed.js').read_text()+"document.body.classList.remove('reduce-motion');");time.sleep(.1)
  result=b.js("const s=getComputedStyle(document.documentElement),card=getComputedStyle(document.querySelector('.dash-card'));return {glass:s.getPropertyValue('--glass').trim(),surface:card.backgroundColor,backdrop:card.backdropFilter,supportsBlur:CSS.supports('backdrop-filter','blur(1px)'),motion:matchMedia('(prefers-reduced-motion:reduce)').matches,transition:getComputedStyle(document.querySelector('.topnav-item')).transitionDuration};")
  if query:assert b.js('return matchMedia('+json.dumps(query)+').matches;'),(name,result)
  if expected:assert result['glass']==expected,(name,result)
  if name=='no-blur-support':assert not result['supportsBlur'],result
  if name=='reduced-motion':assert result['transition']=='0s',result
  result['mode']=name;results.append(result);b.shot(str(out/(name+'.png')));prefs(values,clear=True);print('PASS',name,result,flush=True)
 b.call('WebDriver:Navigate',{'url':'http://127.0.0.1:8766/'});time.sleep(.5);b.js(Path('tests/glass-seed.js').read_text())
 focus=b.js("const e=document.getElementById('dash-quick-search');e.focus();const s=getComputedStyle(e);return {mode:'keyboard-focus',width:s.outlineWidth,style:s.outlineStyle,color:s.outlineColor};")
 assert focus['width']=='2px' and focus['style']=='solid' and focus['color']=='rgb(255, 122, 26)',focus
 results.append(focus);print('PASS keyboard-focus',focus,flush=True)
 b.js('openCmd();');time.sleep(.1)
 commandFocus=b.js("const e=document.getElementById('cmd-input');e.focus();const s=getComputedStyle(e);return {mode:'command-focus',width:s.outlineWidth,style:s.outlineStyle,color:s.outlineColor};")
 assert commandFocus['width']=='2px' and commandFocus['style']=='solid' and commandFocus['color']=='rgb(255, 122, 26)',commandFocus
 results.append(commandFocus);print('PASS command-focus',commandFocus,flush=True)
 (out/'accessibility.json').write_text(json.dumps(results,indent=2))
finally:
 for _,values,_,_ in configs:prefs(values,clear=True)
 b.close()
