import { useEffect, useState } from 'react'

import { useStore } from '../../../../../store/global'

interface CursorIndex {
  next: number
  prev: number
}


const useCursor = (editor, ranges): [CursorIndex, () => void] => {
  const selectedIds = useStore(state => state.selectedIds)
  const [cursorIndex, setCursorIndex] = useState({
    next: -2,
    prev: -2
  });
  const resetCursor = () => {
    setCursorIndex({
      next: -2,
      prev: -2
    })
  }
  useEffect(() => {
    // 当有选中的节点与有搜索结果的时候时才进行计算
    if (selectedIds && selectedIds.length && ranges.length) {
      const selectedRange = [selectedIds[0].st, selectedIds[selectedIds.length - 1].ed];
      let next = -2;
      let prev = -2;
      ranges.forEach(rangeItem => {
        if (rangeItem.timeRange[0] >= selectedRange[1] && next === -2) {
          // 第一个满足start>=selectedRange[1]条件的搜索结果
          next = rangeItem.index
        }
        if (rangeItem.timeRange[1] <= selectedRange[0]) {
          prev = rangeItem.index
        }
      });
      setCursorIndex({
        next,
        prev
      })
    } else {
      setCursorIndex({
        next: -2,
        prev: -2
      })
    }
  }, [editor, ranges, selectedIds])
  return [cursorIndex, resetCursor]
}

export default useCursor