// Simple frontend to control the iframe-based proxy.
// Maintains a small in-memory history for back/forward navigation.
(function(){
  const urlInput = document.getElementById('urlInput');
  const goBtn = document.getElementById('goBtn');
  const iframe = document.getElementById('viewport');
  const backBtn = document.getElementById('backBtn');
  const forwardBtn = document.getElementById('forwardBtn');

  const historyStack = [];
  let historyIndex = -1;

  function normalizeUrl(input){
    input = input.trim();
    if (!input) return null;
    try {
      // If scheme missing, assume https
      if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(input)) {
        input = 'https://' + input;
      }
      const url = new URL(input);
      return url.toString();
    } catch (e) {
      return null;
    }
  }

  function navigateTo(raw){
    const url = normalizeUrl(raw);
    if (!url) {
      alert('Please enter a valid URL (e.g. https://example.com)');
      return;
    }
    // push to history (truncate forward history)
    if (historyIndex < historyStack.length - 1) {
      historyStack.splice(historyIndex + 1);
    }
    historyStack.push(url);
    historyIndex = historyStack.length - 1;
    updateNavButtons();
    // set iframe to proxied URL
    iframe.src = '/proxy?url=' + encodeURIComponent(url);
    urlInput.value = url;
  }

  function goBack(){
    if (historyIndex > 0) {
      historyIndex--;
      const url = historyStack[historyIndex];
      iframe.src = '/proxy?url=' + encodeURIComponent(url);
      urlInput.value = url;
      updateNavButtons();
    }
  }
  function goForward(){
    if (historyIndex < historyStack.length - 1) {
      historyIndex++;
      const url = historyStack[historyIndex];
      iframe.src = '/proxy?url=' + encodeURIComponent(url);
      urlInput.value = url;
      updateNavButtons();
    }
  }

  function updateNavButtons(){
    backBtn.disabled = historyIndex <= 0;
    forwardBtn.disabled = historyIndex >= historyStack.length - 1;
    backBtn.style.opacity = backBtn.disabled ? '0.35' : '1';
    forwardBtn.style.opacity = forwardBtn.disabled ? '0.35' : '1';
  }

  goBtn.addEventListener('click', () => navigateTo(urlInput.value));
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') navigateTo(urlInput.value);
  });
  backBtn.addEventListener('click', goBack);
  forwardBtn.addEventListener('click', goForward);

  // Load a default page on start
  const defaultUrl = 'https://example.com';
  urlInput.value = defaultUrl;
  navigateTo(defaultUrl);
})();
