import { create } from 'zustand'

import { Word } from '../pages/editor/nodes/WordNode'
interface Store {
  currentTime: number
  selectedIds: Array<Word>
  setCurrentTime: (time: number) => void
  setSelectedIds: (ids: Array<Word>) => void
}

export const useStore = create<Store>((set) => ({
  currentTime: 0, // 当前时间
  selectedIds: [], // 选中的节点
  setCurrentTime: (time: number) => set(() => ({
    currentTime: time
  })),
  setSelectedIds: (ids: Array<Word>) => set(() => ({
    selectedIds: ids
  }))
}))