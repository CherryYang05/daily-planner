import test from 'node:test';
import assert from 'node:assert/strict';

const handlers={};
const memory=new Map();
globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
const root={innerHTML:'',addEventListener:(name,fn)=>handlers[name]=fn};
const docHandlers={};
globalThis.document={
 activeElement:null,
 getElementById:id=>id==='app'?root:null,
 addEventListener:(name,fn)=>docHandlers[name]=fn,
 querySelector:()=>null
};
globalThis.requestAnimationFrame=fn=>fn();
await import('../src/app.js');
const click=(action,other={})=>handlers.click({target:{closest:()=>({dataset:{action,...other}})}});

test('first render shows a task-oriented dashboard',()=>{
 assert.match(root.innerHTML,/今天，专注推进/);
 assert.match(root.innerHTML,/今日任务/);
 assert.match(root.innerHTML,/本地模式/);
});
test('plan page contains all eleven learning units',()=>{
 click('view',{view:'plans'});
 assert.match(root.innerHTML,/Day 11/);
 assert.match(root.innerHTML,/学习计划/);
});
test('unit page shows task details without manual progress edit',()=>{
 click('select-unit',{id:'unit-day-1'});
 assert.match(root.innerHTML,/明确目标与约束/);
 assert.match(root.innerHTML,/明确本阶段的核心目标/);
 assert.match(root.innerHTML,/5 \/ 8/);
});
test('task completion updates status and derived parent progress',()=>{
 click('toggle',{id:'unit-day-1-task-4'});
 assert.match(root.innerHTML,/6 \/ 8/);
 assert.ok(memory.has('bearguin.daily-planner.local.v1'));
});
test('task drawer is rendered as a dialog with large record fields',()=>{
 click('edit-task',{id:'unit-day-1-task-4'});
 assert.match(root.innerHTML,/role="dialog"/);
 assert.match(root.innerHTML,/实际产出 \/ 过程记录/);
 assert.match(root.innerHTML,/name="criteria"/);
 assert.match(root.innerHTML,/name="minutes"/);
});
