// 盤上大戦 — navigation.js
function view(id){document.querySelectorAll('.screen').forEach(e=>e.classList.toggle('active',e.id===id));scrollTo(0,0);if(id==='decks')renderDecks();if(id==='editor'&&edit)renderEditor();if(id==='setup')renderSetup();if(id==='settings')for(const k in data.settings)if($(k))$(k).checked=data.settings[k]}

function toast(s){const el=$('toast');el.textContent=s;el.classList.remove('hidden');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.add('hidden'),2400)}

function modal(title,content,buttons){$('overlay').innerHTML='<div class="modalbg"><div class="modal"><h3>'+title+'</h3><div id="modalbody"></div><div class="actions" id="modalactions"></div></div></div>';$('modalbody').append(typeof content==='string'?document.createRange().createContextualFragment(content):content);buttons.forEach(([label,fn,secondary])=>{const b=document.createElement('button');b.className='btn'+(secondary?' secondary':'');b.textContent=label;b.onclick=fn;$('modalactions').append(b)})}

function closeModal(){$('overlay').innerHTML=''}
