// 盤上大戦 — setup.js
function renderSetup(){if(!data.decks.length)return;selfIdx=Math.min(selfIdx,data.decks.length-1);enemyIdx=Math.min(enemyIdx,data.decks.length-1);$('modeCpu').classList.toggle('on',mode==='cpu');$('modeLocal').classList.toggle('on',mode==='local');function cards(which,active){return data.decks.map((d,i)=>{const s=stat(d);return `<button class="deckcard ${active===i?'selected':''}" onclick="${which}=${i};renderSetup()"><strong>${esc(d.name)}</strong><small>${s.cost}コスト · ${s.placed}体 ${s.valid?'':'· 編成不備'}</small></button>`}).join('')}$('setupSelf').innerHTML=cards('selfIdx',selfIdx);$('setupEnemy').innerHTML=cards('enemyIdx',enemyIdx)}

function makePiece(t,owner){return {id:++game.nextId,type:t,owner,promoted:null,moved:false,fromDrop:false}}
