const {test}=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createApp}=require('./index.cjs');

test('items and private claims workflow',async()=>{
 const {app,db}=createApp(':memory:');
 const server=app.listen(0);
 const base='http://127.0.0.1:'+server.address().port;
 try{
  let response=await fetch(base+'/api/items');
  assert.deepEqual(await response.json(),[]);
  response=await fetch(base+'/api/items',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Blue bottle',type:'lost',category:'Essentials',location:'Library',date:'2026-10-24',description:'Blue steel bottle',latitude:12.9716,longitude:77.5946})});
  assert.equal(response.status,201);
  const item=await response.json();
  assert.equal(item.latitude,12.9716);
  assert.equal(item.longitude,77.5946);
  const saved=db.prepare('SELECT latitude,longitude FROM items WHERE id=?').get(item.id);
  assert.equal(saved.latitude,12.9716);
  assert.equal(saved.longitude,77.5946);
  response=await fetch(base+'/api/claims',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({itemId:item.id,name:'Tester',email:'test@example.com',proof:'Unique sticker under the base'})});
  assert.equal(response.status,201);
  response=await fetch(base+'/api/claims');
  assert.equal(response.status,404);
  response=await fetch(base+'/api/items',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Bad pin',type:'lost',category:'Essentials',location:'Library',date:'2026-10-24',description:'Invalid coordinates',latitude:91,longitude:181})});
  assert.equal(response.status,400);
  response=await fetch(base+'/api/items',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  assert.equal(response.status,400);
  assert.equal(db.prepare('SELECT count(*) AS n FROM claims').get().n,1);
 }finally{
  server.close();
  db.close();
 }
});

test('publishes successfully after migrating a pre-map database',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'campusclaim-legacy-'));
 const dbPath=path.join(directory,'legacy.sqlite');
 const legacyDb=new DatabaseSync(dbPath);
 legacyDb.exec('CREATE TABLE items(id TEXT PRIMARY KEY,title TEXT NOT NULL,type TEXT NOT NULL,category TEXT NOT NULL,location TEXT NOT NULL,date TEXT NOT NULL,description TEXT NOT NULL,status TEXT NOT NULL,icon TEXT NOT NULL)');
 legacyDb.close();
 const {app,db}=createApp(dbPath);
 const server=app.listen(0);
 const base='http://127.0.0.1:'+server.address().port;
 try{
  const response=await fetch(base+'/api/items',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Blue headphones',type:'lost',category:'Electronics',location:'Central Library',date:'2026-10-24',description:'Blue over-ear headphones',latitude:13.033008,longitude:80.180019})});
  const body=await response.json();
  assert.equal(response.status,201,JSON.stringify(body));
  assert.equal(body.latitude,13.033008);
  assert.equal(body.longitude,80.180019);
  assert.deepEqual(db.prepare('PRAGMA table_info(items)').all().map(column=>column.name).slice(-2),['latitude','longitude']);
 }finally{
  server.close();
  db.close();
  fs.rmSync(directory,{recursive:true,force:true});
 }
});
