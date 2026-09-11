(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./cards-catalog-data.js"));
  else {
    const api = factory(root.GWENT_DEFINITIVE_CATALOG || []);
    root.GwentEnginePass9 = api;
    root.GwentEnginePass8 = api; // compatibility for the Pass 8 UI shell
  }
})(typeof self !== "undefined" ? self : this, function (catalog) {
  "use strict";

  const ROWS = ["close", "ranged", "siege"];
  const CLASS_RANK = { classic:0, assisted:1, modified:2, sandbox:3 };
  const PASSIVE_LEADERS = new Set(["emhyr_whiteflame","emhyr_invader","eredin_treacherous","francesca_daisy","king_bran"]);
  const SUPPORTED_ABILITIES = new Set([
    "clear","frost","fog","rain","storm","hero","decoy","horn","mardroeme","berserker","vildkarrl",
    "scorch","scorch_c","scorch_r","scorch_s","agile","muster","spy","medic","morale","bond","avenger","avenger_kambi",
    "foltest_king","foltest_lord","foltest_siegemaster","foltest_steelforged","foltest_son",
    "emhyr_imperial","emhyr_emperor","emhyr_whiteflame","emhyr_relentless","emhyr_invader",
    "eredin_commander","eredin_bringer_of_death","eredin_destroyer","eredin_king","eredin_treacherous",
    "francesca_queen","francesca_beautiful","francesca_daisy","francesca_pureblood","francesca_hope",
    "crach_an_craite","king_bran"
  ]);

  function normalizeCatalog(list){
    const db={};
    for(const c of list){
      const type = c.row === "leader" ? "leader" : c.faction === "weather" ? "weather" : c.faction === "special" ? "special" : "unit";
      db[c.stableId] = {
        id:c.stableId, sourceIndex:c.sourceIndex, sourceId:c.sourceId, name:c.name, faction:c.faction,
        type, row:c.row, strength:Number(c.strength || 0), abilities:(c.abilities||[]).slice(), filename:c.filename,
        count:Number(c.count||0), muster:c.muster || null, special:c.special || null, expansion:c.expansion || null
      };
    }
    const aliases = {
      realms_catapult: "realms_catapult_1",
      realms_dun_banner_medic: "realms_banner_nurse",
      monsters_grave_hag: "monsters_gravehag"
    };
    for (const [alias, canonical] of Object.entries(aliases)) {
      if (db[canonical]) Object.defineProperty(db, alias, {value:db[canonical], enumerable:false, configurable:false});
    }
    return db;
  }
  const CARD_DB = normalizeCatalog(catalog);
  const DECK_RULES = Object.freeze({minimumUnits:22,maximumSpecials:10});
  const VALID_FACTIONS = new Set(Object.values(CARD_DB).filter(d=>d.type==="leader").map(d=>d.faction));

  function validateDeck(opts){
    opts=opts||{};
    const faction=opts.faction||null,leaderId=opts.leaderId||null,deckIds=Array.isArray(opts.deckIds)?opts.deckIds:[];
    const errors=[],counts={};let units=0,specials=0;
    if(!VALID_FACTIONS.has(faction))errors.push({code:"invalid_faction",faction});
    const leader=CARD_DB[leaderId];
    if(!leader||leader.type!=="leader")errors.push({code:"invalid_leader",leaderId});
    else if(leader.faction!==faction)errors.push({code:"leader_faction_mismatch",leaderId,faction,leaderFaction:leader.faction});
    if(!Array.isArray(opts.deckIds))errors.push({code:"deck_not_array"});
    for(const cardId of deckIds){
      const d=CARD_DB[cardId];
      if(!d){errors.push({code:"unknown_card",cardId});continue;}
      const canonicalId=d.id;counts[canonicalId]=(counts[canonicalId]||0)+1;
      if(d.type==="leader"){errors.push({code:"leader_in_deck",cardId:canonicalId});continue;}
      if(d.type==="unit"){
        units++;
        if(d.faction!==faction&&d.faction!=="neutral")errors.push({code:"card_faction_mismatch",cardId:canonicalId,faction,cardFaction:d.faction});
      }else if(d.type==="special"||d.type==="weather")specials++;
      else errors.push({code:"invalid_card_type",cardId:canonicalId,type:d.type});
    }
    for(const [cardId,count] of Object.entries(counts)){
      const available=Math.max(0,Number(CARD_DB[cardId]?.count||0));
      if(count>available)errors.push({code:"copy_limit_exceeded",cardId,count,available});
    }
    if(units<DECK_RULES.minimumUnits)errors.push({code:"minimum_units",minimum:DECK_RULES.minimumUnits,actual:units});
    if(specials>DECK_RULES.maximumSpecials)errors.push({code:"maximum_specials",maximum:DECK_RULES.maximumSpecials,actual:specials});
    return {valid:errors.length===0,errors,summary:{faction,leaderId,total:deckIds.length,units,specials}};
  }
  function assertLegalDeck(opts){
    const result=validateDeck(opts);if(result.valid)return result;
    const error=new Error("Illegal deck: "+result.errors.map(x=>x.code).join(", "));error.code="ILLEGAL_DECK";error.validation=result;throw error;
  }

  function deepClone(x){ return JSON.parse(JSON.stringify(x)); }
  function otherPlayer(id){ return id === "p1" ? "p2" : "p1"; }
  function hasAbility(def,a){ return !!def && def.abilities.indexOf(a)!==-1; }
  function isHero(def){ return hasAbility(def,"hero"); }
  function isCombatUnit(def){ return !!def && def.type === "unit"; }
  function isReviveUnit(def){ return isCombatUnit(def) && !isHero(def); }
  function getDef(instOrId){ return typeof instOrId === "string" ? CARD_DB[instOrId] : CARD_DB[instOrId.cardId]; }
  function assertCard(cardId){ if(!CARD_DB[cardId]) throw new Error("Unknown card: "+cardId); return CARD_DB[cardId]; }

  function nextRng(state){
    let x=state.rngState>>>0; x^=(x<<13)>>>0; x^=x>>>17; x^=(x<<5)>>>0; state.rngState=x>>>0;
    return state.rngState/4294967296;
  }
  function randomIndex(state,n){ return n<=0 ? -1 : Math.floor(nextRng(state)*n); }
  function shuffleInPlace(state,cards){ for(let i=cards.length-1;i>0;i--){const j=randomIndex(state,i+1);[cards[i],cards[j]]=[cards[j],cards[i]];} return cards; }
  function makeInstanceWithState(state,cardId,extra){ assertCard(cardId); return Object.assign({iid:"c"+(state.nextSeq++),cardId},extra||{}); }
  function makeInstanceSeq(cardId,seq){ assertCard(cardId); return {iid:"c"+(seq.n++),cardId}; }

  function createEmptyBoard(){ return {close:[],ranged:[],siege:[],special:{close:null,ranged:null,siege:null},leaderHorn:{close:false,ranged:false,siege:false}}; }
  function createPlayer(id,faction,leaderId,deckIds,handSize,seq){
    const deck=deckIds.map(cid=>makeInstanceSeq(cid,seq));
    const hand=deck.splice(0,Math.min(handSize,deck.length));
    return {id,faction,leaderId:leaderId||null,leaderUsed:false,leaderDisabled:false,health:2,passed:false,hand,deck,grave:[],board:createEmptyBoard(),retainedIid:null,halfWeather:false};
  }
  function log(state,type,data){ state.eventLog.push({seq:state.eventLog.length+1,type,data:data||{}}); }
  function escalateClassification(state,target){ if(CLASS_RANK[target]>CLASS_RANK[state.classification]) state.classification=target; }

  function leaderAbilityToken(state,playerId){
    const p=state.players[playerId]; if(!p || !p.leaderId) return null; const d=CARD_DB[p.leaderId]; return d&&d.abilities[0]||null;
  }
  function leaderIsActiveToken(token){ return !!token && !PASSIVE_LEADERS.has(token); }
  function leaderAvailable(state,playerId){
    const p=state.players[playerId]; const token=leaderAbilityToken(state,playerId);
    return !!p && !!token && leaderIsActiveToken(token) && !p.leaderUsed && !p.leaderDisabled;
  }

  function createMatch(opts){
    opts=opts||{};
    if(opts.validateDecks===true){
      assertLegalDeck({faction:opts.p1Faction||"realms",leaderId:opts.p1LeaderId||null,deckIds:opts.p1Deck});
      assertLegalDeck({faction:opts.p2Faction||"monsters",leaderId:opts.p2LeaderId||null,deckIds:opts.p2Deck});
    }
    const seq={n:1};
    const p1Leader=opts.p1LeaderId||null, p2Leader=opts.p2LeaderId||null;
    const whiteFlame=[p1Leader,p2Leader].some(id=>id && CARD_DB[id] && CARD_DB[id].abilities[0]==="emhyr_whiteflame");
    const baseHand=opts.handSize==null?10:opts.handSize;
    const daisy1=!whiteFlame && p1Leader && CARD_DB[p1Leader]?.abilities[0]==="francesca_daisy";
    const daisy2=!whiteFlame && p2Leader && CARD_DB[p2Leader]?.abilities[0]==="francesca_daisy";
    const state={
      version:"pass11.1A",round:1,currentPlayerId:null,firstPlayerId:null,roundStarterId:null,classification:"classic",
      seed:(opts.seed==null?0xC0FFEE:opts.seed)>>>0,rngState:(opts.seed==null?0xC0FFEE:opts.seed)>>>0,nextSeq:seq.n,
      setupPhase:opts.mulligan===true?"mulligan":"playing",mulliganCounts:{p1:0,p2:0},
      players:{
        p1:createPlayer("p1",opts.p1Faction||"realms",p1Leader,(opts.p1Deck||[]).slice(),baseHand+(daisy1?1:0),seq),
        p2:createPlayer("p2",opts.p2Faction||"monsters",p2Leader,(opts.p2Deck||[]).slice(),baseHand+(daisy2?1:0),seq)
      },
      flags:{randomRespawn:false,doubleSpyPower:false},autoPass:opts.autoPass!==false,weather:{close:false,ranged:false,siege:false},weatherCards:[],
      roundHistory:[],eventLog:[],pendingChoice:null,pendingResume:null,roundStartQueue:[],leaderReveal:null,winner:null
    };
    state.nextSeq=seq.n;
    if(opts.shuffleDecks===true){
      for(const pid of ["p1","p2"]){
        const p=state.players[pid],openingSize=p.hand.length,all=p.hand.concat(p.deck);shuffleInPlace(state,all);p.hand=all.splice(0,openingSize);p.deck=all;
        log(state,"DECK_SHUFFLED",{playerId:pid,count:p.hand.length+p.deck.length});
      }
    }
    if(opts.validateDecks===true)log(state,"DECKS_VALIDATED",{p1:validateDeck({faction:state.players.p1.faction,leaderId:state.players.p1.leaderId,deckIds:(opts.p1Deck||[])}).summary,p2:validateDeck({faction:state.players.p2.faction,leaderId:state.players.p2.leaderId,deckIds:(opts.p2Deck||[])}).summary});

    if(whiteFlame){ state.players.p1.leaderDisabled=true; state.players.p2.leaderDisabled=true; log(state,"WHITE_FLAME_CANCELLED_LEADERS",{}); }
    else {
      for(const pid of ["p1","p2"]){
        const token=leaderAbilityToken(state,pid);
        if(token==="emhyr_invader") state.flags.randomRespawn=true;
        if(token==="eredin_treacherous") state.flags.doubleSpyPower=true;
        if(token==="king_bran") state.players[pid].halfWeather=true;
        if(token==="francesca_daisy") log(state,"DAISY_EXTRA_OPENING_CARD",{playerId:pid});
      }
    }

    const scoia=["p1","p2"].filter(pid=>state.players[pid].faction==="scoiatael");
    if(opts.firstPlayerId){ state.firstPlayerId=opts.firstPlayerId; }
    else if(scoia.length===1){
      if(opts.scoiataelFirstPlayerId) state.firstPlayerId=opts.scoiataelFirstPlayerId;
      else state.pendingChoice={type:"scoiatael_first",playerId:scoia[0],candidatePlayerIds:["p1","p2"],resume:{kind:"pregame"}};
    } else state.firstPlayerId = opts.coinToss ? (randomIndex(state,2)===0 ? "p1" : "p2") : "p1";
    if(state.firstPlayerId){ state.currentPlayerId=state.firstPlayerId; state.roundStarterId=state.firstPlayerId; }
    log(state,"MATCH_CREATED",{seed:state.seed,rngState:state.rngState,firstPlayerId:state.firstPlayerId,setupPhase:state.setupPhase});
    if(state.firstPlayerId && !state.pendingChoice && state.setupPhase==="playing") settleAutoPassAtRoundStart(state);
    return state;
  }

  function mulliganCard(stateIn,action){
    const state=deepClone(stateIn),pid=action.playerId||"p1";
    if(state.setupPhase!=="mulligan")throw new Error("Mulligan is closed");
    if(!state.players[pid])throw new Error("Unknown mulligan player");
    if((state.mulliganCounts?.[pid]||0)>=2)throw new Error("Mulligan limit reached");
    const p=state.players[pid],h=findIn(p.hand,action.iid);if(!h)throw new Error("Mulligan card not in hand");if(!p.deck.length)throw new Error("No replacement card available");
    const outgoing=p.hand.splice(h.index,1)[0],incoming=p.deck.shift();p.hand.push(incoming);p.deck.push(outgoing);
    state.mulliganCounts=state.mulliganCounts||{p1:0,p2:0};state.mulliganCounts[pid]=(state.mulliganCounts[pid]||0)+1;
    log(state,"CARD_MULLIGANED",{playerId:pid,outgoingIid:outgoing.iid,outgoingCardId:outgoing.cardId,incomingIid:incoming.iid,incomingCardId:incoming.cardId,count:state.mulliganCounts[pid]});
    return state;
  }
  function finishMulligan(stateIn){
    const state=deepClone(stateIn);if(state.setupPhase!=="mulligan")throw new Error("Mulligan is already closed");
    state.setupPhase="playing";log(state,"MULLIGAN_FINISHED",{counts:deepClone(state.mulliganCounts||{p1:0,p2:0})});
    if(state.firstPlayerId&&!state.pendingChoice)settleAutoPassAtRoundStart(state);return state;
  }

  function findIn(arr,iid){ const i=arr.findIndex(c=>c.iid===iid); return i<0?null:{index:i,card:arr[i]}; }
  function locateBoardUnit(state,playerId,iid){
    const p=state.players[playerId]; for(const row of ROWS){ const h=findIn(p.board[row],iid); if(h)return{row,index:h.index,card:h.card}; } return null;
  }
  function locateAny(state,iid){
    for(const pid of ["p1","p2"]){ const p=state.players[pid]; for(const zone of ["hand","deck","grave"]){ const h=findIn(p[zone],iid); if(h)return{playerId:pid,zone,index:h.index,card:h.card}; }
      for(const row of ROWS){ const h=findIn(p.board[row],iid); if(h)return{playerId:pid,zone:"board",row,index:h.index,card:h.card}; }
      for(const row of ROWS){ if(p.board.special[row]&&p.board.special[row].iid===iid)return{playerId:pid,zone:"special",row,card:p.board.special[row]}; }
    }
    const w=state.weatherCards.findIndex(x=>x.inst.iid===iid); if(w>=0)return{playerId:state.weatherCards[w].ownerId,zone:"weather",index:w,card:state.weatherCards[w].inst};
    return null;
  }

  function validRowsFor(def){ if(def.row==="agile")return["close","ranged"]; return ROWS.includes(def.row)?[def.row]:[]; }
  function rowEffects(state,playerId,row){
    const p=state.players[playerId], cards=p.board[row];
    const special=p.board.special[row]?getDef(p.board.special[row]):null;
    const morale=cards.filter(i=>hasAbility(getDef(i),"morale")).length;
    const horn=cards.filter(i=>hasAbility(getDef(i),"horn")).length + (special&&hasAbility(special,"horn")?1:0) + (p.board.leaderHorn[row]?1:0);
    const mardroeme=cards.filter(i=>hasAbility(getDef(i),"mardroeme")).length + (special&&hasAbility(special,"mardroeme")?1:0);
    const bond={}; for(const i of cards){ const d=getDef(i); if(hasAbility(d,"bond"))bond[d.name]=(bond[d.name]||0)+1; }
    return {morale,horn,mardroeme,bond};
  }
  function effectiveCardPower(state,playerId,row,inst){
    const def=getDef(inst); if(!def||def.type!=="unit")return 0; let total=def.strength;
    if(isHero(def))return total;
    if(state.weather[row]){ const min=state.players[playerId].halfWeather?Math.floor(total/2):1; total=Math.min(min,total); }
    if(state.flags.doubleSpyPower&&hasAbility(def,"spy"))total*=2;
    const eff=rowEffects(state,playerId,row); const b=eff.bond[def.name]||0; if(b>1)total*=b;
    total+=Math.max(0,eff.morale-(hasAbility(def,"morale")?1:0));
    if(eff.horn-(hasAbility(def,"horn")?1:0)>0)total*=2;
    return total;
  }
  function rowScore(state,playerId,row){ return state.players[playerId].board[row].reduce((s,i)=>s+effectiveCardPower(state,playerId,row,i),0); }
  function totalScore(state,playerId){ return ROWS.reduce((s,r)=>s+rowScore(state,playerId,r),0); }
  function scoreSnapshot(state){ return {p1:Object.assign(Object.fromEntries(ROWS.map(r=>[r,rowScore(state,"p1",r)])),{total:totalScore(state,"p1")}),p2:Object.assign(Object.fromEntries(ROWS.map(r=>[r,rowScore(state,"p2",r)])),{total:totalScore(state,"p2")})}; }

  function refreshWeather(state){
    const counts={frost:0,fog:0,rain:0};
    for(const x of state.weatherCards){ const d=getDef(x.inst); for(const a of d.abilities){ if(a in counts)counts[a]++; } }
    state.weather.close=counts.frost>0; state.weather.ranged=counts.fog>0; state.weather.siege=counts.rain>0;
  }
  function drawOne(state,playerId){ const p=state.players[playerId]; if(!p.deck.length)return null; const c=p.deck.shift(); p.hand.push(c); log(state,"CARD_DRAWN",{playerId,iid:c.iid,cardId:c.cardId}); return c; }
  function drawN(state,playerId,n){ const out=[]; for(let i=0;i<n;i++){const c=drawOne(state,playerId);if(c)out.push(c);} return out; }
  function removeFromHand(state,playerId,iid){ const h=findIn(state.players[playerId].hand,iid); if(!h)throw new Error("Card not in hand: "+iid); state.players[playerId].hand.splice(h.index,1); return h.card; }
  function addToDeckRandom(state,playerId,inst){ const deck=state.players[playerId].deck; const idx=randomIndex(state,deck.length+1); deck.splice(idx,0,inst); }
  function moveToGrave(state,playerId,inst){ if(inst.ephemeral){ log(state,"EPHEMERAL_REMOVED",{playerId,iid:inst.iid,cardId:inst.cardId}); return; } state.players[playerId].grave.push(inst); }

  function spawnAvenger(state,holderId,ability){
    const cardId=ability==="avenger_kambi"?"skellige_hemdall":"neutral_chort"; const inst=makeInstanceWithState(state,cardId,{ephemeral:true});
    state.players[holderId].board.close.push(inst); log(state,"AVENGER_SUMMON",{playerId:holderId,cardId,iid:inst.iid}); return inst;
  }
  function removeBoardCard(state,boardOwnerId,row,iid,destination){
    const h=findIn(state.players[boardOwnerId].board[row],iid); if(!h)throw new Error("Board card not found"); const inst=state.players[boardOwnerId].board[row].splice(h.index,1)[0]; const d=getDef(inst);
    if(destination==="grave")moveToGrave(state,boardOwnerId,inst); else if(destination==="hand")state.players[boardOwnerId].hand.push(inst); else if(destination==="vanish"){} else throw new Error("Unknown destination");
    if(hasAbility(d,"avenger"))spawnAvenger(state,boardOwnerId,"avenger"); if(hasAbility(d,"avenger_kambi"))spawnAvenger(state,boardOwnerId,"avenger_kambi");
    return inst;
  }

  function musterKey(def){ if(def.muster)return def.muster; const i=def.name.indexOf("-"); return i===-1?def.name:def.name.substring(0,i); }
  function resolveMuster(state,holderId,playedInst,boardOwnerId){
    const def=getDef(playedInst), key=musterKey(def), holder=state.players[holderId], summoned=[];
    for(const zoneName of ["hand","deck"]){ const zone=holder[zoneName]; for(let i=zone.length-1;i>=0;i--){ const d=getDef(zone[i]); if(d.name.startsWith(key)){ summoned.push(zone.splice(i,1)[0]); } } }
    summoned.reverse();
    for(const inst of summoned){ const d=getDef(inst); const row=validRowsFor(d)[0]; placeUnitCore(state,holderId,inst,row,{boardOwnerId:hasAbility(d,"spy")?otherPlayer(holderId):holderId,resume:null,fromMuster:true}); log(state,"MUSTER_SUMMON",{playerId:holderId,iid:inst.iid,cardId:inst.cardId,row}); }
  }
  function transformBerserkers(state,boardOwnerId,row){
    const arr=state.players[boardOwnerId].board[row]; for(const inst of arr){ const d=getDef(inst); if(hasAbility(d,"berserker")){ const to=row==="close"?"skellige_vildkaarl":"skellige_young_vildkaarl"; const from=inst.cardId; inst.cardId=to; log(state,"BERSERKER_TRANSFORMED",{playerId:boardOwnerId,iid:inst.iid,from,to,row}); } }
  }

  function globalMaxCandidates(state,excludeIid){
    const out=[]; for(const pid of ["p1","p2"])for(const row of ROWS)for(const inst of state.players[pid].board[row]){ const d=getDef(inst); if(inst.iid===excludeIid||!isReviveUnit(d))continue; out.push({playerId:pid,row,inst,power:effectiveCardPower(state,pid,row,inst)}); } return out;
  }
  function resolveGlobalScorch(state,excludeIid){
    const c=globalMaxCandidates(state,excludeIid); if(!c.length)return[]; const max=Math.max(...c.map(x=>x.power)); const doomed=c.filter(x=>x.power===max); const ids=doomed.map(x=>x.inst.iid);
    for(const d of doomed)removeBoardCard(state,d.playerId,d.row,d.inst.iid,"grave"); return ids;
  }
  function resolveRowScorch(state,victimId,row){
    if(rowScore(state,victimId,row)<10)return[]; const c=state.players[victimId].board[row].filter(i=>isReviveUnit(getDef(i))).map(inst=>({inst,power:effectiveCardPower(state,victimId,row,inst)}));
    if(!c.length)return[]; const max=Math.max(...c.map(x=>x.power)), doomed=c.filter(x=>x.power===max).map(x=>x.inst.iid); for(const iid of doomed)removeBoardCard(state,victimId,row,iid,"grave"); return doomed;
  }

  function setPending(state,choice,resume){ state.pendingChoice=Object.assign({},choice,{resume:resume||null}); }
  function finishResume(state,resume){
    if(!resume)return state; if(resume.kind==="turn")advanceTurn(state,resume.playerId); else if(resume.kind==="round_start")processRoundStartQueue(state); return state;
  }
  function reviveFromGrave(state,playerId,targetIid,row,resume){
    const p=state.players[playerId], h=findIn(p.grave,targetIid); if(!h)throw new Error("Revive target not in grave"); const d=getDef(h.card); if(!isReviveUnit(d))throw new Error("Invalid revive target");
    if(d.row==="agile"&&!row){ setPending(state,{type:"revive_row",playerId,targetIid,candidateRows:["close","ranged"]},resume); return; }
    const inst=p.grave.splice(h.index,1)[0]; placeUnitCore(state,playerId,inst,row||validRowsFor(d)[0],{resume}); log(state,"UNIT_REVIVED",{playerId,iid:inst.iid,cardId:inst.cardId,row:row||validRowsFor(d)[0]});
  }

  function resolveMedicOnPlacement(state,holderId,sourceInst,resume){
    const candidates=state.players[holderId].grave.filter(i=>isReviveUnit(getDef(i)));
    if(!candidates.length)return;
    if(state.flags.randomRespawn){ const chosen=candidates[randomIndex(state,candidates.length)]; reviveFromGrave(state,holderId,chosen.iid,null,resume); }
    else setPending(state,{type:"medic",playerId:holderId,sourceIid:sourceInst.iid,candidateIids:candidates.map(i=>i.iid)},resume);
  }

  function placeUnitCore(state,holderId,inst,row,opts){
    opts=opts||{}; const d=getDef(inst); const valid=validRowsFor(d); if(!valid.includes(row))throw new Error("Illegal row for "+d.name);
    const boardOwnerId=opts.boardOwnerId|| (hasAbility(d,"spy")?otherPlayer(holderId):holderId); state.players[boardOwnerId].board[row].push(inst);
    log(state,"UNIT_PLAYED",{playerId:holderId,boardOwnerId,iid:inst.iid,cardId:inst.cardId,row});
    // Placed effects mirror source ability order (hero is passive and skipped).
    for(const a of d.abilities){
      if(a==="hero"||a==="morale"||a==="bond"||a==="horn"||a==="vildkarrl"||a==="agile")continue;
      if(a==="muster")resolveMuster(state,holderId,inst,boardOwnerId);
      else if(a==="spy"){ drawN(state,holderId,2); log(state,"SPY_RESOLVED",{playerId:holderId,iid:inst.iid,drawCount:2}); }
      else if(a==="medic")resolveMedicOnPlacement(state,holderId,inst,opts.resume);
      else if(a==="mardroeme")transformBerserkers(state,boardOwnerId,row);
      else if(a==="berserker"){ if(rowEffects(state,boardOwnerId,row).mardroeme>0)transformBerserkers(state,boardOwnerId,row); }
      else if(a==="scorch"){ const doomed=resolveGlobalScorch(state,inst.iid); log(state,"SCORCH_RESOLVED",{playerId:holderId,sourceIid:inst.iid,doomed}); }
      else if(a==="scorch_c"||a==="scorch_r"||a==="scorch_s"){ const rr=a.endsWith("_c")?"close":a.endsWith("_r")?"ranged":"siege"; const doomed=resolveRowScorch(state,otherPlayer(holderId),rr); log(state,"ROW_SCORCH_RESOLVED",{playerId:holderId,row:rr,doomed}); }
    }
    return boardOwnerId;
  }

  function clearActiveWeather(state){ for(const x of state.weatherCards)moveToGrave(state,x.ownerId,x.inst); state.weatherCards=[]; refreshWeather(state); }
  function playWeather(state,playerId,inst){
    const d=getDef(inst);
    if(hasAbility(d,"clear")){ clearActiveWeather(state); moveToGrave(state,playerId,inst); log(state,"CLEAR_WEATHER",{playerId}); return; }
    const duplicate=state.weatherCards.some(x=>getDef(x.inst).name===d.name);
    if(duplicate){ moveToGrave(state,playerId,inst); log(state,"DUPLICATE_WEATHER_DISCARDED",{playerId,cardId:inst.cardId}); return; }
    state.weatherCards.push({inst,ownerId:playerId}); refreshWeather(state); log(state,"WEATHER_APPLIED",{playerId,cardId:inst.cardId,abilities:d.abilities.filter(a=>["frost","fog","rain"].includes(a))});
  }

  function canPlay(state,playerId){ const p=state.players[playerId]; return !!p && (p.hand.length>0 || leaderAvailable(state,playerId)); }
  function autoPassIfNeeded(state,playerId,reason){
    const p=state.players[playerId]; if(!state.autoPass || !p || p.passed || canPlay(state,playerId))return false;
    p.passed=true; log(state,"AUTO_PASS",{playerId,reason:reason||"no_actions"}); return true;
  }
  function settleAutoPassAtRoundStart(state){
    if(!state.autoPass || state.pendingChoice || state.winner)return;
    autoPassIfNeeded(state,"p1","round_start"); autoPassIfNeeded(state,"p2","round_start");
    if(state.players.p1.passed&&state.players.p2.passed){resolveRound(state);return;}
    if(state.currentPlayerId && state.players[state.currentPlayerId].passed)state.currentPlayerId=otherPlayer(state.currentPlayerId);
  }
  function validateTurn(state,playerId){ if(state.setupPhase==="mulligan")throw new Error("Mulligan is not finished"); if(state.winner)throw new Error("Match already over"); if(state.pendingChoice)throw new Error("Choice pending"); if(state.currentPlayerId!==playerId)throw new Error("Not current player's turn"); if(state.players[playerId].passed)throw new Error("Player already passed"); }
  function advanceTurn(state,actingPlayerId){
    autoPassIfNeeded(state,actingPlayerId,"end_turn");
    const other=otherPlayer(actingPlayerId); if(!state.players[other].passed)state.currentPlayerId=other; else state.currentPlayerId=actingPlayerId;
    if(state.players.p1.passed&&state.players.p2.passed)resolveRound(state);
  }

  function playCard(stateIn,action){
    const state=deepClone(stateIn), playerId=action.playerId; validateTurn(state,playerId); const inst=removeFromHand(state,playerId,action.iid), d=getDef(inst); const resume={kind:"turn",playerId};
    if(d.type==="weather"){ playWeather(state,playerId,inst); advanceTurn(state,playerId); return state; }
    if(d.type==="special"){
      if(hasAbility(d,"horn")||hasAbility(d,"mardroeme")){
        const row=action.row; if(!ROWS.includes(row))throw new Error("Special requires row"); if(state.players[playerId].board.special[row]||state.players[playerId].board.leaderHorn[row])throw new Error("Row special slot occupied"); state.players[playerId].board.special[row]=inst;
        if(hasAbility(d,"mardroeme"))transformBerserkers(state,playerId,row);
        log(state,"ROW_SPECIAL_PLACED",{playerId,row,iid:inst.iid,cardId:inst.cardId}); advanceTurn(state,playerId); return state;
      }
      if(hasAbility(d,"scorch")){ const doomed=resolveGlobalScorch(state,null); moveToGrave(state,playerId,inst); log(state,"SCORCH_RESOLVED",{playerId,sourceIid:inst.iid,doomed}); advanceTurn(state,playerId); return state; }
      if(hasAbility(d,"decoy")){
        const loc=locateBoardUnit(state,playerId,action.targetIid); if(!loc)throw new Error("Decoy target missing"); const td=getDef(loc.card); if(!isReviveUnit(td))throw new Error("Invalid Decoy target");
        removeBoardCard(state,playerId,loc.row,loc.card.iid,"hand"); state.players[playerId].board[loc.row].push(inst); log(state,"DECOY_SWAP",{playerId,targetIid:loc.card.iid,row:loc.row}); advanceTurn(state,playerId); return state;
      }
      throw new Error("Unhandled special: "+d.id);
    }
    if(d.type!=="unit")throw new Error("Cannot play card type: "+d.type);
    const row=action.row||validRowsFor(d)[0]; placeUnitCore(state,playerId,inst,row,{resume});
    if(state.pendingChoice){ state.pendingResume=resume; return state; }
    advanceTurn(state,playerId); return state;
  }

  function leaderWeatherFromDeck(state,playerId,ability){ const p=state.players[playerId]; let idx=-1; for(let i=p.deck.length-1;i>=0;i--){if(hasAbility(getDef(p.deck[i]),ability)){idx=i;break;}} if(idx<0)return null; const inst=p.deck.splice(idx,1)[0]; playWeather(state,playerId,inst); return inst; }
  function applyLeaderHorn(state,playerId,row){ if(state.players[playerId].board.special[row]||state.players[playerId].board.leaderHorn[row])return false; state.players[playerId].board.leaderHorn[row]=true; log(state,"LEADER_HORN",{playerId,row}); return true; }
  function finishLeader(state,playerId){ state.players[playerId].leaderUsed=true; log(state,"LEADER_USED",{playerId,leaderId:state.players[playerId].leaderId}); advanceTurn(state,playerId); }
  function activateLeader(stateIn,action){
    const state=deepClone(stateIn), pid=action.playerId; validateTurn(state,pid); if(!leaderAvailable(state,pid))throw new Error("Leader unavailable"); const token=leaderAbilityToken(state,pid), opp=otherPlayer(pid), resume={kind:"turn",playerId:pid}; state.leaderReveal=null;
    switch(token){
      case "foltest_king": leaderWeatherFromDeck(state,pid,"fog"); break;
      case "foltest_lord": clearActiveWeather(state); log(state,"LEADER_CLEAR_WEATHER",{playerId:pid}); break;
      case "foltest_siegemaster": applyLeaderHorn(state,pid,"siege"); break;
      case "foltest_steelforged": log(state,"LEADER_ROW_SCORCH",{playerId:pid,row:"siege",doomed:resolveRowScorch(state,opp,"siege")}); break;
      case "foltest_son": log(state,"LEADER_ROW_SCORCH",{playerId:pid,row:"ranged",doomed:resolveRowScorch(state,opp,"ranged")}); break;
      case "emhyr_imperial": leaderWeatherFromDeck(state,pid,"rain"); break;
      case "emhyr_emperor": {
        const hand=state.players[opp].hand.slice(), reveal=[]; for(let n=Math.min(3,hand.length);n>0;n--){const j=randomIndex(state,hand.length); reveal.push(hand.splice(j,1)[0].iid);} state.leaderReveal={playerId:pid,opponentId:opp,iids:reveal}; log(state,"LEADER_REVEAL_HAND",state.leaderReveal); break;
      }
      case "emhyr_relentless": {
        const cand=state.players[opp].grave.filter(i=>isReviveUnit(getDef(i))); if(cand.length){ if(!action.targetIid){setPending(state,{type:"leader_steal_grave",playerId:pid,opponentId:opp,candidateIids:cand.map(i=>i.iid)},resume); state.pendingResume=resume; return state;} resolveLeaderSteal(state,pid,opp,action.targetIid); } break;
      }
      case "eredin_commander": applyLeaderHorn(state,pid,"close"); break;
      case "eredin_bringer_of_death": {
        const cand=state.players[pid].grave.filter(i=>isReviveUnit(getDef(i))); if(cand.length){ if(!action.targetIid){setPending(state,{type:"leader_return_grave",playerId:pid,candidateIids:cand.map(i=>i.iid)},resume); state.pendingResume=resume; return state;} resolveLeaderReturn(state,pid,action.targetIid); } break;
      }
      case "eredin_destroyer": {
        if(state.players[pid].hand.length<2||!state.players[pid].deck.length)break;
        if(!action.discardIids||action.discardIids.length!==2||!action.deckTargetIid){ setPending(state,{type:"leader_destroyer",playerId:pid,handIids:state.players[pid].hand.map(i=>i.iid),deckIids:state.players[pid].deck.map(i=>i.iid)},resume); state.pendingResume=resume; return state; }
        resolveDestroyer(state,pid,action.discardIids,action.deckTargetIid); break;
      }
      case "eredin_king": {
        const cand=state.players[pid].deck.filter(i=>getDef(i).type==="weather"); if(cand.length){ if(!action.targetIid){setPending(state,{type:"leader_weather_choice",playerId:pid,candidateIids:cand.map(i=>i.iid)},resume);state.pendingResume=resume;return state;} resolveLeaderWeatherChoice(state,pid,action.targetIid); } break;
      }
      case "francesca_queen": log(state,"LEADER_ROW_SCORCH",{playerId:pid,row:"close",doomed:resolveRowScorch(state,opp,"close")}); break;
      case "francesca_beautiful": applyLeaderHorn(state,pid,"ranged"); break;
      case "francesca_pureblood": leaderWeatherFromDeck(state,pid,"frost"); break;
      case "francesca_hope": optimizeAgileRows(state,pid); break;
      case "crach_an_craite": shuffleGravesIntoDecks(state); break;
      default: throw new Error("Unsupported active leader: "+token);
    }
    finishLeader(state,pid); return state;
  }
  function resolveLeaderSteal(state,pid,opp,targetIid){ const h=findIn(state.players[opp].grave,targetIid); if(!h||!isReviveUnit(getDef(h.card)))throw new Error("Invalid grave target"); const inst=state.players[opp].grave.splice(h.index,1)[0]; state.players[pid].hand.push(inst); log(state,"LEADER_STOLE_GRAVE_CARD",{playerId:pid,targetIid,from:opp}); }
  function resolveLeaderReturn(state,pid,targetIid){ const h=findIn(state.players[pid].grave,targetIid); if(!h||!isReviveUnit(getDef(h.card)))throw new Error("Invalid grave target"); const inst=state.players[pid].grave.splice(h.index,1)[0]; state.players[pid].hand.push(inst); log(state,"LEADER_RETURNED_GRAVE_CARD",{playerId:pid,targetIid}); }
  function resolveLeaderWeatherChoice(state,pid,targetIid){ const h=findIn(state.players[pid].deck,targetIid); if(!h||getDef(h.card).type!=="weather")throw new Error("Invalid weather target"); const inst=state.players[pid].deck.splice(h.index,1)[0]; playWeather(state,pid,inst); log(state,"LEADER_WEATHER_FROM_DECK",{playerId:pid,targetIid}); }
  function resolveDestroyer(state,pid,discardIids,deckTargetIid){
    if(new Set(discardIids).size!==2)throw new Error("Need two distinct discards"); for(const iid of discardIids){const h=findIn(state.players[pid].hand,iid);if(!h)throw new Error("Discard not in hand"); const inst=state.players[pid].hand.splice(h.index,1)[0];moveToGrave(state,pid,inst);} const d=findIn(state.players[pid].deck,deckTargetIid);if(!d)throw new Error("Deck target missing"); const pick=state.players[pid].deck.splice(d.index,1)[0];state.players[pid].hand.push(pick);log(state,"LEADER_DESTROYER_RESOLVED",{playerId:pid,discardIids,deckTargetIid});
  }
  function optimizeAgileRows(state,pid){
    const agile=[]; for(const row of ["close","ranged"]){ for(const inst of state.players[pid].board[row])if(getDef(inst).row==="agile")agile.push({inst,current:row}); }
    if(!agile.length)return;
    const originals={close:state.players[pid].board.close.slice(),ranged:state.players[pid].board.ranged.slice()}; let bestScore=-Infinity,bestMask=0;
    for(let mask=0;mask<(1<<agile.length);mask++){
      state.players[pid].board.close=originals.close.filter(i=>!agile.some(a=>a.inst.iid===i.iid)); state.players[pid].board.ranged=originals.ranged.filter(i=>!agile.some(a=>a.inst.iid===i.iid));
      agile.forEach((a,i)=>state.players[pid].board[(mask&(1<<i))?"ranged":"close"].push(a.inst)); const score=rowScore(state,pid,"close")+rowScore(state,pid,"ranged"); if(score>bestScore){bestScore=score;bestMask=mask;}
    }
    state.players[pid].board.close=originals.close.filter(i=>!agile.some(a=>a.inst.iid===i.iid)); state.players[pid].board.ranged=originals.ranged.filter(i=>!agile.some(a=>a.inst.iid===i.iid));
    agile.forEach((a,i)=>state.players[pid].board[(bestMask&(1<<i))?"ranged":"close"].push(a.inst)); log(state,"LEADER_OPTIMIZED_AGILE",{playerId:pid,count:agile.length,score:bestScore});
  }
  function shuffleGravesIntoDecks(state){ for(const pid of ["p1","p2"]){ const grave=state.players[pid].grave.splice(0); for(const inst of grave)addToDeckRandom(state,pid,inst); } log(state,"CRACH_SHUFFLED_GRAVES",{}); }

  function resolveChoice(stateIn,action){
    const state=deepClone(stateIn), c=state.pendingChoice; if(!c)throw new Error("No pending choice"); const resume=c.resume||state.pendingResume||null; state.pendingChoice=null;
    if(c.type==="scoiatael_first"){
      if(!c.candidatePlayerIds.includes(action.playerId))throw new Error("Invalid first player"); state.firstPlayerId=action.playerId;state.currentPlayerId=action.playerId;state.roundStarterId=action.playerId;log(state,"SCOIATAEL_FIRST_PLAYER_CHOSEN",{chooser:c.playerId,firstPlayerId:action.playerId});settleAutoPassAtRoundStart(state);return state;
    }
    if(c.type==="medic"){
      if(!c.candidateIids.includes(action.targetIid))throw new Error("Invalid Medic target"); reviveFromGrave(state,c.playerId,action.targetIid,action.row||null,resume);
    } else if(c.type==="revive_row"){
      if(!c.candidateRows.includes(action.row))throw new Error("Invalid revive row"); reviveFromGrave(state,c.playerId,c.targetIid,action.row,resume);
    } else if(c.type==="leader_steal_grave"){
      if(!c.candidateIids.includes(action.targetIid))throw new Error("Invalid target"); resolveLeaderSteal(state,c.playerId,c.opponentId,action.targetIid); state.players[c.playerId].leaderUsed=true; log(state,"LEADER_USED",{playerId:c.playerId,leaderId:state.players[c.playerId].leaderId});
    } else if(c.type==="leader_return_grave"){
      if(!c.candidateIids.includes(action.targetIid))throw new Error("Invalid target"); resolveLeaderReturn(state,c.playerId,action.targetIid); state.players[c.playerId].leaderUsed=true; log(state,"LEADER_USED",{playerId:c.playerId,leaderId:state.players[c.playerId].leaderId});
    } else if(c.type==="leader_weather_choice"){
      if(!c.candidateIids.includes(action.targetIid))throw new Error("Invalid target"); resolveLeaderWeatherChoice(state,c.playerId,action.targetIid); state.players[c.playerId].leaderUsed=true; log(state,"LEADER_USED",{playerId:c.playerId,leaderId:state.players[c.playerId].leaderId});
    } else if(c.type==="leader_destroyer"){
      resolveDestroyer(state,c.playerId,action.discardIids||[],action.deckTargetIid); state.players[c.playerId].leaderUsed=true; log(state,"LEADER_USED",{playerId:c.playerId,leaderId:state.players[c.playerId].leaderId});
    } else if(c.type==="skellige_row"){
      if(!["close","ranged"].includes(action.row))throw new Error("Invalid Skellige row"); reviveFromGrave(state,c.playerId,c.targetIid,action.row,resume);
    } else throw new Error("Unsupported choice: "+c.type);

    if(state.pendingChoice)return state; state.pendingResume=null; finishResume(state,resume); return state;
  }

  function pass(stateIn,action){ const state=deepClone(stateIn),pid=action.playerId;validateTurn(state,pid);state.players[pid].passed=true;log(state,"PLAYER_PASSED",{playerId:pid});advanceTurn(state,pid);return state; }
  function pickRoundWinner(state,s1,s2){ if(s1>s2)return"p1";if(s2>s1)return"p2";if(state.players.p1.faction==="nilfgaard"&&state.players.p2.faction!=="nilfgaard")return"p1";if(state.players.p2.faction==="nilfgaard"&&state.players.p1.faction!=="nilfgaard")return"p2";return null; }

  function chooseMonsterRetention(state,pid){ const units=ROWS.flatMap(r=>state.players[pid].board[r].filter(i=>isReviveUnit(getDef(i)))); return units.length?units[randomIndex(state,units.length)].iid:null; }
  function clearRoundBoard(state,retentions){
    clearActiveWeather(state);
    for(const pid of ["p1","p2"]){ const p=state.players[pid];
      for(const row of ROWS){
        const snapshot=p.board[row].slice(); p.board[row]=[];
        for(const inst of snapshot){ if(retentions[pid]===inst.iid){p.board[row].push(inst);continue;} const d=getDef(inst); if(inst.ephemeral){log(state,"EPHEMERAL_REMOVED",{playerId:pid,iid:inst.iid,cardId:inst.cardId});}else p.grave.push(inst); if(hasAbility(d,"avenger"))spawnAvenger(state,pid,"avenger");if(hasAbility(d,"avenger_kambi"))spawnAvenger(state,pid,"avenger_kambi"); }
        const sp=p.board.special[row]; if(sp){moveToGrave(state,pid,sp);p.board.special[row]=null;} p.board.leaderHorn[row]=false;
      }
      p.passed=false;p.retainedIid=retentions[pid]||null;
    }
  }
  function prepareSkelligeRound3(state){
    if(state.round!==3)return; for(const pid of ["p1","p2"]){ if(state.players[pid].faction!=="skellige")continue; const candidates=state.players[pid].grave.filter(i=>isReviveUnit(getDef(i))).slice(); for(let k=0;k<2&&candidates.length;k++){const j=randomIndex(state,candidates.length);const inst=candidates.splice(j,1)[0];state.roundStartQueue.push({type:"skellige_revive",playerId:pid,targetIid:inst.iid});} }
  }
  function processRoundStartQueue(state){
    while(state.roundStartQueue.length&&!state.pendingChoice){ const item=state.roundStartQueue.shift(); if(item.type!=="skellige_revive")continue; const h=findIn(state.players[item.playerId].grave,item.targetIid); if(!h)continue; const d=getDef(h.card); if(d.row==="agile"){setPending(state,{type:"skellige_row",playerId:item.playerId,targetIid:item.targetIid}, {kind:"round_start"});return;} const inst=state.players[item.playerId].grave.splice(h.index,1)[0]; placeUnitCore(state,item.playerId,inst,validRowsFor(d)[0],{resume:{kind:"round_start"}}); log(state,"SKELLIGE_REVIVE",{playerId:item.playerId,iid:inst.iid,cardId:inst.cardId}); if(state.pendingChoice)return; }
    if(!state.pendingChoice){log(state,"ROUND_START_EFFECTS_COMPLETE",{round:state.round});settleAutoPassAtRoundStart(state);}
  }
  function startNextRound(state,winnerId){
    state.round++; state.roundStarterId=winnerId||state.roundStarterId; state.currentPlayerId=state.roundStarterId;
    if(winnerId&&state.players[winnerId].faction==="realms")drawOne(state,winnerId);
    prepareSkelligeRound3(state);processRoundStartQueue(state);log(state,"ROUND_STARTED",{round:state.round,currentPlayerId:state.currentPlayerId});
  }
  function resolveRound(state){
    const scores=scoreSnapshot(state),winnerId=pickRoundWinner(state,scores.p1.total,scores.p2.total); if(winnerId)state.players[otherPlayer(winnerId)].health--;else{state.players.p1.health--;state.players.p2.health--;}
    state.roundHistory.push({round:state.round,scores,winnerId});log(state,"ROUND_ENDED",{round:state.round,winnerId,scores});
    const retain={p1:state.players.p1.faction==="monsters"?chooseMonsterRetention(state,"p1"):null,p2:state.players.p2.faction==="monsters"?chooseMonsterRetention(state,"p2"):null};
    clearRoundBoard(state,retain);
    const p1Dead=state.players.p1.health<=0,p2Dead=state.players.p2.health<=0;if(p1Dead||p2Dead){state.winner=p1Dead&&p2Dead?"draw":p1Dead?"p2":"p1";log(state,"MATCH_ENDED",{winner:state.winner});return;}
    startNextRound(state,winnerId);
  }

  function assistedView(stateIn,viewerId,opts){ const state=deepClone(stateIn);opts=opts||{};escalateClassification(state,"assisted");const opp=otherPlayer(viewerId);return{classification:state.classification,viewerId,scores:scoreSnapshot(state),ownHand:state.players[viewerId].hand,opponentHand:opts.revealOpponentHand?state.players[opp].hand:state.players[opp].hand.map(()=>({hidden:true})),ownDeckCount:state.players[viewerId].deck.length,opponentDeckCount:state.players[opp].deck.length,eventLog:state.eventLog}; }
  function markAssisted(stateIn,reason){const s=deepClone(stateIn);escalateClassification(s,"assisted");log(s,"ASSIST_ENABLED",{reason:reason||"unspecified"});return s;}
  function cheatDraw(stateIn,action){const s=deepClone(stateIn);escalateClassification(s,"modified");const c=drawOne(s,action.playerId);log(s,"CHEAT_DRAW",{playerId:action.playerId,iid:c&&c.iid});return s;}
  function sandboxSetTurn(stateIn,playerId){const s=deepClone(stateIn);escalateClassification(s,"sandbox");s.currentPlayerId=playerId;log(s,"SANDBOX_SET_TURN",{playerId});return s;}

  function legalActions(state,playerId){
    if(state.setupPhase==="mulligan"||state.winner||state.pendingChoice||state.currentPlayerId!==playerId||state.players[playerId].passed)return[]; const acts=[{type:"PASS",playerId}]; if(leaderAvailable(state,playerId))acts.push({type:"ACTIVATE_LEADER",playerId});
    for(const inst of state.players[playerId].hand){
      const d=getDef(inst);
      if(d.type==="unit"){
        for(const row of validRowsFor(d)) acts.push({type:"PLAY_CARD",playerId,iid:inst.iid,row});
      } else if(d.type==="weather"){
        acts.push({type:"PLAY_CARD",playerId,iid:inst.iid});
      } else if(d.type==="special"&&(hasAbility(d,"horn")||hasAbility(d,"mardroeme"))){
        for(const row of ROWS){
          if(!state.players[playerId].board.special[row]&&!state.players[playerId].board.leaderHorn[row]) acts.push({type:"PLAY_CARD",playerId,iid:inst.iid,row});
        }
      } else if(d.type==="special"&&hasAbility(d,"scorch")){
        acts.push({type:"PLAY_CARD",playerId,iid:inst.iid});
      } else if(d.type==="special"&&hasAbility(d,"decoy")){
        for(const row of ROWS){
          for(const target of state.players[playerId].board[row]){
            if(isReviveUnit(getDef(target))) acts.push({type:"PLAY_CARD",playerId,iid:inst.iid,targetIid:target.iid});
          }
        }
      }
    }
    return acts;
  }
  function applyAction(state,action){ if(action.type==="MULLIGAN_CARD")return mulliganCard(state,action); if(action.type==="FINISH_MULLIGAN")return finishMulligan(state); if(action.type==="PLAY_CARD")return playCard(state,action); if(action.type==="PASS")return pass(state,action); if(action.type==="ACTIVATE_LEADER")return activateLeader(state,action); if(action.type&&action.type.startsWith("RESOLVE_"))return resolveChoice(state,action); throw new Error("Unknown action type"); }

  class HistorySession{constructor(initialState){this.states=[deepClone(initialState)];this.index=0;}get state(){return deepClone(this.states[this.index]);}commit(next){this.states=this.states.slice(0,this.index+1);this.states.push(deepClone(next));this.index++;return this.state;}undo(){if(this.index>0)this.index--;return this.state;}redo(){if(this.index<this.states.length-1)this.index++;return this.state;}}

  function abilityCoverage(){ const tokens=new Set();for(const d of Object.values(CARD_DB))for(const a of d.abilities)tokens.add(a);return{catalogCards:Object.keys(CARD_DB).length,tokens:[...tokens].sort(),supported:[...tokens].filter(a=>SUPPORTED_ABILITIES.has(a)).sort(),unsupported:[...tokens].filter(a=>!SUPPORTED_ABILITIES.has(a)).sort(),leaders:Object.values(CARD_DB).filter(d=>d.type==="leader").length}; }

  return {CARD_DB,ROWS,SUPPORTED_ABILITIES,DECK_RULES,validateDeck,assertLegalDeck,createMatch,mulliganCard,finishMulligan,playCard,activateLeader,resolveChoice,pass,applyAction,rowEffects,rowScore,totalScore,scoreSnapshot,legalActions,leaderAvailable,canPlay,assistedView,markAssisted,cheatDraw,sandboxSetTurn,HistorySession,abilityCoverage,helpers:{deepClone,getDef,otherPlayer,effectiveCardPower,validRowsFor,isReviveUnit,locateAny,nextRng,randomIndex}};
});
