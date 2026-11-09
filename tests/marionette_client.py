import socket,json,base64,time,os
class Browser:
 def __init__(self):
  self.s=socket.create_connection(('127.0.0.1',int(os.environ.get('HOMEWORK_MARIONETTE_PORT','2828'))));self.counter=0;self.recv()
  self.call('WebDriver:NewSession',{'capabilities':{'alwaysMatch':{'acceptInsecureCerts':True}}})
 def recv(self):
  n=b''
  while (c:=self.s.recv(1))!=b':': n+=c
  size=int(n);data=b''
  while len(data)<size:data+=self.s.recv(size-len(data))
  return json.loads(data)
 def call(self,name,args={}):
  self.counter+=1;data=json.dumps([0,self.counter,name,args]).encode();self.s.sendall(str(len(data)).encode()+b':'+data);result=self.recv()
  if result[2]: raise RuntimeError(result)
  return result[3].get('value')
 def js(self,script):
  source='try { window.__checkResult=(()=>{'+script+'})() } catch(e) {window.__checkResult={error:e.stack}}'
  wrapper="const el=document.createElement('script');el.textContent="+json.dumps(source)+";document.head.append(el);el.remove();return window.__checkResult;"
  result=self.call('WebDriver:ExecuteScript',{'script':wrapper,'args':[],'sandbox':None})
  if isinstance(result,dict) and 'error' in result:raise RuntimeError(result)
  return result
 def shot(self,path,**kw):
  with open(path,'wb') as f:f.write(base64.b64decode(self.call('WebDriver:TakeScreenshot',{'full':False,**kw})))
 def close(self):self.call('WebDriver:DeleteSession')
