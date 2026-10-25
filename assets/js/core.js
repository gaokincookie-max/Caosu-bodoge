// 盤上大戦 — core.js
function persist(){try{localStorage.setItem(KEY,JSON.stringify({decks:data.decks,settings:data.settings}))}catch(e){}}

function preset(type){let roster={},positions=Array(30).fill(null);const put=(t,r,c)=>{roster[t]=(roster[t]||0)+1;positions[idx(r,c)]=t};if(type==='chess'){['cr','cn','cb','cq','ck','cb','cn','cr'].forEach((t,i)=>put(t,0,i+1));for(let c=1;c<9;c++)put('cp',1,c)}else if(type==='shogi'){['sl','sn','ss','sg','sk','sg','ss','sn','sl'].forEach((t,i)=>put(t,0,i+1));put('sr',1,2);put('sb',1,8);for(let c=1;c<10;c++)put('sp',2,c)}else if(type==='checkers'){for(let r=0;r<3;r++)for(let c=0;c<10;c++)if((r+c)%2===0)put('dm',r,c)}return {id:Math.random().toString(36).slice(2),name:type==='chess'?'伝統チェス':type==='shogi'?'伝統将棋':'チェッカー隊',roster,positions}}
if(!data.decks.length){data.decks=[preset('chess'),preset('shogi'),preset('checkers')];persist()}

function stat(d){let cost=0,count=0;for(const [t,n] of Object.entries(d.roster)){cost+=(META[t]?.cost||0)*n;count+=n}let placed=d.positions.filter(Boolean).length;let valid=cost<=40&&count>=12&&count<=30&&placed>=8&&d.positions.every((t,i)=>!t||t!=='dm'||((Math.floor(i/10)+(i%10))%2===0));for(const t in d.roster)if((META[t]?.max||0)<d.roster[t])valid=false;for(const t in META){if(d.positions.filter(x=>x===t).length>(d.roster[t]||0))valid=false}return {cost,count,placed,valid}}

function esc(s){return String(s).replace(/[&<>"']/g,a=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[a]))}

function setMode(m){mode=m;renderSetup()}

function startGame(){const d1=data.decks[selfIdx],d2=data.decks[enemyIdx];if(!stat(d1).valid||!stat(d2).valid){toast('デッキの編成条件を確認してください');return}game={board:Array(100).fill(null),hands:[{},{}],turn:0,ply:0,nextId:0,history:[],last:null,enPassant:null,finished:false,mode};for(let owner=0;owner<2;owner++){const d=owner?d2:d1;for(let r=0;r<3;r++)for(let c=0;c<10;c++){const t=d.positions[idx(r,c)];if(!t)continue;const target=owner?idx(r,c):idx(9-r,9-c);game.board[target]=makePiece(t,owner)}game.hands[owner].ot=d.roster.ot||0}selection=null;rotation=false;view('battle');renderBattle();if(mode==='cpu'&&game.turn===1)scheduleCpu()}

function shogiGold(dr,dc,forward){return (dr===forward&&Math.abs(dc)<=1)||(dr===0&&Math.abs(dc)===1)||(dr===-forward&&dc===0)}

function attackSquares(i,b=game.board){const p=b[i];if(!p)return [];if(p.type==='cp'){const [r,c]=rc(i),fw=p.owner===0?-1:1;return [-1,1].map(dc=>idx(r+fw,c+dc)).filter(j=>j>=0&&j<100&&Math.abs(j%10-c)===1)}if(p.type==='dm')return movesFor(i,b).filter(m=>m.capture!=null).map(m=>m.to);return movesFor(i,b).map(m=>m.to)}

function isAttacked(i,by,b=game.board){for(let j=0;j<100;j++)if(b[j]&&b[j].owner===by&&attackSquares(j,b).includes(i))return true;return false}

function castleMoves(i){const p=game.board[i];if(!p||p.type!=='ck'||p.moved)return[];const [r,c]=rc(i),res=[];if(isAttacked(i,1-p.owner))return res;for(let k=0;k<10;k++){const other=game.board[idx(r,k)];if(!other||other.owner!==p.owner||other.type!=='cr'||other.moved||k===c)continue;const dir=Math.sign(k-c);if(Math.abs(k-c)<3)continue;let clear=true;for(let x=c+dir;x!==k;x+=dir)if(game.board[idx(r,x)])clear=false;if(!clear)continue;const passage=idx(r,c+dir),target=idx(r,c+2*dir);if(isAttacked(passage,1-p.owner)||isAttacked(target,1-p.owner))continue;res.push({from:i,to:target,castle:true,rookFrom:idx(r,k),rookTo:idx(r,c+dir)})}return res}

function activeSide(){return mode==='cpu'?0:game.turn}
