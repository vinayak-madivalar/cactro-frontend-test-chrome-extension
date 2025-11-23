// popup.js - Handles the UI logic for the extension popup

document.addEventListener("DOMContentLoaded", () => {
  // Check for CSP errors in development environment. This will be visible in the popup's console.
  console.log("Popup script started. Checking for chrome.storage access...");

  const listContainer = document.getElementById("highlight-list");
  const clearAllButton = document.getElementById("clear-all");
  const loadingMessage = document.getElementById("loading-message");

  // Modal Elements
  const modal = document.getElementById("confirmation-modal");
  const confirmMessage = document.getElementById("confirm-message");
  const cancelButton = document.getElementById("cancel-confirm");
  const executeButton = document.getElementById("execute-confirm");

  let pendingAction = null; // Stores the function to execute on confirmation

  // --- Modal Functions ---

  function showConfirmation(message, action) {
    confirmMessage.textContent = message;
    pendingAction = action;
    modal.style.display = "flex";
  }

  function hideConfirmation() {
    modal.style.display = "none";
    pendingAction = null;
  }

  cancelButton.onclick = hideConfirmation;
  executeButton.onclick = () => {
    if (pendingAction) {
      pendingAction();
    }
    hideConfirmation();
  };

  // --- Core Logic ---

  /**
   * Deletes a highlight by ID and re-renders the list.
   * @param {string} id - The unique ID of the highlight to delete.
   */
  function deleteHighlight(id) {
    if (typeof chrome.storage === "undefined") {
      console.error(
        "Error: chrome.storage is unavailable for deletion. Check manifest permissions."
      );
      return;
    }
    chrome.storage.local.get({ highlights: [] }, (result) => {
      const highlights = result.highlights.filter((h) => h.id !== id);
      chrome.storage.local.set({ highlights: highlights }, renderHighlights);
    });
  }

  /**
   * Renders the list of highlights into the popup UI.
   */
  function renderHighlights() {
    listContainer.innerHTML = "";
    loadingMessage.style.display = "none";
    clearAllButton.style.display = "none";

    if (typeof chrome.storage === "undefined") {
      console.error(
        "Error: chrome.storage is undefined. This should not happen if 'storage' permission is set."
      );
      listContainer.innerHTML =
        '<p class="text-sm text-red-500 italic">Error: Storage not accessible. Check manifest permissions.</p>';
      return;
    }

    console.log("Attempting to retrieve highlights...");

    chrome.storage.local.get({ highlights: [] }, (result) => {
      const highlights = result.highlights.reverse(); // Show newest first

      console.log(`Highlights retrieved. Count: ${highlights.length}`);

      if (highlights.length === 0) {
        listContainer.innerHTML =
          '<p class="text-sm text-gray-500 italic">No highlights saved yet. Select text on a page to save one!</p>';
        return;
      }

      clearAllButton.style.display = "block";

      highlights.forEach((highlight) => {
        const item = document.createElement("div");
        // Use CSS classes defined in popup.html's <style> block
        item.className = "highlight-item";
        item.setAttribute("data-id", highlight.id);

        // Highlight Text
        const text = document.createElement("p");
        // Use a combination of styling for text display
        text.className = "text-sm text-gray-800 mb-2 text-truncate";
        text.textContent = highlight.text;
        item.appendChild(text);

        // Source Link/Date
        const footer = document.createElement("div");
        footer.className =
          "flex justify-between items-center text-xs text-gray-500 mt-1";

        const sourceLink = document.createElement("a");
        // Use URL to get just the hostname for cleaner display
        try {
          const urlObj = new URL(highlight.url);
          sourceLink.textContent = urlObj.hostname;
          sourceLink.href = highlight.url;
          sourceLink.target = "_blank"; // Open link in new tab
          sourceLink.className = "link";
          footer.appendChild(sourceLink);
        } catch (e) {
          sourceLink.textContent = "Invalid URL";
          footer.appendChild(sourceLink);
        }

        // Delete Button
        const deleteBtn = document.createElement("button");
        // Updated: SVG now uses the CSS class defined in popup.html
        deleteBtn.innerHTML =
          '<svg class="delete-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
        // Updated: Button now uses the CSS class defined in popup.html
        deleteBtn.className = "delete-button";
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          showConfirmation("Permanently delete this highlight?", () =>
            deleteHighlight(highlight.id)
          );
        };
        footer.appendChild(deleteBtn);

        item.appendChild(footer);
        listContainer.appendChild(item);
      });
    });
  }

  // Delete All Button Handler
  clearAllButton.onclick = () => {
    showConfirmation(
      "Are you sure you want to delete ALL saved highlights?",
      () => {
        if (typeof chrome.storage !== "undefined") {
          chrome.storage.local.set({ highlights: [] }, renderHighlights);
        } else {
          console.error("Error: chrome.storage is unavailable for Clear All.");
        }
      }
    );
  };

  // Initial render when the popup opens
  renderHighlights();

  // Set up a listener for storage changes
  if (typeof chrome.storage !== "undefined") {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.highlights) {
        renderHighlights();
      }
    });
  }
});
