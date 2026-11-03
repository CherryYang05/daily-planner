import { icon } from './icons.js';
import { initialData } from './seed.js';
import {
  loadData,persistData,validateData,isoDate,shiftDate,parseLocalDate,makeId,
  orderedTasks,progress,percent,planProgress,unitTasks,unitStatus,dateTasks,
  remainingMinutes,GROUP_ORDER,STATUS_LABEL
} from './store.js';

const root=document.getElementById('app');
const state={
  data:loadData(initialData),view:'today',date:isoDate(),planId:initialData.plans[0]?.id||null,
  unitId:null,drawer:null,query:'',filter:'all',menuOpen:false,sidebarOpen:false,
  toast:'',error:'',storageOk:true
};
const weekNames=['日','一','二','三','四','五','六'];
const fmtDate=(date,options={})=>new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',...options}).format(parseLocalDate(date));
const fmtDay=date=>`星期${weekNames[parseLocalDate(date).getDay()]}`;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtMin=n=>n>=60?`${Math.floor(n/60)} 小时${n%60?` ${n%60} 分钟`:''}`:`${n} 分钟`;
const classify=t=>t.status==='done'?'done':t.status==='doing'?'doing':'todo';
const pctBar=(p,color='')=>`<div class="progress-track ${color}" role="progressbar" aria-label="已完成 ${p.done} 项，共 ${p.total} 项" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent(p)}"><span style="width:${percent(p)}%"></span></div>`;
const findUnit=id=>state.data.units.find(x=>x.id===id);
const findPlan=id=>state.data.plans.find(x=>x.id===id);
const findTask=id=>state.data.tasks.find(x=>x.id===id);
const totalProgress=()=>progress(state.data.tasks);
function save(){try{state.data=persistData(state.data);state.storageOk=true;}catch(e){state.storageOk=false;state.error='浏览器未能保存数据。请检查存储权限，并立即使用“导出备份”保存当前修改。';console.error(e);}render();}
function flash(message){state.toast=message;render();}
function taskMatches(t){const query=state.query.trim().toLocaleLowerCase();return (!query||`${t.title} ${t.notes||''} ${t.criteria||''} ${t.result||''}`.toLocaleLowerCase().includes(query))&&(state.filter==='all'||t.status===state.filter);}
function headerTitle(){switch(state.view){case'today':return '今日工作台';case'plans':return '学习计划';case'unit':return '学习单元';case'day':return '每日安排';default:return '总览';}}
function navButton(view,label,iconName){return `<button class="nav-item ${state.view===view?'active':''}" data-action="view" data-view="${view}" aria-current="${state.view===view?'page':'false'}">${icon(iconName,19)}<span>${label}</span>${state.view===view?'<span class="nav-active-dot"></span>':''}</button>`;}
function side(){const p=totalProgress();return `<aside class="sidebar ${state.sidebarOpen?'show':''}" aria-label="主导航">
 <div class="brand"><span class="brand-mark">${icon('check',21)}</span><div><strong>Daily Planner</strong><small>把计划落实到今天</small></div><button class="icon-button mobile-only" aria-label="关闭导航" data-action="sidebar">${icon('x')}</button></div>
 <div class="nav-kicker">工作空间</div><nav class="main-nav">
 ${navButton('today','今日工作台','sun')}${navButton('day','每日安排','calendar')}${navButton('plans','学习计划','layers')}${navButton('overview','全部概览','grid')}
 </nav>
 <div class="sidebar-plan-title"><span>当前计划</span><button class="tiny-add" aria-label="新建计划" title="新建计划" data-action="new-plan">${icon('plus',16)}</button></div>
 <div class="sidebar-plans">${state.data.plans.length?state.data.plans.map(p=>{
 const pp=planProgress(state.data,p.id);return `<button class="sidebar-plan ${state.planId===p.id?'selected':''}" data-action="select-plan" data-id="${esc(p.id)}"><span class="sidebar-plan-name">${esc(p.title)}</span><span class="sidebar-plan-meta">${pp.done}/${pp.total} · ${percent(pp)}%</span>${pctBar(pp)}</button>`;}).join(''):'<p class="side-empty">还没有创建计划</p>'}</div>
 <div class="sidebar-spacer"></div>
 <div class="sidebar-footer"><button data-action="export">${icon('download',18)}<span>导出数据备份</span></button><button data-action="import">${icon('upload',18)}<span>导入 JSON 文件</span></button></div>
 <div class="local-pill"><span class="local-dot"></span> 本地模式 · 自动保存</div>
 </aside>`;}
function top(){return `<header class="topbar">
  <div class="topbar-left"><button class="icon-button mobile-only" data-action="sidebar" aria-label="打开导航">${icon('menu')}</button><span class="topbar-location">个人工作台 <span class="crumb-sep">/</span> <strong>${headerTitle()}</strong></span></div>
  <div class="topbar-right"><label class="search-box">${icon('search',17)}<input id="global-search" type="search" placeholder="搜索任务  /" value="${esc(state.query)}" aria-label="搜索任务" /><kbd>/</kbd></label><button class="primary-button" data-action="new-task">${icon('plus',18)}<span>新建任务</span></button></div>
 </header>`;}
function taskRow(t){const isDone=t.status==='done';return `<div class="task-row ${isDone?'is-done':''}" data-task-id="${esc(t.id)}">
 <button class="task-check ${isDone?'checked':''}" data-action="toggle" data-id="${esc(t.id)}" aria-label="${isDone?'重新打开':'标记完成'}：${esc(t.title)}" title="${isDone?'重新打开任务':'标记任务完成'}">${isDone?icon('check',14):''}</button>
 <button class="task-main" data-action="edit-task" data-id="${esc(t.id)}"><span class="task-title">${esc(t.title)}</span><span class="task-row-sub">${esc(t.group_name||'任务')}<span class="sub-sep">·</span>${fmtMin(Number(t.minutes)||0)}${t.status==='doing'?' <span class="inline-state">进行中</span>':''}${t.focus?' <span class="focus-mark">重点</span>':''}</span></button>
 <div class="task-tail"><span class="task-date">${fmtDate(t.date)}</span><button class="task-arrow" data-action="edit-task" data-id="${esc(t.id)}" aria-label="查看 ${esc(t.title)} 的详情">${icon('chevron',17)}</button></div>
 </div>`;}
function taskList(items,emptyLabel='没有符合条件的任务'){const filtered=orderedTasks(items.filter(taskMatches));return filtered.length?`<div class="task-list">${filtered.map(taskRow).join('')}</div>`:`<div class="empty-inline">${icon('inbox',18)} ${esc(emptyLabel)}</div>`;}
function dateStrip(){const dates=Array.from({length:7},(_,i)=>shiftDate(state.date,i-3));return `<div class="date-strip"><button class="icon-button date-arrow" data-action="date-shift" data-delta="-7" aria-label="上一周">${icon('left')}</button><div class="date-week">${dates.map(d=>{
  const num=parseLocalDate(d).getDate(),today=d===isoDate();return `<button class="date-tile ${state.date===d?'active':''}" data-action="set-date" data-date="${d}" aria-pressed="${state.date===d}"><span>${fmtDay(d).replace('星期','周')}</span><strong>${num}</strong>${today?'<i aria-label="今天"></i>':''}</button>`;}).join('')}</div><button class="icon-button date-arrow" data-action="date-shift" data-delta="7" aria-label="下一周">${icon('chevron')}</button></div>`;}
function sectionHeader(title,detail='',right=''){return `<div class="section-header"><div><h2>${esc(title)}</h2>${detail?`<span class="section-detail">${esc(detail)}</span>`:''}</div>${right}</div>`;}
function taskGroups(tasks,opts={}){
 const byGroup=GROUP_ORDER.map(group=>({group,tasks:tasks.filter(t=>(t.group_name||'其他')===group)})).filter(g=>g.tasks.length);
 return byGroup.map(({group,tasks:groupTasks})=>`<section class="group-block"><div class="group-heading"><h3>${esc(group)}</h3><span>${groupTasks.filter(t=>t.status==='done').length}/${groupTasks.length}</span></div>${taskList(groupTasks)}</section>`).join('')||'<div class="empty-panel">当前日期没有任务。可以添加小任务，或者从其他日期调整任务的执行日期。</div>';
}
function todayPage(){const today=isoDate(),todayList=dateTasks(state.data,today),todayP=progress(todayList),carry=state.data.tasks.filter(t=>t.date<today&&t.status==='doing');
 const focus=todayList.filter(t=>t.focus&&t.status!=='done');const focusList=focus.length?focus:orderedTasks(todayList.filter(t=>t.status!=='done')).slice(0,3);
 return `<div class="page"><div class="page-heading"><div class="heading-top">${fmtDate(today,{year:'numeric'})} · ${fmtDay(today)}</div><div class="heading-row"><div><h1>今天，专注推进。</h1><p>把长期计划分解到每一个可以完成的行动。</p></div><button class="ghost-button" data-action="view" data-view="day">查看日程 ${icon('arrow',16)}</button></div></div>
 <section class="overview-band" aria-label="今日进度"><div class="overview-primary"><span class="overview-label">今日已完成</span><div class="overview-value">${todayP.done}<span> / ${todayP.total}</span></div>${pctBar(todayP)}</div><div class="overview-stat"><span>待投入时间</span><strong>${fmtMin(remainingMinutes(todayList))}</strong><small>基于未完成任务的预估</small></div><div class="overview-stat"><span>持续推进</span><strong>${carry.length} 项</strong><small>此前日期尚在进行中</small></div></section>
 <div class="main-grid"><div class="content-column">
 <section>${sectionHeader(focus.length?'今日重点':'建议先做',focus.length?'已标记为重点的待办':'从今日未完成任务中自动选取')}${focusList.length?`<div class="priority-list">${taskList(focusList)}</div>`:`<div class="empty-panel">今天已经完成全部待办，或者还没有安排任务。${`<button class="inline-link" data-action="new-task">添加一项任务 ${icon('arrow',14)}</button>`}</div>`}</section>
 <section>${sectionHeader('今日任务',`${todayP.done}/${todayP.total} 项已完成`)}${taskGroups(todayList)}</section>
 ${carry.length?`<section>${sectionHeader('继续推进',`${carry.length} 项来自之前的日期`)}${taskList(carry)}</section>`:''}
 </div><aside class="context-column"><div class="context-head"><span>${icon('layers',18)} 学习计划</span><button data-action="view" data-view="plans">查看全部 ${icon('chevron',15)}</button></div>${planMiniCards()}</aside></div></div>`;}
function planMiniCards(){return state.data.plans.map(p=>{const p1=planProgress(state.data,p.id);const units=state.data.units.filter(u=>u.plan_id===p.id).sort((a,b)=>a.position-b.position);const next=units.find(u=>unitStatus(state.data,u)!=='done');return `<div class="mini-plan"><strong>${esc(p.title)}</strong><p>${esc(p.description||'')}</p><div class="mini-plan-numbers"><span>${p1.done} / ${p1.total} 项</span><span>${percent(p1)}%</span></div>${pctBar(p1)}${next?`<button class="next-unit" data-action="select-unit" data-id="${esc(next.id)}"><span><small>下一学习单元</small><b>${esc(next.title)}</b></span>${icon('arrow',17)}</button>`:''}</div>`;}).join('')||'<div class="empty-inline">暂无计划</div>';}
function filterbar(){return `<div class="filterbar" role="group" aria-label="任务状态筛选">${[['all','全部'],['todo','待办'],['doing','进行中'],['done','已完成']].map(([value,label])=>`<button data-action="filter" data-filter="${value}" aria-pressed="${state.filter===value}" class="${state.filter===value?'active':''}">${label}</button>`).join('')}</div>`;}
function datePage(){const p=progress(dateTasks(state.data,state.date));return `<div class="page"><div class="page-heading"><div class="heading-row"><div><div class="heading-top">每日执行</div><h1>${fmtDate(state.date,{year:'numeric'})}</h1><p>${fmtDay(state.date)} · ${p.done}/${p.total} 项完成，待投入 ${fmtMin(remainingMinutes(dateTasks(state.data,state.date)))}</p></div><div class="header-actions"><button class="ghost-button" data-action="today">回到今天</button><button class="secondary-button" data-action="new-task">${icon('plus',17)} 添加任务</button></div></div></div>
 ${dateStrip()}<div class="main-grid"><div class="content-column"><section>${sectionHeader('任务清单',`${percent(p)}% 已完成`)}${filterbar()}${taskGroups(dateTasks(state.data,state.date))}</section></div><aside class="context-column">${dayUnitCard(state.date)}</aside></div></div>`;}
function dayUnitCard(date){const units=state.data.units.filter(u=>u.date===date);if(!units.length)return '<div class="context-box"><h3>没有关联的学习单元</h3><p>可以从学习计划中进入某个单元，也可以直接安排独立任务。</p></div>';
return units.map(u=>{const p=progress(unitTasks(state.data,u.id));return `<div class="context-box"><span class="context-label">学习单元</span><h3>${esc(u.title)}</h3><p>${esc(u.notes)}</p><div class="mini-plan-numbers"><span>${p.done}/${p.total} 项</span><span>${percent(p)}%</span></div>${pctBar(p)}<button class="outline-full" data-action="select-unit" data-id="${esc(u.id)}">进入学习单元 ${icon('arrow',16)}</button></div>`;}).join('');}
function plansPage(){return `<div class="page"><div class="page-heading"><div class="heading-top">长期安排</div><div class="heading-row"><div><h1>学习计划</h1><p>从长期目标进入学习单元，再拆解成能够独立执行的小任务。</p></div><button class="secondary-button" data-action="new-plan">${icon('plus',16)} 新建计划</button></div></div>
 ${state.data.plans.map(p=>{const pp=planProgress(state.data,p.id);const units=state.data.units.filter(u=>u.plan_id===p.id).sort((a,b)=>a.position-b.position);
 return `<section class="plan-section"><div class="plan-heading"><div><div class="plan-small">${units.length} 个学习单元</div><h2>${esc(p.title)}</h2><p>${esc(p.description||'')}</p></div><div class="plan-summary"><strong>${percent(pp)}%</strong><span>${pp.done} / ${pp.total} 项完成</span>${pctBar(pp)}</div></div><div class="units-list">${units.map((u,i)=>{const p2=progress(unitTasks(state.data,u.id)),st=unitStatus(state.data,u);return `<button class="unit-row" data-action="select-unit" data-id="${esc(u.id)}"><span class="unit-index">${String(i+1).padStart(2,'0')}</span><span class="unit-content"><strong>${esc(u.title)}</strong><small>${esc(fmtDate(u.date))} · ${fmtMin(p2.minutes)}</small></span><span class="unit-progress"><span>${p2.done}/${p2.total}</span><span class="unit-progress-bar">${pctBar(p2)}</span></span><span class="unit-state ${st}">${STATUS_LABEL[st]}</span>${icon('chevron',17)}</button>`;}).join('')}</div><div class="plan-bottom"><button data-action="new-unit" data-plan="${esc(p.id)}">${icon('plus',16)} 新增学习单元</button></div></section>`;}).join('')||'<div class="empty-panel">尚无计划，点击“新建计划”开始。</div>'}</div>`;}
function unitPage(){const u=findUnit(state.unitId);if(!u){state.view='plans';return plansPage();}const tasks=unitTasks(state.data,u.id);const p=progress(tasks);return `<div class="page"><div class="page-heading"><button class="back-button" data-action="view" data-view="plans">${icon('left',16)} 返回学习计划</button><div class="heading-row"><div><div class="heading-top">${esc(findPlan(u.plan_id)?.title||'学习计划')} / ${fmtDate(u.date)}</div><h1>${esc(u.title)}</h1><p>${esc(u.notes||'按顺序完成每一项可执行任务。')}</p></div><button class="secondary-button" data-action="new-task" data-unit="${esc(u.id)}">${icon('plus',16)} 添加子任务</button></div></div>
 <section class="unit-progress-panel"><div><span>单元完成进度</span><strong>${p.done} / ${p.total} <small>项</small></strong></div><div class="unit-progress-right">${pctBar(p)}<span>${percent(p)}% · 共 ${fmtMin(p.minutes)}</span></div></section>
 <div class="main-grid"><div class="content-column"><section>${sectionHeader('可执行任务','点击任务可查看完成标准、执行说明与实际产出')}${filterbar()}${taskGroups(tasks)}</section></div><aside class="context-column"><div class="context-box"><span class="context-label">本单元目标</span><h3>${esc(u.title)}</h3><p>${esc(u.notes)}</p><div class="context-rule"></div><span class="context-label">执行日期</span><p>${fmtDate(u.date,{year:'numeric'})}</p><button class="outline-full" data-action="day-from-unit" data-date="${esc(u.date)}">查看当天安排 ${icon('arrow',16)}</button></div></aside></div></div>`;}
function overviewPage(){const all=totalProgress(),active=state.data.tasks.filter(t=>t.status==='doing'),done=state.data.tasks.filter(t=>t.status==='done');return `<div class="page"><div class="page-heading"><div class="heading-top">执行概览</div><div class="heading-row"><div><h1>全部任务，一目了然。</h1><p>了解进展，找到正在进行和仍需处理的事项。</p></div><button class="ghost-button" data-action="export">${icon('download',16)} 导出备份</button></div></div>
 <section class="overview-band"><div class="overview-primary"><span class="overview-label">总体完成率</span><div class="overview-value">${percent(all)}<span>%</span></div>${pctBar(all)}</div><div class="overview-stat"><span>进行中</span><strong>${active.length} 项</strong><small>跨所有日期</small></div><div class="overview-stat"><span>累计完成</span><strong>${done.length} 项</strong><small>${fmtMin(all.doneMinutes)} 预估工作量</small></div></section>
 <div class="main-grid"><div class="content-column"><section>${sectionHeader('进行中',`${active.length} 项`)}${taskList(active)}</section><section>${sectionHeader('全部任务',`${all.total} 项`)}${filterbar()}${taskList(state.data.tasks)}</section></div><aside class="context-column"><div class="context-head">全部计划</div>${planMiniCards()}</aside></div></div>`;}
function drawerHtml(){if(!state.drawer)return '';const {type,id,unitId,planId}=state.drawer;
 const t=type==='task'&&id?findTask(id):null;const u=type==='unit'&&id?findUnit(id):null;const p=type==='plan'&&id?findPlan(id):null;
 const name=type==='task'?'任务':type==='unit'?'学习单元':'计划';
 const current=t||u||p||{};const date=current.date||(state.view==='today'?isoDate():state.date);
 const unitOptions=state.data.units.filter(x=>!planId||x.plan_id===planId).map(x=>`<option value="${esc(x.id)}" ${(t?.parent_id||unitId)===x.id?'selected':''}>${esc(x.title)}</option>`).join('');
 const planOptions=state.data.plans.map(x=>`<option value="${esc(x.id)}" ${(current.plan_id||planId||state.planId)===x.id?'selected':''}>${esc(x.title)}</option>`).join('');
 return `<div class="drawer-backdrop" data-action="close-drawer"></div><aside class="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-heading"><div class="drawer-top"><div><div class="drawer-kicker">${id?'编辑':'新建'}${name}</div><h2 id="drawer-heading">${type==='task'?'任务详情':type==='unit'?'学习单元':'计划详情'}</h2></div><button class="icon-button" data-action="close-drawer" aria-label="关闭详情面板">${icon('x')}</button></div>
 <form id="detail-form" class="detail-form" data-kind="${type}" data-id="${esc(id||'')}">
 <label class="field"><span>${name}名称 <b>*</b></span><input name="title" required maxlength="300" value="${esc(current.title||'')}" placeholder="${type==='task'?'描述一个可执行的行动':'为它取一个清楚的名字'}" autofocus /></label>
 ${type==='task'?`<div class="form-two"><label class="field"><span>任务状态</span><select name="status"><option value="todo" ${t?.status==='todo'?'selected':''}>待办</option><option value="doing" ${t?.status==='doing'?'selected':''}>进行中</option><option value="done" ${t?.status==='done'?'selected':''}>已完成</option></select></label><label class="field"><span>预计用时（分钟）</span><input type="number" name="minutes" min="0" max="1440" value="${t?.minutes??30}" /></label></div>
 <div class="form-two"><label class="field"><span>执行日期</span><input type="date" name="date" required value="${esc(date)}" /></label><label class="field"><span>任务分组</span><select name="group_name">${GROUP_ORDER.map(g=>`<option value="${esc(g)}" ${(t?.group_name||'其他')===g?'selected':''}>${esc(g)}</option>`).join('')}</select></label></div>
 <label class="field"><span>所属学习单元</span><select name="parent_id"><option value="">独立任务</option>${unitOptions}</select></label>
 <label class="check-line"><input type="checkbox" name="focus" ${t?.focus?'checked':''}/><span>设为今日重点</span></label>
 <label class="field"><span>执行说明</span><textarea name="notes" rows="4" placeholder="记录背景、链接、思路或执行步骤">${esc(t?.notes||'')}</textarea></label>
 <label class="field"><span>完成标准</span><textarea name="criteria" rows="4" placeholder="怎样才算真正完成？留下可检验的结果">${esc(t?.criteria||'')}</textarea></label>
 <label class="field"><span>实际产出 / 过程记录</span><textarea name="result" class="result-area" rows="6" placeholder="记录关键结论、产出链接，以及还没有解决的问题">${esc(t?.result||'')}</textarea></label>`:
 type==='unit'?`<label class="field"><span>所属计划</span><select name="plan_id">${planOptions}</select></label><label class="field"><span>执行日期</span><input type="date" required name="date" value="${esc(date)}" /></label><label class="field"><span>学习目标与说明</span><textarea name="notes" rows="6" placeholder="这个单元希望完成什么？">${esc(u?.notes||'')}</textarea></label>`:
 `<label class="field"><span>计划说明</span><textarea name="description" rows="7" placeholder="这项计划的目标与范围">${esc(p?.description||'')}</textarea></label>`}
 <div class="drawer-actions"><div>${id?`<button type="button" class="destructive-button" data-action="delete-item" data-kind="${type}" data-id="${esc(id)}">${icon('trash',16)} 删除</button>`:''}</div><div class="drawer-buttons"><button type="button" class="ghost-button" data-action="close-drawer">取消</button><button type="submit" class="primary-button">${icon('check',17)} 保存${name}</button></div></div>
 </form></aside>`;}
function render(){const priorFocus=document.activeElement?.id==='global-search';let caret=0;if(priorFocus)caret=document.activeElement.selectionStart??0;
 const body=state.view==='today'?todayPage():state.view==='plans'?plansPage():state.view==='unit'?unitPage():state.view==='day'?datePage():overviewPage();
 root.innerHTML=`<div class="shell">${side()}<div class="mobile-backdrop ${state.sidebarOpen?'show':''}" data-action="sidebar"></div><div class="workspace">${top()}<main id="main" tabindex="-1">${body}</main><footer class="page-footer">Daily Planner · Local-first Preview <span>数据仅保存在当前浏览器 · 请定期导出备份</span></footer></div></div>${drawerHtml()}<input id="json-upload" type="file" accept="application/json,.json" hidden />${state.error?`<div role="alert" class="notice error">${esc(state.error)}<button data-action="clear-error" aria-label="关闭提示">${icon('x',16)}</button></div>`:''}${state.toast?`<div role="status" class="notice toast">${icon('check',18)} ${esc(state.toast)}<button data-action="clear-toast" aria-label="关闭提示">${icon('x',16)}</button></div>`:''}`;
 if(priorFocus){const input=document.getElementById('global-search');input?.focus();input?.setSelectionRange(caret,caret);}
 if(state.drawer&&state.drawer.shouldFocus){state.drawer.shouldFocus=false;requestAnimationFrame(()=>document.querySelector('#detail-form [name="title"]')?.focus());}
}
function openDrawer(type,id=null,extras={}){state.drawer={type,id,shouldFocus:true,...extras};state.sidebarOpen=false;render();}
function handleSubmit(form){const fields=new FormData(form),type=form.dataset.kind,id=form.dataset.id;
 const title=String(fields.get('title')||'').trim();if(!title){state.error='请输入名称后再保存。';render();return;}
 if(type==='task'){
  const existing=id?findTask(id):null;const unitId=String(fields.get('parent_id')||'');const u=findUnit(unitId);
  const item={...existing,id:id||makeId(),title,status:String(fields.get('status')||'todo'),date:String(fields.get('date')||isoDate()),minutes:Number(fields.get('minutes')||0),group_name:String(fields.get('group_name')||'其他'),parent_id:unitId||null,plan_id:u?.plan_id||existing?.plan_id||null,focus:fields.get('focus')==='on',notes:String(fields.get('notes')||''),criteria:String(fields.get('criteria')||''),result:String(fields.get('result')||''),position:existing?.position??999,priority:existing?.priority??2};
  if(item.minutes<0||item.minutes>1440){state.error='预计用时需要在 0～1440 分钟之间。';render();return;}
  if(existing)Object.assign(existing,item);else state.data.tasks.push(item);
 }else if(type==='unit'){
  const existing=id?findUnit(id):null;
  const planId=String(fields.get('plan_id')||'');if(!findPlan(planId)){state.error='请先选择有效的计划。';render();return;}
  const item={...existing,id:id||makeId('unit'),title,date:String(fields.get('date')||isoDate()),notes:String(fields.get('notes')||''),plan_id:planId,position:existing?.position??state.data.units.filter(u=>u.plan_id===planId).length};
  if(existing)Object.assign(existing,item);else state.data.units.push(item);
 }else{
  const existing=id?findPlan(id):null;const item={...existing,id:id||makeId('plan'),title,description:String(fields.get('description')||'')};
  if(existing)Object.assign(existing,item);else {state.data.plans.push(item);state.planId=item.id;}
 }
 state.drawer=null;state.toast=`${id?'已更新':'已创建'}${type==='task'?'任务':type==='unit'?'学习单元':'计划'}`;save();
}
function deleteItem(type,id){let message='确认删除该项目？';
 if(type==='unit'){const n=unitTasks(state.data,id).length;message=`删除学习单元会同时删除其下 ${n} 项任务，且无法撤销。确定继续？`;}
 if(type==='plan'){const n=state.data.tasks.filter(t=>t.plan_id===id).length;message=`删除计划会删除关联的学习单元及 ${n} 项任务，且无法撤销。确定继续？`;}
 if(!confirm(message))return;
 if(type==='task')state.data.tasks=state.data.tasks.filter(t=>t.id!==id);
 if(type==='unit'){state.data.units=state.data.units.filter(u=>u.id!==id);state.data.tasks=state.data.tasks.filter(t=>t.parent_id!==id);if(state.unitId===id)state.view='plans';}
 if(type==='plan'){const ids=new Set(state.data.units.filter(u=>u.plan_id===id).map(u=>u.id));state.data.plans=state.data.plans.filter(p=>p.id!==id);state.data.units=state.data.units.filter(u=>u.plan_id!==id);state.data.tasks=state.data.tasks.filter(t=>t.plan_id!==id&&!ids.has(t.parent_id));state.planId=state.data.plans[0]?.id||null;state.view='plans';}
 state.drawer=null;state.toast='已删除';save();
}
function downloadData(){const blob=new Blob([JSON.stringify(state.data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`daily-planner-backup-${isoDate()}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);flash('数据备份已导出');}
async function importData(input){const file=input.files?.[0];if(!file)return;try{
 const parsed=validateData(JSON.parse(await file.text()));if(!confirm(`即将用导入文件中的 ${parsed.plans.length} 个计划、${parsed.units.length} 个学习单元、${parsed.tasks.length} 项任务替换浏览器当前数据。请先导出备份。是否继续？`))return;
 state.data=parsed;state.planId=parsed.plans[0]?.id||null;state.view='plans';state.drawer=null;state.toast='数据已成功导入';save();
 }catch(err){state.error=`导入失败：${err.message}`;render();}finally{input.value='';}}
root.addEventListener('click',e=>{const btn=e.target.closest('[data-action]');if(!btn)return;const action=btn.dataset.action,id=btn.dataset.id;
 switch(action){
  case'view':state.view=btn.dataset.view;state.sidebarOpen=false;state.filter='all';render();break;
  case'sidebar':state.sidebarOpen=!state.sidebarOpen;render();break;
  case'new-task':openDrawer('task',null,{unitId:btn.dataset.unit|| (state.view==='unit'?state.unitId:null)});break;
  case'new-unit':openDrawer('unit',null,{planId:btn.dataset.plan||state.planId});break;
  case'new-plan':openDrawer('plan');break;
  case'edit-task':openDrawer('task',id);break;
  case'select-plan':state.planId=id;state.view='plans';state.sidebarOpen=false;render();break;
  case'select-unit':state.unitId=id;state.view='unit';state.filter='all';state.sidebarOpen=false;render();break;
  case'day-from-unit':state.date=btn.dataset.date;state.view='day';state.filter='all';render();break;
  case'close-drawer':state.drawer=null;render();break;
  case'toggle':{const task=findTask(id);if(!task)return;task.status=task.status==='done'?'todo':'done';state.toast=task.status==='done'?'任务已完成':'任务重新打开';save();break;}
  case'filter':state.filter=btn.dataset.filter;render();break;
  case'date-shift':state.date=shiftDate(state.date,Number(btn.dataset.delta));render();break;
  case'set-date':state.date=btn.dataset.date;render();break;
  case'today':state.date=isoDate();render();break;
  case'export':downloadData();break;
  case'import':document.getElementById('json-upload').click();break;
  case'delete-item':deleteItem(btn.dataset.kind,id);break;
  case'clear-error':state.error='';render();break;
  case'clear-toast':state.toast='';render();break;
 }
});
root.addEventListener('input',e=>{if(e.target.id==='global-search'){state.query=e.target.value;render();}});
root.addEventListener('submit',e=>{if(e.target.id==='detail-form'){e.preventDefault();handleSubmit(e.target);}});
root.addEventListener('change',e=>{if(e.target.id==='json-upload')importData(e.target);});
document.addEventListener('keydown',e=>{
 // Keep keyboard navigation inside the open editor panel.
 if(e.key==='Tab'&&state.drawer){
  const panel=document.querySelector('.detail-drawer');
  const nodes=[...(panel?.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')||[])].filter(x=>x.offsetParent!==null);
  if(nodes.length){const first=nodes[0],last=nodes[nodes.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
 }
 if(e.key==='Escape'){if(state.drawer){state.drawer=null;render();}else if(state.sidebarOpen){state.sidebarOpen=false;render();}}
 if((e.key==='/'&&!state.drawer)&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){e.preventDefault();document.getElementById('global-search')?.focus();}
 if((e.ctrlKey||e.metaKey)&&e.key==='Enter'&&state.drawer){e.preventDefault();document.getElementById('detail-form')?.requestSubmit();}
});
render();
