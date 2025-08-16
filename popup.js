document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('generateBtn');
  const repoUrlInput = document.getElementById('repoUrl');
  const geminiApiKeyInput = document.getElementById('geminiApiKey');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const statusMessage = document.getElementById('status-message');
  const errorMessageDiv = document.getElementById('error-message');
  const readmeOutputDiv = document.getElementById('readme-output');
  const readmeContentTextarea = document.getElementById('readmeContent');
  const copyBtn = document.getElementById('copyBtn');
  const retryBtn = document.getElementById('retryBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  const showError = (message) => {
    errorMessageDiv.textContent = message;
    errorMessageDiv.classList.remove('hidden');
  };

  const hideError = () => {
    errorMessageDiv.classList.add('hidden');
    errorMessageDiv.textContent = '';
  };

  const showLoading = () => {
    const btnText = document.getElementById('btn-text');
    const spinnerIcon = document.getElementById('spinner');

    if (btnText && spinnerIcon) {
      btnText.textContent = "It's Cooking... hold on for few seconds";
      spinnerIcon.classList.remove('hidden');
    }

    generateBtn.disabled = true;
    retryBtn.classList.add('hidden');
    downloadBtn.classList.add('hidden');
    hideError();
    readmeOutputDiv.classList.add('hidden');
  };

  const hideLoading = () => {
    const btnText = document.getElementById('btn-text');
    const spinnerIcon = document.getElementById('spinner');

    if (btnText && spinnerIcon) {
      btnText.textContent = 'Generate README';
      spinnerIcon.classList.add('hidden');
    }

    generateBtn.disabled = false;
  };

  const generateReadme = async () => {
    const repoUrl = repoUrlInput.value;
    const geminiApiKey = geminiApiKeyInput.value.trim();

    if (!geminiApiKey) {
      showError("Please enter a valid Gemini API key.");
      return;
    }

    if (!repoUrl || !repoUrl.startsWith('https://github.com/')) {
      showError("Please open a valid GitHub repository page first.");
      return;
    }

    showLoading();

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'generateReadme',
        url: repoUrl,
        geminiApiKey
      });

      if (response.success) {
        readmeContentTextarea.value = response.readme;
        readmeOutputDiv.classList.remove('hidden');
        downloadBtn.classList.remove('hidden');
        statusMessage.textContent = 'README generated successfully🎉';
      } else {
        showError(response.error || "An unknown error occurred during README generation.");
        retryBtn.classList.remove('hidden');
      }
    } catch (error) {
      console.error("Error communicating with background script:", error);
      showError("Failed to generate README: Model is busy, try later.");
      retryBtn.classList.remove('hidden');
    } finally {
      hideLoading();
    }
  };

  chrome.storage.local.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      geminiApiKeyInput.value = result.geminiApiKey;
      statusMessage.textContent = "Gemini API key loaded. Ready to generate README.";
    }
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (currentTab && currentTab.url && currentTab.url.startsWith('https://github.com/')) {
      repoUrlInput.value = currentTab.url;
      statusMessage.textContent = "Ready to generate README for this repository.";
    } else {
      repoUrlInput.value = "Not a GitHub repository page.";
      generateBtn.disabled = true;
      statusMessage.textContent = "Please navigate to a GitHub repository page.";
    }
  });

  saveApiKeyBtn.addEventListener('click', () => {
    const geminiApiKey = geminiApiKeyInput.value.trim();
    if (!geminiApiKey) {
      showError("Please enter a Gemini API key to save.");
      return;
    }
    chrome.storage.local.set({ geminiApiKey }, () => {
      statusMessage.textContent = "Gemini API key saved successfully!";
      hideError();
      setTimeout(() => {
        statusMessage.textContent = "Ready to generate README for this repository.";
      }, 2000);
    });
  });

  generateBtn.addEventListener('click', generateReadme);
  retryBtn.addEventListener('click', generateReadme);

  copyBtn.addEventListener('click', () => {
    readmeContentTextarea.select();
    document.execCommand('copy');
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = 'Copy to Clipboard';
    }, 2000);
  });

  downloadBtn.addEventListener('click', () => {
    const blob = new Blob([readmeContentTextarea.value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
});