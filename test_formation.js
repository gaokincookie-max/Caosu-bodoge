const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(__dirname+'/assets/js/core.js','utf8');
const fn=src.match(/function startGame\(\)\{.*?(?=\nfunction shogiGold)/s)[0];
const ctx={setupStage:2,mode:'local',selfIdx:0,enemyIdx:1,data:{decks:[]},game:null,selection:null,rotation:true,stat:()=>({valid:true}),makePiece:(type,owner)=>({type,owner}),idx:(r,c)=>r*10+c,view:()=>{},renderBattle:()=>{},scheduleCpu:()=>{}};
const deck=(str)=>({positions:Array.from({length:30},(_,i)=>str[i]||null),roster:{ot:0}});
const d1=deck({0:'sg',1:'cn',10:'sp',12:'dm',20:'ss',21:'cr',22:'cb'}); const d2=deck({0:'ck',12:'cp'});ctx.data.decks=[d1,d2];vm.createContext(ctx);vm.runInContext(fn,ctx);vm.runInContext('startGame()',ctx);
for(let r=0;r<3;r++)for(let c=0;c<10;c++){
  const expected=d1.positions[r*10+c];const actual=ctx.game.board[(7+r)*10+c];assert.strictEqual(actual?.type||null,expected,`white ${r},${c}`);
  const expected2=d2.positions[r*10+c];const actual2=ctx.game.board[r*10+c];assert.strictEqual(actual2?.type||null,expected2,`black ${r},${c}`)
}
console.log('PASS: editor and battle formations match for both players (all 60 cells).');
