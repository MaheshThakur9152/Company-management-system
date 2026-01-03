// Global script loading tracker to prevent race conditions
const scriptLoadingPromises: Record<string, Promise<void>> = {};

export const loadScript = (src: string): Promise<void> => {
  if (scriptLoadingPromises[src]) {
    return scriptLoadingPromises[src];
  }

  const promise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
        if (existingScript.getAttribute('data-loaded') === 'true') {
            resolve();
            return;
        }
        const script = existingScript as HTMLScriptElement;
        const oldOnLoad = script.onload;
        script.onload = (e) => {
            if (oldOnLoad) (oldOnLoad as any)(e);
            script.setAttribute('data-loaded', 'true');
            resolve();
        };
        resolve(); 
        return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
        script.setAttribute('data-loaded', 'true');
        resolve();
    };
    script.onerror = () => {
        delete scriptLoadingPromises[src];
        reject(new Error(`Failed to load script: ${src}`));
    };
    document.head.appendChild(script);
  });

  scriptLoadingPromises[src] = promise;
  return promise;
};
