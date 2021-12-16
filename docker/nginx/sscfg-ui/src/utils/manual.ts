interface ManualInfo {
  path: string;
  priority: number;
}

const toManualInfo = (txt: string): ManualInfo => {
  const params = txt.split(',', 2);
  if (params.length > 1) {
    return {
      path: params[1],
      priority: Number(params[0]),
    };
  }
  return {
    path: txt,
    priority: 1,
  };
};

const showManual = () => {
  const manual = Array.from(document.querySelectorAll('[data-manual]'))
    .map((e) => e.getAttribute('data-manual'))
    .flatMap((x) => (x ? [x] : []))
    .map((x) => (x.startsWith('{') ? JSON.parse(x) : toManualInfo(x)));
  manual.sort((a, b) => {
    if (a.priority > b.priority) {
      return -1;
    }
    if (a.priority < b.priority) {
      return 1;
    }
    return 0;
  });
  let url = process.env.VUE_APP_MANUAL_URL ? process.env.VUE_APP_MANUAL_URL : '/manual/';
  if (manual.length > 0) {
    url += manual[0].path;
  }
  window.open(url, '_blank');
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useManual = (): Record<string, any> => ({ showManual });

export default useManual;
