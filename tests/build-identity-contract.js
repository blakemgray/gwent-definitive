'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert'),vm=require('vm');
const Build=require('../scripts/stamp-build.js');
const sandbox=fs.mkdtempSync(path.join(os.tmpdir(),'gwent-build-'));
try{
  fs.mkdirSync(path.join(sandbox,'src'));
  fs.writeFileSync(path.join(sandbox,'sw.js'),"const BUILD='11.tabletop.motion.2';const PRECACHE=['./','./index.html','./app.js','./src/build-identity.js'];");
  fs.writeFileSync(path.join(sandbox,'index.html'),'first shell');
  fs.writeFileSync(path.join(sandbox,'app.js'),'first runtime');
  fs.writeFileSync(path.join(sandbox,'src/build-identity.js'),'template');
  const sha='a'.repeat(40),first=Build.identityFor(sandbox,sha);
  assert.equal(first.sourceCommit,sha);
  assert.equal(first.generated,true);
  assert.equal(first.sourceFingerprint.length,64);
  fs.writeFileSync(path.join(sandbox,'src/build-identity.js'),Build.render(first));
  assert.deepStrictEqual(Build.identityFor(sandbox,sha),first,'identity stamp must not hash itself');
  fs.writeFileSync(path.join(sandbox,'app.js'),'changed runtime');
  assert.notEqual(Build.identityFor(sandbox,sha).sourceFingerprint,first.sourceFingerprint,'changed source must produce a different identity fingerprint');
  assert.throws(()=>Build.identityFor(sandbox,'main'),/exact 40/);
  fs.writeFileSync(path.join(sandbox,'sw.js'),"const BUILD='wrong';");
  assert.throws(()=>Build.identityFor(sandbox,sha),/generation disagree/);
  const window={};vm.runInNewContext(Build.render(first),{window});
  assert.equal(window.GwentBuildIdentity.sourceCommit,sha);
  assert(Object.isFrozen(window.GwentBuildIdentity));
  console.log('build-identity-contract: exact commit, source fingerprint, reproducible stamp and immutable runtime identity passed');
}finally{
  assert.equal(path.dirname(sandbox),path.resolve(os.tmpdir()));
  assert(path.basename(sandbox).startsWith('gwent-build-'));
  fs.rmSync(sandbox,{recursive:true,force:true});
}
