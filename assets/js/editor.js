// 盤上大戦 — editor.js
function renderDecks(){$('decklist').innerHTML=data.decks.map((d,i)=>{const s=stat(d);return `<div class="deckcard"><strong>${esc(d.name)} ${s.valid?'✓':'⚠'}</strong><small>${s.cost}/40コスト · ${s.count}枠 · 初期${s.placed}体</small><div class="row" style="margin-top:10px"><button class="btn small" onclick="editDeck(${i})">編集する</button><button class="btn secondary small" onclick="duplicateDeck(${i})">複製</button><button class="btn ghost small" onclick="deleteDeck(${i})">削除</button></div></div>`}).join('')}

function createDeck(){edit=preset('chess');edit.name='新しいデッキ';edit.roster={};edit.positions=Array(30).fill(null);edit.new=true;editorTab('roster');view('editor')}

function editDeck(i){edit=copy(data.decks[i]);edit.index=i;editorTab('roster');view('editor')}

function duplicateDeck(i){const d=copy(data.decks[i]);d.id=Math.random().toString(36).slice(2);d.name+=' コピー';data.decks.push(d);persist();renderDecks()}

function deleteDeck(i){if(data.decks.length<=1){toast('最後のデッキは削除できません');return}modal('デッキを削除','このデッキを削除しますか？',[['削除',()=>{data.decks.splice(i,1);persist();closeModal();renderDecks()}],['キャンセル',closeModal,true]])}

function saveDeck(){const s=stat(edit);if(!s.valid){editorTab('formation');toast('編成条件を満たしていません');return}const d=copy(edit);delete d.index;delete d.new;if(edit.new)data.decks.push(d);else data.decks[edit.index]=d;persist();toast('デッキを保存しました');view('decks')}

function renameDeck(){const i=document.createElement('input');i.className='field';i.value=edit.name;i.maxLength=24;modal('デッキ名',i,[['変更',()=>{edit.name=i.value.trim()||'無題のデッキ';closeModal();renderEditor()}],['キャンセル',closeModal,true]])}

function editorTab(tab){editTab=tab;if($('editor').classList.contains('active'))renderEditor()}

function renderEditor(){$('tabRoster').classList.toggle('on',editTab==='roster');$('tabFormation').classList.toggle('on',editTab==='formation');$('rosterUI').classList.toggle('hidden',editTab!=='roster');$('formationUI').classList.toggle('hidden',editTab!=='formation');const s=stat(edit);$('editname').textContent=edit.name;$('editcost').textContent=`コスト ${s.cost}/40`;$('editcount').textContent=`枚数 ${s.count}/30`;$('editplaced').textContent=`配置 ${s.placed}/8以上`;$('costfill').style.width=Math.min(100,s.cost/40*100)+'%';$('editerror').className=s.valid?'mini valid':'mini invalid';$('editerror').textContent=s.valid?'編成可能 · 保存できます':s.cost>40?'コスト超過':s.count<12?'デッキは12枠以上必要':s.placed<8?'初期配置8体以上が必要':'枚数か配置に問題があります';if(editTab==='roster')renderRoster();else renderFormation()}

function renderRoster(){$('filters').innerHTML=[['all','全て'],['chess','チェス'],['shogi','将棋'],['checkers','チェッカー'],['othello','オセロ']].map(([k,n])=>`<button class="${filter===k?'on':''}" onclick="filter='${k}';renderRoster()">${n}</button>`).join('');$('pieceList').innerHTML=Object.entries(META).filter(([k,m])=>filter==='all'||m.group===filter).map(([t,m])=>`<div class="piece-item"><span class="piece-symbol">${m.icon}</span><div class="piece-text"><strong>${m.name}</strong><small>${m.cost}コスト · 最大${m.max}枚</small></div><button class="countbtn" onclick="changeCount('${t}',-1)">−</button><strong class="count">${edit.roster[t]||0}</strong><button class="countbtn" onclick="changeCount('${t}',1)">＋</button></div>`).join('')}

function changeCount(t,n){const before=edit.roster[t]||0,after=before+n;if(after<0||after>META[t].max)return;if(n>0&&stat(edit).cost+META[t].cost>40){toast('コストが40を超えます');return}if(n>0&&stat(edit).count>=30){toast('30枠が上限です');return}if(n<0&&edit.positions.filter(x=>x===t).length>after){toast('先に盤面から駒を外してください');return}if(after)edit.roster[t]=after;else delete edit.roster[t];renderEditor()}

function clearFormation(){edit.positions=Array(30).fill(null);renderEditor()}

function formationPreset(type){const p=preset(type);edit.roster=p.roster;edit.positions=p.positions;placeType=null;renderEditor();toast('原作配置を読み込みました')}

function renderFormation(){
  // The editor uses the very same ten-by-ten square grid as the match.
  // Only the bottom three ranks are editable; positions are stored as 0..29.
  let html='<div class="board board--formation" aria-label="初期配置盤">';
  for(let row=0;row<10;row++)for(let c=0;c<10;c++){
    const local=(row-7)*10+c;
    const active=row>=7;
    const t=active?edit.positions[local]:null;
    const p=t?makePiece(t,0):null;
    html+=`<button type="button" class="sq ${(row+c)%2?'dark ':''}${active?'formation-active':'formation-inactive'}" ${active?`onclick="placeAt(${local})"`:'disabled'} aria-label="${active?(t?META[t].name:'空きマス'):'配置不可'}">${p?pieceHTML(p):''}</button>`;
  }
  html+='</div>';
  $('formationBoard').innerHTML=html;
  $('placeSelected').textContent=placeType?META[placeType].name:'消去モード';
  $('formationTray').innerHTML='<button class="'+(!placeType?'on':'')+'" onclick="placeType=null;renderFormation()">取り外し</button>'+Object.entries(edit.roster).filter(([t,n])=>n>0&&t!=='ot').map(([t,n])=>{let free=n-edit.positions.filter(x=>x===t).length;return `<button class="${placeType===t?'on':''}" onclick="placeType='${t}';renderFormation()">${META[t].name} 残${free}</button>`}).join('');
}

function placeAt(i){const t=edit.positions[i];if(t){edit.positions[i]=null;renderEditor();return}if(!placeType)return;if(placeType==='dm'&&(Math.floor(i/10)+i%10)%2){toast('チェッカーは暗色マスのみ');return}if(edit.positions.filter(x=>x===placeType).length>=(edit.roster[placeType]||0)){toast('未配置の駒がありません');return}edit.positions[i]=placeType;renderEditor()}
