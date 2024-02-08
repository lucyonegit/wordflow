/* eslint-disable no-undef */
import { useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Button,Input } from "antd";

import useCursor from "./hooks/useCursor";
import { getSearchResultRangeList, setHighLight } from "./utils/utils";
import { RangeResult } from './utils/utils'
const SearchPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const ranges = useRef<RangeResult>([]);
  const [count, setCount] = useState(0);
  const [current, setCurrent] = useState(0);
  const [cursorIndex, resetCursor] = useCursor(editor, ranges.current);
  useEffect(() => {
    if (ranges.current.length) {
      setHighLight(ranges.current, current);
    }
  }, [current]);

  const clearHighLight = () => {
    CSS.highlights.clear();
    setCount(0);
    setCurrent(0);
  };
  const onChange = (e) => {
    const str = e.target.value;
    if (!str) {
      // 没有输入内容就清空高亮
      clearHighLight();
      return;
    }
    ranges.current = getSearchResultRangeList(editor, str);
    if (!ranges.current.length) {
      // 没有搜索到就清空高亮
      clearHighLight();
      return;
    }
    setHighLight(ranges.current, 0);
    setCount(ranges.current.length);
    setCurrent(0);
  };
  const nextHandle = () => {
    if (cursorIndex.next !== -2) {
      setCurrent(cursorIndex.next);
      resetCursor()
    } else {
      setCurrent((current + 1) % count);
    }
  };
  const prevHandle = () => {
    if (cursorIndex.prev !== -2) {
      setCurrent(cursorIndex.prev);
      resetCursor()
    } else {
      setCurrent((current - 1 + count) % count);
    }
  };
  return (
    <div style={{ width: "420px", display: "flex", flexDirection: "row" }}>
      <Button onClick={prevHandle}>上一个</Button>
      <Input width={400} placeholder="搜索" onChange={onChange}></Input>
      <Button onClick={nextHandle}>下一个</Button>
      <span>
        {count > 0 ? current + 1 : 0}/{count}
      </span>
    </div>
  );
};

export default SearchPlugin;
