// Public-safe demo dataset. No user activity, private notes, or cloud credentials.
const planId='plan-demo';
const dayNames=['明确目标与约束','建立知识框架','收集资料与实例','设计实践方案','完成最小实现','验证与测试','性能与体验优化','整合与迭代','排查关键问题','整理实践成果','交付与复盘'];
const stages=['原理','源码 / 仿真','工作问题','复盘'];
const topics=[
['明确本阶段的核心目标','梳理已有知识与能力','列出关键概念与约束','查找一个参考实现','记录参考实现的输入输出','用具体例子描述问题','拆分两项可执行行动','复盘当天的收获'],
['梳理关键术语及其关系','画出主要概念的关联图','用自己的话解释工作流程','阅读核心模块的入口代码','记录重要数据结构','完成一个小型验证案例','整理尚未解决的问题','复盘知识框架与不足']
];
const fallbackTitles=['总结本单元的核心概念','建立概念之间的联系','写出一个具体示例','阅读一个实现或案例','记录关键接口与流程','动手验证一个假设','整理实践中遇到的问题','完成单元复盘'];
const minutes=[15,15,15,30,30,30,30,15];
const groupForIndex=[0,0,0,1,1,2,2,3];
const plan={id:planId,title:'示例：11 天学习与实践计划',description:'公开演示数据：11 个学习单元，每天 8 项可执行任务。可自由编辑，也可导入自己的 JSON 备份。'};
const units=dayNames.map((name,index)=>({id:'unit-day-'+(index+1),plan_id:planId,title:'Day '+(index+1)+' · '+name,date:'2026-11-'+String(index+2).padStart(2,'0'),notes:'每天从理解、实践、应用和复盘四个角度推进。',position:index}));
const tasks=[];
for(let i=0;i<units.length;i++){
 const titles=topics[i]||fallbackTitles;
 for(let j=0;j<8;j++){
  const status=i===0?([0,1,2,4,5].includes(j)?'done':'doing'):i===1?(j<=2?'done':([5,6].includes(j)?'doing':'todo')):'todo';
  tasks.push({id:'unit-day-'+(i+1)+'-task-'+(j+1),plan_id:planId,parent_id:units[i].id,title:titles[j],date:units[i].date,status,minutes:minutes[j],group_name:stages[groupForIndex[j]],criteria:'留下可检查的学习记录或实际产出。',result:'',notes:'',priority:2,focus:false,position:j});
 }
}
export const initialData={version:1,plans:[plan],units,tasks,updatedAt:'2026-11-03T00:00:00.000Z'};
