import test from 'node:test';
import assert from 'node:assert/strict';
import {initialData} from '../src/seed.js';
import {progress,unitStatus,planProgress,orderedTasks,validateData,shiftDate,percent,remainingMinutes} from '../src/store.js';

test('11 units and 88 small tasks are correctly seeded',()=>{
 assert.equal(initialData.units.length,11);
 assert.equal(initialData.tasks.length,88);
 assert.equal(initialData.tasks.filter(t=>t.parent_id===initialData.units[0].id).length,8);
});
test('recorded completion progress of day one and day two',()=>{
 assert.equal(initialData.tasks.filter(t=>t.status==='done').length,8);
 assert.equal(unitStatus(initialData,initialData.units[0]),'doing');
 assert.equal(unitStatus(initialData,initialData.units[1]),'doing');
 assert.equal(unitStatus(initialData,initialData.units[2]),'todo');
 assert.deepEqual(planProgress(initialData,initialData.plans[0].id).done,8);
});
test('progress is derived from children rather than manually edited unit state',()=>{
 const children=initialData.tasks.filter(t=>t.parent_id===initialData.units[0].id);
 const p=progress(children);
 assert.deepEqual({done:p.done,total:p.total,minutes:p.minutes},{done:5,total:8,minutes:180});
 assert.equal(percent(p),63);
 assert.equal(remainingMinutes(children),75);
});
test('sorting prioritizes doing, todo, then done',()=>{
 const t=[{id:'1',title:'a',status:'done',position:0},{id:'2',title:'b',status:'todo',position:0},{id:'3',title:'c',status:'doing',position:0}];
 assert.deepEqual(orderedTasks(t).map(x=>x.id),['3','2','1']);
});
test('date arithmetic respects month and year boundaries',()=>{
 assert.equal(shiftDate('2026-11-30',1),'2026-12-01');
 assert.equal(shiftDate('2026-12-31',1),'2027-01-01');
});
test('import schema validation rejects broken data',()=>{
 assert.throws(()=>validateData({tasks:[]}),/plans/);
 assert.throws(()=>validateData({plans:[{id:1,title:'bad'}],units:[],tasks:[]}),/无效/);
 assert.equal(validateData(initialData).tasks.length,88);
});
