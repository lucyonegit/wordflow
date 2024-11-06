import { useEffect } from 'react';
import { LexicalEditor } from 'lexical';

export const mouseState = {
  isMouseDown: false,
  init() {
    document.addEventListener('mousedown', () => this.isMouseDown = true);
    document.addEventListener('mouseup', () => this.isMouseDown = false);
  }
};
mouseState.init();

export const useGapEvent = (editor: LexicalEditor) => {
  useEffect(() => {
    const rootDom = editor.getRootElement();
    const mouseDown = (e: any) => {
      setTimeout(() => {
        if (mouseState.isMouseDown) {
          // 获取选区范围
          const selection = window.getSelection() as Selection;
          if (selection.type === 'Caret') {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            const range = selection.getRangeAt(0) as Range;
            if (range.startOffset === range.endOffset) {
              const offset = range.startOffset;
              editor.update(() => {
                selection.extend(range.startContainer, offset + 1);
              })
            }
          }
        }
      }, 0);
    }
    rootDom && rootDom.ownerDocument.addEventListener('selectionchange', mouseDown);
    return () => {
      rootDom && rootDom.ownerDocument.removeEventListener('selectionchange', mouseDown);
    };
    
  }, [editor]);
};
