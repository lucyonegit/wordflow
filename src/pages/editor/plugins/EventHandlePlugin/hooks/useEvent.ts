import { useEffect } from 'react';
import { LexicalEditor } from 'lexical';

import { useStore } from '../../../../../store/global';
import { type Word } from '../../../nodes/WordNode';
import { handleKeyUp } from '../utils/eventHandle';
export const useEvent = (editor: LexicalEditor) => {
  const setSelectedIds = useStore((state) => state.setSelectedIds);
  useEffect(() => {
    const rootDom = editor.getRootElement();
    const handle = () =>
      handleKeyUp(editor, (words: Array<Word>, node: any) => {
        console.log(words, node);
        setSelectedIds(words)
      });
    rootDom && rootDom.addEventListener('mouseup', handle);
    return () => {
      rootDom && rootDom.removeEventListener('mouseup', handle);
    };
  }, [editor, setSelectedIds]);
};
