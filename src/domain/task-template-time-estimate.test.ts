import { describe, expect, it } from 'vitest'
import { createProjectTemplate, instantiateProjectTemplate } from './project-template'
import { createTaskTemplate, instantiateTaskTemplate } from './task-template'
import { createTask, setTaskTimeEstimate } from './task'

describe('Template time estimates', () => {
  it('preserves estimates through Task Template creation and instantiation', () => {
    const source = setTaskTimeEstimate(createTask({ id:'task-1', projectId:'p1', title:'Estimated', now:'2026-09-14T12:00:00.000Z' }), 75)
    const template = createTaskTemplate({ id:'tt1', name:'Estimated', now:'2026-09-14T12:01:00.000Z', rootTask:source, tasks:[source] })
    expect(template.tasks[0]?.estimateMinutes).toBe(75)
    let id=0
    expect(instantiateTaskTemplate(template,{ projectId:'p2', now:'2026-09-14T13:00:00.000Z', nextId:()=>`new-${++id}` }).rootTask.estimateMinutes).toBe(75)
  })
  it('preserves estimates through Project Template creation and instantiation', () => {
    const task = setTaskTimeEstimate(createTask({ id:'task-1', projectId:'p1', title:'Estimated', now:'2026-09-14T12:00:00.000Z' }), 120)
    const template=createProjectTemplate({ id:'pt1', name:'P', now:'2026-09-14T12:01:00.000Z', project:{id:'p1',name:'P',createdAt:'2026-09-14T12:00:00.000Z'}, lists:[], tasks:[task] })
    expect(template.tasks[0]?.estimateMinutes).toBe(120)
    let id=0
    expect(instantiateProjectTemplate(template,{now:'2026-09-14T13:00:00.000Z',nextId:()=>`new-${++id}`}).tasks[0]?.estimateMinutes).toBe(120)
  })
})
