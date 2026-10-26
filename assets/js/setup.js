// 盤上大戦 — 対戦準備 (形式 → 自分のデッキ → 相手のデッキ)
// 対戦ロジックは core.js、画面遷移はこのファイルで担当。
let setupStage = 0;
const SETUP_TITLES = ['対戦形式を選択', '自分のデッキ', '相手のデッキ'];

function openSetup() {
  setupStage = 0;
  view('setup');
}
function chooseBattleMode(nextMode) {
  if (nextMode !== 'cpu' && nextMode !== 'local') return;
  mode = nextMode;
  setupStage = 1;
  renderSetup();
  window.scrollTo(0, 0);
}
function setupBack() {
  if (setupStage === 0) view('home');
  else { setupStage--; renderSetup(); window.scrollTo(0, 0); }
}
function nextSetupStep() {
  const deck = data.decks[selfIdx];
  if (!deck || !stat(deck).valid) { toast('編成条件を満たしたデッキを選んでください'); return; }
  setupStage = 2;
  renderSetup();
  window.scrollTo(0, 0);
}
function selectSetupDeck(side, index) {
  const deck = data.decks[index];
  if (!deck || !stat(deck).valid) return;
  if (side === 'self') selfIdx = index;
  else enemyIdx = index;
  renderSetup();
}
function deckChoiceHTML(side, selected) {
  return data.decks.map((deck, index) => {
    const s = stat(deck);
    const valid = s.valid;
    const mark = index === selected && valid;
    const groups = [...new Set(Object.keys(deck.roster).filter(k=>deck.roster[k]>0).map(k=>META[k]?.group).filter(Boolean))];
    const label = {chess:'チェス',shogi:'将棋',checkers:'チェッカー',othello:'オセロ'};
    return `<button type="button" class="deckcard setup-deck ${mark?'selected':''}" ${valid?'':'disabled'} onclick="selectSetupDeck('${side}',${index})" aria-pressed="${mark}"><span class="deckcard-heading"><strong>${esc(deck.name)}</strong><span class="deck-select-indicator">${mark?'✓ 選択中':valid?'選択':'編成不備'}</span></span><small>${s.cost}/40 コスト · ${s.count}枚 · 初期配置 ${s.placed}体</small><small>${groups.map(g=>label[g]).join(' / ')||'駒なし'}</small></button>`;
  }).join('');
}
function renderSetup() {
  if (!data.decks.length) return;
  selfIdx = Math.max(0,Math.min(selfIdx,data.decks.length-1));
  enemyIdx = Math.max(0,Math.min(enemyIdx,data.decks.length-1));
  $('setupTitle').textContent = SETUP_TITLES[setupStage];
  $('setupStep').textContent = (setupStage+1)+' / 3';
  ['Mode','Self','Enemy'].forEach((name,i)=>{
    $('setup'+name+'Page').classList.toggle('hidden',setupStage!==i);
    $('progress'+name).classList.toggle('complete',i<=setupStage);
  });
  if (setupStage>=1) $('setupSelf').innerHTML = deckChoiceHTML('self',selfIdx);
  if (setupStage===2) {
    $('setupEnemyDescription').textContent = mode==='cpu'?'CPUが使用するデッキを選択してください。':'プレイヤー2が使用するデッキを選択してください。';
    $('setupEnemy').innerHTML = deckChoiceHTML('enemy',enemyIdx);
    $('setupRecap').innerHTML = `<div class="sectiontitle">対局内容の確認</div><div class="setup-recap-row"><span>対戦形式</span><strong>${mode==='cpu'?'CPU対戦':'ローカル対戦'}</strong></div><div class="setup-recap-row"><span>自分</span><strong>${esc(data.decks[selfIdx].name)}</strong></div><div class="setup-recap-row"><span>相手</span><strong>${esc(data.decks[enemyIdx].name)}</strong></div>`;
  }
}
function makePiece(t,owner){return {id:++game.nextId,type:t,owner,promoted:null,moved:false,fromDrop:false}}
