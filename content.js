const HIGHLIGHT_BUTTON_ID = "local-highlighter-save-button";

console.log("Local Highlighter Content Script is Active!");

function showSaveButton(selectedText, range) {
  document.getElementById(HIGHLIGHT_BUTTON_ID)?.remove();

  if (!selectedText.trim()) return;

  const button = document.createElement("button");
  button.id = HIGHLIGHT_BUTTON_ID;
  button.textContent = "Save Highlight?";

  button.style.cssText = `
        position: absolute;
        padding: 4px 8px;
        background-color: #4f46e5; /* Indigo 600 */
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        z-index: 9999; /* Ensure it's on top */
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    `;

  try {
    const rect = range.getBoundingClientRect();

    if (rect.width === 0 && rect.height === 0) {
      console.warn(
        "Selection bounding box is zero; cannot position button accurately."
      );
      return;
    }

    const x = window.pageXOffset + rect.left + rect.width / 2 - 60;
    const y = window.pageYOffset + rect.bottom + 5;

    button.style.left = `${x}px`;
    button.style.top = `${y}px`;

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      saveHighlight(selectedText, button);
    });

    document.body.appendChild(button);
  } catch (e) {
    console.error("Error positioning highlight button:", e);
  }
}

function saveHighlight(text, button) {
  const currentUrl = window.location.href;
  const highlightId = Date.now().toString();

  const newHighlight = {
    id: highlightId,
    text: text,
    url: currentUrl,
    date: new Date().toLocaleDateString(),
  };

  chrome.storage.local.get({ highlights: [] }, (result) => {
    const highlights = result.highlights;
    highlights.push(newHighlight);

    chrome.storage.local.set({ highlights: highlights }, () => {
      button.textContent = "Saved!";
      button.style.backgroundColor = "#10b981";

      setTimeout(() => {
        button.remove();
      }, 1500);
    });
  });
}

document.addEventListener("mouseup", (e) => {
  if (e.target.id === HIGHLIGHT_BUTTON_ID) {
    return;
  }

  const selection = window.getSelection();

  if (
    selection &&
    selection.rangeCount > 0 &&
    selection.toString().trim().length > 0
  ) {
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    showSaveButton(selectedText, range);
  } else {
    document.getElementById(HIGHLIGHT_BUTTON_ID)?.remove();
  }
});

document.addEventListener("scroll", () => {
  document.getElementById(HIGHLIGHT_BUTTON_ID)?.remove();
});
