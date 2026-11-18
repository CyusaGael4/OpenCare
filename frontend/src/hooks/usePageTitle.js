import { useEffect } from 'react';

const SUFFIX = 'OpenCare';

/** Set the document title for the current page, restoring nothing on unmount. */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SUFFIX}` : SUFFIX;
  }, [title]);
}

export default usePageTitle;
