'use strict';
const crypto = require('node:crypto');
// Credentials stay in Vercel server environment variables, never in the Angular bundle.
function createDatabase(env = process.env) {
  const url = env.TURSO_DATABASE_URL;
  const token = env.TURSO_AUTH_TOKEN;
  if (!url || !token) throw new Error('Hosted database is not configured');
  const endpoint = new URL(url.replace(/^(libsql|turso):/, 'https:'));
  if (endpoint.protocol !== 'https:') throw new Error('Database requires HTTPS');
  endpoint.pathname = '/v2/pipeline';
  return async function query(sql, values = []) {
    const args = values.map(value => value === null || value === undefined ? {type:'null'} : typeof value === 'number' ? Number.isInteger(value) ? {type:'integer',value:String(value)} : {type:'float',value} : {type:'text',value:String(value)});
    const response = await fetch(endpoint, {method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({requests:[{type:'execute',stmt:{sql,args,want_rows:true}},{type:'close'}]}),signal:AbortSignal.timeout(12000)});
    if (!response.ok) throw new Error('Database service returned '+response.status);
    const body = await response.json();
    const execution = body.results?.[0];
    if (!execution || execution.type === 'error') throw new Error('Database query failed');
    const result = execution.response?.result;
    if (!result) throw new Error('Unexpected database response');
    return {rows:(result.rows || []).map(row => Object.fromEntries(result.cols.map((column,index) => {const v=row[index];return [column.name,v.type==='null'?null:v.type==='integer'||v.type==='float'?Number(v.value):v.value]}))),changes:result.affected_row_count || 0};
  };
}
function createHandler(databaseFactory = () => createDatabase()) {
  let database, ready;
  const limits = new Map();
  async function getDb() {
    if (!database) database = databaseFactory();
    if (!ready) ready = (async()=>{
      await database('CREATE TABLE IF NOT EXISTS items(id TEXT PRIMARY KEY,title TEXT NOT NULL,type TEXT NOT NULL,category TEXT NOT NULL,location TEXT NOT NULL,date TEXT NOT NULL,description TEXT NOT NULL,status TEXT NOT NULL,icon TEXT NOT NULL,latitude REAL,longitude REAL)');
      await database('CREATE TABLE IF NOT EXISTS claims(id TEXT PRIMARY KEY,itemId TEXT NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,proof TEXT NOT NULL,createdAt TEXT NOT NULL)');
    })().catch(error=>{ready=undefined;throw error});
    await ready;
    return database;
  }
  const valid=(value,max,min=1)=>typeof value==='string'&&value.trim().length>=min&&value.length<=max;
  return async function handler(req,res) {
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
    const send=(status,body)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(body))};
    const route=String(req.query?.route || new URL(req.url,'https://campusclaim.invalid').searchParams.get('route') || new URL(req.url,'https://campusclaim.invalid').pathname.replace(/^\/api\//,'')).replace(/^\/+|\/+$/g,'');
    const method=req.method || 'GET';
    if (!['health','items','claims'].includes(route)) return send(404,{error:'Route not found'});
    if (route==='claims'&&method!=='POST') return send(404,{error:'Route not found'});
    if ((route==='health'&&method!=='GET')||(route==='items'&&!['GET','POST'].includes(method))) return send(405,{error:'Method not allowed'});
    try {
      let data=req.body;
      if (method==='POST') {
        const origin=req.headers.origin;
        const host=req.headers.host;
        if (origin && new URL(origin).host !== host) return send(403,{error:'Cross-origin submission rejected'});
        const key=String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0];
        const now=Date.now();let bucket=limits.get(key);
        if(!bucket||now-bucket.start>60000){bucket={start:now,count:0};limits.set(key,bucket)}
        if(++bucket.count>30)return send(429,{error:'Too many requests; try again in a minute'});
        if(limits.size>10000)limits.clear();
        if (typeof data==='string') {if(Buffer.byteLength(data)>20000)return send(413,{error:'Report is too large'});try{data=JSON.parse(data)}catch{return send(400,{error:'Invalid JSON'})}}
        if(!data||typeof data!=='object'||Array.isArray(data))return send(400,{error:'Invalid request body'});
        if(Buffer.byteLength(JSON.stringify(data))>20000)return send(413,{error:'Report is too large'});
      }
      if(route==='items'&&method==='POST') {
        const d=data;
        if(!valid(d.title,100)||!['lost','found'].includes(d.type)||!['Electronics','Essentials','Books','Accessories'].includes(d.category)||!valid(d.location,120)||!valid(d.description,800)||typeof d.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||Number.isNaN(Date.parse(d.date)))return send(400,{error:'Invalid item fields'});
        const hasLat=d.latitude!==undefined&&d.latitude!==null&&d.latitude!=='';
        const hasLon=d.longitude!==undefined&&d.longitude!==null&&d.longitude!=='';
        const lat=Number(d.latitude),lon=Number(d.longitude);
        if(hasLat!==hasLon||(hasLat&&(!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lon)||Math.abs(lon)>180)))return send(400,{error:'Invalid map coordinates'});
        const icons={Electronics:'🎧',Essentials:'🔑',Books:'📗',Accessories:'🎒'};
        const item={id:crypto.randomUUID(),title:d.title.trim(),type:d.type,category:d.category,location:d.location.trim(),date:d.date,description:d.description.trim(),status:'open',icon:icons[d.category],latitude:hasLat?lat:null,longitude:hasLon?lon:null};
        const db=await getDb();await db('INSERT INTO items(id,title,type,category,location,date,description,status,icon,latitude,longitude) VALUES(?,?,?,?,?,?,?,?,?,?,?)',Object.values(item));
        return send(201,item);
      }
      if(route==='claims') {
        const d=data;
        if(!valid(d.itemId,80)||!valid(d.name,80)||!valid(d.email,160)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)||!valid(d.proof,1000,10))return send(400,{error:'Invalid claim'});
        const db=await getDb();const result=await db('SELECT status FROM items WHERE id=?',[d.itemId]);const item=result.rows[0];
        if(!item)return send(404,{error:'Item not found'});if(item.status!=='open')return send(409,{error:'Item is not open'});
        await db('INSERT INTO claims(id,itemId,name,email,proof,createdAt) VALUES(?,?,?,?,?,?)',[crypto.randomUUID(),d.itemId,d.name.trim(),d.email.trim(),d.proof.trim(),new Date().toISOString()]);
        return send(201,{ok:true,message:'Claim recorded; no automatic email sent'});
      }
      const db=await getDb();
      if(route==='health'){await db('SELECT 1');return send(200,{ok:true,database:'turso',shared:true})}
      return send(200,(await db('SELECT * FROM items ORDER BY rowid DESC LIMIT 500')).rows);
    } catch(error) {const requestId=crypto.randomUUID();console.error('[CampusClaim '+requestId+']',error.message);return send(503,{error:'Campus server is temporarily unavailable. Please retry.',requestId})}
  };
}
module.exports=createHandler();
module.exports.createHandler=createHandler;
module.exports.createDatabase=createDatabase;
