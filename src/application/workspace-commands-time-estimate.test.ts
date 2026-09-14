import { describe, expect, it } from 'vitest'

import {
  workspaceReducer,
  type WorkspaceState,
} from '../domain/workspace'
import { createTask } from '../domain/task'
import { createWorkspaceCommands } from './workspace-commands'
import type { WorkspaceStore } from './workspace-store'

class ReducerStore implements WorkspaceStore {
  state: WorkspaceState

  constructor(state: WorkspaceState) {
    this.state = state
  }

  getState() {
    return this.state
  }

  dispatch(action: Parameters<typeof workspaceReducer>[1]) {
    this.state = workspaceReducer(this.state, action)
  }

  subscribe() {
    return () => undefined
  }
}

describe('Workspace Task time estimate command', () => {
  it('sets and clears one Task estimate through one dispatch per successful change', () => {
    const state:WorkspaceState={projects:[{id:'p1',name:'P',createdAt:'2026-09-14T12:00:00.000Z'}],tasks:[createTask({id:'t1',projectId:'p1',title:'T',now:'2026-09-14T12:00:00.000Z'})]}
    const store=new ReducerStore(state); let dispatches=0; const original=store.dispatch.bind(store); store.dispatch=(action)=>{dispatches++;original(action)}
    const commands=createWorkspaceCommands(store,{nextId:()=> 'unused',now:()=> '2026-09-14T12:00:00.000Z'}) as ReturnType<typeof createWorkspaceCommands> & {changeTaskTimeEstimate?:(id:string,value:number|null)=>void}
    expect(commands.changeTaskTimeEstimate).toBeTypeOf('function')
    commands.changeTaskTimeEstimate!('t1',30); expect(store.getState().tasks[0]?.estimateMinutes).toBe(30); expect(dispatches).toBe(1)
    commands.changeTaskTimeEstimate!('t1',null); expect(store.getState().tasks[0]).not.toHaveProperty('estimateMinutes'); expect(dispatches).toBe(2)
  })
  it('rejects invalid estimates without accepting a new state', () => {
    const state:WorkspaceState={projects:[{id:'p1',name:'P',createdAt:'2026-09-14T12:00:00.000Z'}],tasks:[createTask({id:'t1',projectId:'p1',title:'T',now:'2026-09-14T12:00:00.000Z'})]}
    const store=new ReducerStore(state); const commands=createWorkspaceCommands(store,{nextId:()=> 'unused',now:()=> '2026-09-14T12:00:00.000Z'}) as any
    expect(()=>commands.changeTaskTimeEstimate('t1',0)).toThrow('Task time estimate must be a positive integer number of minutes')
    expect(store.getState().tasks[0]).not.toHaveProperty('estimateMinutes')
  })
})
