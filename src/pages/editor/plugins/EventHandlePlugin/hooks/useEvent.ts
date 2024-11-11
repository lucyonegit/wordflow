import { useEffect } from 'react';
import { LexicalEditor } from 'lexical';

import { useStore } from '../../../../../store/global';
import { handleKeyUp } from '../utils/eventHandle';
export const useEvent = (editor: LexicalEditor) => {
  const setSelectedIds = useStore((state) => state.setSelectedIds);
  useEffect(() => {
    const rootDom = editor.getRootElement();

    const handle = () =>
      handleKeyUp(editor, (node: any) => {
        console.log(node);
      });
    rootDom && rootDom.addEventListener('mouseup', handle);
    return () => {
      rootDom && rootDom.removeEventListener('mouseup', handle);
    };
  }, [editor, setSelectedIds]);
};
