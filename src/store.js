export const STORAGE_KEY = 'bearguin.daily-planner.local.v1';
export const STATUS_LABEL = {todo:'待办',doing:'进行中',done:'已完成'};
export const GROUP_ORDER=['原理','源码 / 仿真','工作问题','复盘','其他'];
export function isoDate(d=new Date()) {const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`;}
export function parseLocalDate(date) {const parts=String(date).split('-').map(Number);return new Date(parts[0],parts[1]-1,parts[2]);}
export function shiftDate(date,delta){const d=parseLocalDate(date);d.setDate(d.getDate()+delta);return isoDate(d);}
export function makeId(prefix='task'){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;}
export function unitTasks(data,unitId){return data.tasks.filter(t=>t.parent_id===unitId);}
export function progress(tasks){return {total:tasks.length,done:tasks.filter(t=>t.status==='done').length,minutes:tasks.reduce((s,t)=>s+(Number(t.minutes)||0),0),doneMinutes:tasks.filter(t=>t.status==='done').reduce((s,t)=>s+(Number(t.minutes)||0),0)};}
export function percent(p){return p.total?Math.round(p.done/p.total*100):0;}
export function planProgress(data,planId){return progress(data.tasks.filter(t=>t.plan_id===planId));}
export function unitStatus(data,unit){const tasks=unitTasks(data,unit.id),p=progress(tasks);return !p.total?'todo':p.done===p.total?'done':tasks.some(t=>t.status!=='todo')?'doing':'todo';}
export function orderedTasks(tasks){const weight={doing:0,todo:1,done:2};return [...tasks].sort((a,b)=>weight[a.status]-weight[b.status]||(a.position??999)-(b.position??999)||a.title.localeCompare(b.title,'zh-CN'));}
export function validateData(value){if(!value||typeof value!=='object'||!Array.isArray(value.plans)||!Array.isArray(value.units)||!Array.isArray(value.tasks))throw new Error('导入文件需要包含 plans、units、tasks 三个数组。');if(value.plans.length>1000||value.units.length>10000||value.tasks.length>50000)throw new Error('数据量超过当前版本的安全限制。');for(const item of [...value.plans,...value.units,...value.tasks]){if(!item||typeof item.id!=='string'||typeof item.title!=='string'||item.id.length>300||item.title.length>1000)throw new Error('存在无效的计划或任务记录。');}return {version:1,plans:value.plans,units:value.units,tasks:value.tasks,updatedAt:new Date().toISOString()};}
export function loadData(fallback){try{const raw=localStorage.getItem(STORAGE_KEY);return raw?validateData(JSON.parse(raw)):structuredClone(fallback);}catch(err){console.warn('本地存储读取失败，启用只读默认数据',err);return structuredClone(fallback);}}
export function persistData(value){const updated={...value,updatedAt:new Date().toISOString()};localStorage.setItem(STORAGE_KEY,JSON.stringify(updated));return updated;}
export function dateTasks(data,date){return data.tasks.filter(t=>t.date===date);}
export function remainingMinutes(tasks){return tasks.filter(t=>t.status!=='done').reduce((s,t)=>s+(Number(t.minutes)||0),0);}
