import { describe, expect, it } from 'vitest'
import { loadWorkspace, saveWorkspace } from './workspace-storage'
import type { WorkspaceState } from '../domain/workspace'

class MemoryStorage { value:string|null=null; getItem(){return this.value} setItem(_k:string,v:string){this.value=v} }
const base=():WorkspaceState=>({projects:[{id:'p1',name:'P',createdAt:'2026-09-14T12:00:00.000Z'}],tasks:[{id:'t1',projectId:'p1',title:'T',status:'todo',priority:'normal',createdAt:'2026-09-14T12:00:00.000Z',estimateMinutes:90}],taskTemplates:[{id:'tt1',name:'TT',createdAt:'2026-09-14T12:00:00.000Z',rootTaskKey:'a',tasks:[{key:'a',title:'A',status:'todo',priority:'normal',estimateMinutes:45}]}],projectTemplates:[{id:'pt1',name:'PT',createdAt:'2026-09-14T12:00:00.000Z',projectName:'P',lists:[],tasks:[{key:'a',title:'A',status:'todo',priority:'normal',estimateMinutes:120}]}]})
describe('Time estimate workspace storage',()=>{
 it('round-trips live and template estimates in version 1',()=>{const s=new MemoryStorage();saveWorkspace(s as any,base());expect(loadWorkspace(s as any)).toEqual(base())})
 it('keeps legacy version-1 data without estimates valid',()=>{const s=new MemoryStorage();const state=base();delete state.tasks[0]!.estimateMinutes;delete state.taskTemplates![0]!.tasks[0]!.estimateMinutes;delete state.projectTemplates![0]!.tasks[0]!.estimateMinutes;saveWorkspace(s as any,state);expect(loadWorkspace(s as any)).toEqual(state)})
 it('rejects invalid persisted estimates in live and template Tasks',()=>{for(const value of [0,-1,1.5,'30']){for(const path of ['live','taskTemplate','projectTemplate'] as const){const doc:any={version:1,workspace:base()};if(path==='live')doc.workspace.tasks[0].estimateMinutes=value;else if(path==='taskTemplate')doc.workspace.taskTemplates[0].tasks[0].estimateMinutes=value;else doc.workspace.projectTemplates[0].tasks[0].estimateMinutes=value;const s=new MemoryStorage();s.value=JSON.stringify(doc);expect(()=>loadWorkspace(s as any)).toThrow('Workspace storage is invalid')}}})
})
