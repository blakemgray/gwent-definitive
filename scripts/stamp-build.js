'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const RELEASE='11.tabletop.motion.2';
function identityFor(root,sha){
  if(!/^[0-9a-f]{40}$/i.test(sha||''))throw new Error('An exact 40-character source commit is required');
  const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  if(!sw.includes(`const BUILD='${RELEASE}';`))throw new Error('Runtime identity and service-worker generation disagree');
  const files=[...new Set(['sw.js',...[...sw.matchAll(/'\.\/([^']+)'/g)].map(m=>m[1])])].filter(file=>file!=='src/build-identity.js').sort();
  const hash=crypto.createHash('sha256');
  for(const file of files){hash.update(file+'\0');hash.update(fs.readFileSync(path.join(root,file)));hash.update('\0');}
  return {releaseId:RELEASE,sourceCommit:sha.toLowerCase(),baselineCommit:'8b7429d1ec6615dce5a8e6f956ceb2286647713d',sourceFingerprint:hash.digest('hex'),generated:true,packaged:true};
}
function render(identity){return `// Generated from the exact candidate before QA/packaging.\nwindow.GwentBuildIdentity=Object.freeze(${JSON.stringify(identity,null,2)});\n`;}
if(require.main===module){
  const args=process.argv.slice(2),sha=args[args.indexOf('--sha')+1];
  if(!args.includes('--sha'))throw new Error('Use --sha <exact candidate commit>');
  const root=path.resolve(__dirname,'..');
  const out=args.includes('--out')?path.resolve(root,args[args.indexOf('--out')+1]):path.join(root,'src/build-identity.js');
  const identity=identityFor(root,sha);fs.writeFileSync(out,render(identity));
  console.log(`build identity: ${identity.releaseId} ${identity.sourceCommit} ${identity.sourceFingerprint}`);
}
module.exports={identityFor,render};
