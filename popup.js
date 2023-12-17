document.getElementById("extractButton").addEventListener("click", () => {
  console.log("clicked");
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "extractFavorites" });
  });
});
