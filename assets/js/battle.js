// 盤上大戦 — battle.js
function pieceHTML(p){
 if(!p)return '';
 let cls='piece '+(p.owner===0?'white':'black');
 if(p.type[0]==='s')cls+=' shogi';
 if(p.type==='dm')cls+=' check';
 if(p.type==='ot')cls+=' othello';
 let ico=META[p.type].icon;
 if(p.promoted){
  if(p.type==='dm')ico='♛';
  else if(p.type==='sr')ico='龍';
  else if(p.type==='sb')ico='馬';
  else if(p.type[0]==='s')ico='成'+ico;
  else ico=META[p.promoted].icon;
 }
 return `<span class="${cls}" aria-hidden="true">${p.type==='ot'?'':p.type==='dm'?(p.promoted?ico:'◆'):ico}</span>`;
}

function renderBattle(){if(!game)return;const turn=game.turn;const top=rotation?0:1,bottom=1-top;function info(owner){return `<div class="side-info"><strong>${owner===0?'白':'黒'}陣営 ${game.turn===owner?'●':''}</strong><small>${mode==='cpu'&&owner===1?'CPU':owner===0?'プレイヤー1':'プレイヤー2'} · ${owner===0?'先手':'後手'}</small></div><span class="pill">${score(owner)}点</span><small class="muted">${Math.floor(game.ply/2)+(turn===1?1:0)}/40</small>`} $('enemyInfo').innerHTML=info(top);$('selfInfo').innerHTML=info(bottom);renderHand('enemyHand',top);renderHand('selfHand',bottom);let legal=selection?selection.kind==='board'?selection.chain?movesFor(selection.index).filter(m=>m.jump&&!(selection.captured||[]).includes(m.capture)):legalFrom(selection.index):dropLegal(selection.type,game.turn):[];let flip=selection?.previewFlip||[];const grid=$('battleBoard');grid.innerHTML='';for(let display=0;display<100;display++){const i=displayIndex(display),[r,c]=rc(i),p=game.board[i],btn=document.createElement('button');btn.className='sq '+((r+c)%2?'dark ':'')+(selection?.kind==='board'&&selection.index===i?'selected ':'')+(game.last?.includes(i)?'last ':'')+(legal.some(m=>m.to===i)?(legal.some(m=>m.to===i&&m.capture!=null)?'take ':'move '):'')+(flip.includes(i)?'preview ':'');btn.innerHTML=pieceHTML(p);btn.title=p?descPiece(p):'';btn.onclick=()=>boardTap(i);grid.append(btn)}$('battleStatus').textContent=game.finished?'対局終了':selection?.chain?'連続ジャンプ：次の着地点を選択':selection?.kind==='hand'?'持ち駒：配置するマスを選択':`第${Math.min(40,Math.floor(game.ply/2)+1)}巡 · ${turn===0?'白':'黒'}の手番`}

function score(owner){return game.board.reduce((s,p)=>s+(p&&p.owner===owner?(p.type==='ck'||p.type==='sk'?5:1):0),0)}

function renderHand(elId,owner){let entries=Object.entries(game.hands[owner]).filter(([t,n])=>n>0);let active=owner===game.turn&&!(mode==='cpu'&&owner===1);$(elId).innerHTML=`<div class="handname"><span>${owner===0?'白':'黒'}の駒台</span><span>${entries.reduce((s,[,n])=>s+n,0)}個</span></div><div class="handpieces">${entries.length?entries.map(([t,n])=>`<button class="handpiece ${selection?.kind==='hand'&&selection.type===t&&game.turn===owner?'on':''}" ${active?'':'disabled'} onclick="selectHand('${t}',${owner})">${META[t].icon}<small>×${n}</small></button>`).join(''):'<span class="mini" style="color:#eedcc4aa">持ち駒なし</span>'}</div>`}

function selectHand(t,owner){if(game.finished||waitCpu||game.turn!==owner)return;if(selection?.chain)return;selection={kind:'hand',type:t};renderBattle()}

function cancelSelection(){if(selection?.chain){toast('連続ジャンプの途中では解除できません');return}selection=null;renderBattle()}

function boardTap(i){if(game.finished||waitCpu)return;const p=game.board[i];if(selection?.kind==='hand'){if(game.board[i]){toast('そこには配置できません');return}if(!dropLegal(selection.type,game.turn).some(m=>m.to===i)){toast('配置できないマスです');return}if(selection.type==='ot'&&data.settings.confirmOthello){const flips=othelloFlip(i,game.turn);selection.previewFlip=flips;renderBattle();modal('オセロの配置',`<p>このマスに石を置きます。</p><p class="notice">寝返る駒：<strong>${flips.length}体</strong>${flips.some(j=>['ck','sk'].includes(game.board[j]?.type))?' · 王を反転！':''}</p>`,[['配置する',()=>{closeModal();applyDrop('ot',i)}],['取消',()=>{closeModal();selection.previewFlip=null;renderBattle()},true]]);return}applyDrop(selection.type,i);return}
if(selection?.kind==='board'){const legal=selection.chain?movesFor(selection.index).filter(m=>m.jump&&!(selection.captured||[]).includes(m.capture)):legalFrom(selection.index);const m=legal.find(m=>m.to===i);if(m){applyMove(m);return}if(selection.chain){toast('連続ジャンプしてください');return}}
if(p&&p.owner===game.turn){selection={kind:'board',index:i};renderBattle();return}selection=null;renderBattle()}

function addHand(owner,t){game.hands[owner][t]=(game.hands[owner][t]||0)+1}

function capturePiece(p,by){if(!p)return; if((p.type==='ck'||p.type==='sk'))return; if(kingPresent(game.board,by,'sk')){} }

function handleCaptured(captured,attacker,owner){if(!captured||captured.type==='ck'||captured.type==='sk')return;if(attacker.type[0]==='s'&&kingPresent(game.board,owner,'sk'))addHand(owner,captured.promoted==='chess'? 'cp':captured.type)}

function promoteChoice(p,to,done){const [r]=rc(to),owner=p.owner,fw=owner===0?-1:1;if(p.type==='dm'){if(r===(owner===0?0:9)){p.promoted='king'}done();return}if(!canPromote(p,owner)){done();return}if(p.type==='cp'&&r===(owner===0?0:9)){if(mode==='cpu'&&owner===1){p.promoted='cq';done();return}modal('プロモーション','ポーンの昇格先を選んでください。',[...['cq','cr','cb','cn'].map(t=>[META[t].name,()=>{p.promoted=t;closeModal();done()}])]);return}if(p.type[0]==='s'&&!['sk','sg'].includes(p.type)&&!p.promoted){const [fromR]=rc(selection?.originalFrom??to);const zone=x=>owner===0?x<=2:x>=7;const applicable=zone(fromR)||zone(r);if(!applicable){done();return}const forced=(['sp','sl'].includes(p.type)&&r===(owner===0?0:9))||(p.type==='sn'&&(owner===0?r<=1:r>=8));if(forced){p.promoted='shogi';done();return}if(mode==='cpu'&&owner===1){p.promoted='shogi';done();return}modal('成りの選択',`<p>${META[p.type].name}を成りますか？</p>`,[['成る',()=>{p.promoted='shogi';closeModal();done()}],['成らない',()=>{closeModal();done()},true]]);return}done()}

function applyDrop(t,to){const owner=game.turn;game.board[to]=makePiece(t,owner);game.board[to].fromDrop=true;game.board[to].moved=true;game.hands[owner][t]--;if(!game.hands[owner][t])delete game.hands[owner][t];const flips=t==='ot'?othelloFlip(to,owner):[];let lostKing=false;for(const j of flips){const p=game.board[j];if(['ck','sk'].includes(p.type))lostKing=true;p.owner=owner}game.last=[to];game.passes=0;game.history.push(`${owner===0?'白':'黒'} ${META[t].name}配置${toLabel(to)}${flips.length?' / '+flips.length+'体反転':''}`);selection=null;if(lostKing){finish(owner,'王・キングを寝返らせた');return}endTurn()}

function applyMove(m){const owner=game.turn,p=game.board[m.from],before=m.from;selection={kind:'board',index:m.to,originalFrom:before,chain:!!selection?.chain,captured:selection?.captured||[]};game.board[m.from]=null;const victim=m.capture!=null?game.board[m.capture]:null;if(m.capture!=null){if(p.type==='dm'&&m.jump){selection.captured.push(m.capture)}else{game.board[m.capture]=null;handleCaptured(victim,p,owner)}}game.board[m.to]=p;p.moved=true;if(m.castle){game.board[m.rookTo]=game.board[m.rookFrom];game.board[m.rookFrom]=null;game.board[m.rookTo].moved=true}game.enPassant=null;game.passes=0;if(m.double){const [fr,fc]=rc(m.from),[tr]=rc(m.to);game.enPassant={target:idx((fr+tr)/2,fc),pawnIndex:m.to,owner}}
if(p.type==='dm'&&m.jump){game.pendingCaptures??=[];game.pendingCaptures.push({index:m.capture,piece:victim,by:owner});if(victim&&['ck','sk'].includes(victim.type))game.chainKingCaptured=true;const [r]=rc(m.to);if(r===(owner===0?0:9)&&!p.promoted){p.promoted='king'}else{const again=movesFor(m.to).filter(a=>a.jump&&!selection.captured.includes(a.capture));if(again.length){selection.index=m.to;selection.chain=true;renderBattle();if(mode==='cpu'&&owner===1){setTimeout(()=>{const next=movesFor(m.to).filter(a=>a.jump&&!selection.captured.includes(a.capture));if(next.length)applyMove(next[0])},180)}return}}}
const final=()=>{if(game.pendingCaptures?.length){for(const q of game.pendingCaptures)game.board[q.index]=null;game.pendingCaptures=[]}const dead=(!!victim&&['ck','sk'].includes(victim.type))||(game.chainKingCaptured===true);game.chainKingCaptured=false;game.last=[before,m.to];game.history.push(`${owner===0?'白':'黒'} ${META[p.type].name} ${toLabel(before)}→${toLabel(m.to)}${m.capture!=null?' 捕獲':''}${m.castle?' キャスリング':''}`);selection=null;if(dead){finish(owner,'王・キングを捕獲した');return}endTurn()};promoteChoice(p,m.to,final)}

function toLabel(i){const [r,c]=rc(i);return `${c+1}-${10-r}`}

function endTurn(){if(game.board.filter(p=>p&&p.owner===1-game.turn).length===0){finish(game.turn,'相手の盤上の駒を全滅させた');return}game.ply++;if(game.ply>=80){scoreFinish();return}game.turn=1-game.turn;selection=null;renderBattle();if(mode==='cpu'&&game.turn===1)scheduleCpu()}

function finish(winner,reason){game.finished=true;renderBattle();modal('対局終了',`<div style="text-align:center;font-size:27px;color:#f1d29a;font-weight:800;margin:15px 0">${winner===0?'白':'黒'}陣営の勝利</div><p class="muted" style="text-align:center">${reason}</p><p class="muted" style="text-align:center">白 ${score(0)}点 ／ 黒 ${score(1)}点</p>`,[['メニューへ',()=>{closeModal();view('home')}],['盤面を見る',closeModal,true]])}

function scoreFinish(){const a=score(0),b=score(1);if(a===b){game.finished=true;renderBattle();modal('引き分け',`40手ずつが終了しました。双方${a}点です。`,[['メニューへ',()=>{closeModal();view('home')}],['盤面を見る',closeModal,true]])}else finish(a>b?0:1,'40手終了：得点判定')}

function scheduleCpu(){waitCpu=true;renderBattle();setTimeout(()=>{if(!game||game.finished||game.turn!==1){waitCpu=false;return}cpuMove();waitCpu=false;renderBattle()},430)}

function cpuMove(){const owner=1,options=[];for(let i=0;i<100;i++)if(game.board[i]?.owner===owner)for(const m of legalFrom(i)){const victim=m.capture!=null?game.board[m.capture]:null;let val=victim?(victim.type==='ck'||victim.type==='sk'?100:META[victim.type].cost*1.5):0;val+=Math.random()*2;options.push({m,val})}for(const [t,n] of Object.entries(game.hands[owner]))if(n>0){const drops=dropLegal(t,owner);for(const d of drops){let val=Math.random()*2;if(t==='ot')val+=othelloFlip(d.to,owner).length*5;options.push({drop:t,to:d.to,val})}}if(!options.length){game.history.push('黒 パス');game.passes=(game.passes||0)+1;if(game.passes>=2){scoreFinish();return}endTurn();return}options.sort((a,b)=>b.val-a.val);const best=options[0];if(best.drop){const old=data.settings.confirmOthello;applyDrop(best.drop,best.to)}else applyMove(best.m)}

function availableActions(owner){for(let i=0;i<100;i++)if(game.board[i]?.owner===owner&&legalFrom(i).length)return true;for(const [t,n] of Object.entries(game.hands[owner]))if(n>0&&dropLegal(t,owner).length)return true;return false}

function tryPass(){if(game.finished||waitCpu)return;if(availableActions(game.turn)){toast('合法手があるためパスできません');return}game.history.push(`${game.turn===0?'白':'黒'} パス`);game.passes=(game.passes||0)+1;if(game.passes>=2){scoreFinish();return}endTurn()}

function flipBoard(){rotation=!rotation;renderBattle()}

function confirmLeave(){modal('対局から戻る','対局の途中経過は保存されません。',[['終了する',()=>{game=null;closeModal();view('home')}],['続ける',closeModal,true]])}

function showBattleMenu(){modal('対局メニュー',`<p class="muted">${game.turn===0?'白':'黒'}の手番 · ${game.ply}/80手</p><p>白 ${score(0)}点 ／ 黒 ${score(1)}点</p>`,[['続ける',closeModal],['投了',()=>{closeModal();finish(1-game.turn,'相手が投了した')},true],['終了',()=>{closeModal();confirmLeave()},true]])}

function openHistory(){modal('棋譜・行動ログ',`<div class="help-details" style="max-height:48dvh;overflow:auto">${game.history.length?game.history.map((s,i)=>`<div style="border-bottom:1px solid #506057;padding:4px">${i+1}. ${esc(s)}</div>`).join(''):'まだ行動がありません'}</div>`,[['閉じる',closeModal]])}

function setSetting(k,v){data.settings[k]=v;persist()}
