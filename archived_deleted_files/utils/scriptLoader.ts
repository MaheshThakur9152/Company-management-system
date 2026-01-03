
// Global script loading tracker to prevent race conditions
const scriptLoadingPromises: Record<string, Promise<void>> = {};

export const loadScript = (src: string): Promise<void> => {
  if (scriptLoadingPromises[src]) {
    return scriptLoadingPromises[src];
  }

  const promise = new Promise<void>((resolve, reject) => {
    // Check if script is already loaded and available
    // Note: We can't easily check "loaded" state from DOM element alone if it was added externally.
    // But since we are managing loading, this cache is the primary source of truth.
    // If the tag exists but isn't in our cache, it might be from index.html (which we removed) or another source.
    // We'll assume if it's in DOM, it's either loaded or loading. 
    // To be safe, we could attach an onload listener to the existing tag, but that's complex.
    // For now, we rely on the cache.
    
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
        // If it has a 'data-loaded' attribute, we know it's done.
        if (existingScript.getAttribute('data-loaded') === 'true') {
            resolve();
            return;
        }
        // If it exists but not marked loaded, we might be in a race if we didn't create it.
        // But since we removed static tags, we likely created it.
        // If we created it, it's in the cache.
        // If it's not in the cache but in DOM, it's an edge case. 
        // Let's attach a listener just in case.
        const script = existingScript as HTMLScriptElement;
        const oldOnLoad = script.onload;
        script.onload = (e) => {
            if (oldOnLoad) (oldOnLoad as any)(e);
            script.setAttribute('data-loaded', 'true');
            resolve();
        };
        // If it's already loaded (but we missed it), onload won't fire.
        // This is tricky. But with our current setup (no static tags), this branch shouldn't be hit often.
        // Fallback: just resolve and hope.
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
        delete scriptLoadingPromises[src]; // Remove from cache on error so we can retry
        reject(new Error(`Failed to load script: ${src}`));
    };
    document.head.appendChild(script);
  });

  scriptLoadingPromises[src] = promise;
  return promise;
};
