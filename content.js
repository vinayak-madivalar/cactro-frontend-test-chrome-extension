const HIGHLIGHT_BUTTON_ID = "local-highlighter-save-button";

// --- Debugging helper to confirm script injection ---
// This message should appear in the browser console when the page loads.
console.log("Local Highlighter Content Script is Active!");
// ----------------------------------------------------

/**
 * Creates and displays the 'Save Highlight' button near the selected text.
 * @param {string} selectedText - The text the user highlighted.
 * @param {Range} range - The DOM Range object of the selection.
 */
function showSaveButton(selectedText, range) {
  // Remove any existing button first
  document.getElementById(HIGHLIGHT_BUTTON_ID)?.remove();

  if (!selectedText.trim()) return; // Don't show for empty selection

  const button = document.createElement("button");
  button.id = HIGHLIGHT_BUTTON_ID;
  button.textContent = "Save Highlight?";

  // Simple styling for the button
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
    // Calculate position based on the selection boundaries
    const rect = range.getBoundingClientRect();

    // Check if the bounding box is valid (0,0 can happen on hidden/complex elements)
    if (rect.width === 0 && rect.height === 0) {
      console.warn(
        "Selection bounding box is zero; cannot position button accurately."
      );
      return;
    }

    // Position below the selection. Using pageXOffset/pageYOffset is often safer than scrollX/Y.
    const x = window.pageXOffset + rect.left + rect.width / 2 - 60; // Center it roughly
    const y = window.pageYOffset + rect.bottom + 5;

    button.style.left = `${x}px`;
    button.style.top = `${y}px`;

    // Add click listener
    button.addEventListener("click", (e) => {
      e.stopPropagation(); // Important: Prevents selection from clearing when clicking the button
      saveHighlight(selectedText, button);
    });

    document.body.appendChild(button);
  } catch (e) {
    // Log any positioning error without crashing the script
    console.error("Error positioning highlight button:", e);
  }
}

/**
 * Saves the highlight data to chrome.storage.local.
 * @param {string} text - The text to be saved.
 * @param {HTMLElement} button - The button element to update.
 */
function saveHighlight(text, button) {
  const currentUrl = window.location.href;
  const highlightId = Date.now().toString(); // Simple unique ID

  const newHighlight = {
    id: highlightId,
    text: text,
    url: currentUrl,
    date: new Date().toLocaleDateString(),
  };

  // Use chrome.storage.local to get existing highlights and add the new one
  chrome.storage.local.get({ highlights: [] }, (result) => {
    const highlights = result.highlights;
    highlights.push(newHighlight);

    chrome.storage.local.set({ highlights: highlights }, () => {
      // Provide feedback
      button.textContent = "Saved!";
      button.style.backgroundColor = "#10b981"; // Green 500

      // Auto-hide after a short delay
      setTimeout(() => {
        button.remove();
      }, 1500);
    });
  });
}

/**
 * Main selection listener.
 */
document.addEventListener("mouseup", (e) => {
  // If the click target is the button itself, exit immediately to prevent re-triggering.
  if (e.target.id === HIGHLIGHT_BUTTON_ID) {
    return;
  }

  const selection = window.getSelection();

  // Check if there is a valid selection and not just a click
  // .trim().length > 0 ensures we don't try to save empty spaces
  if (
    selection &&
    selection.rangeCount > 0 &&
    selection.toString().trim().length > 0
  ) {
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    showSaveButton(selectedText, range);
  } else {
    // Hide the button if user clicks elsewhere without selecting
    document.getElementById(HIGHLIGHT_BUTTON_ID)?.remove();
  }
});

// Hide button when scrolling to prevent misalignment
document.addEventListener("scroll", () => {
  document.getElementById(HIGHLIGHT_BUTTON_ID)?.remove();
});
