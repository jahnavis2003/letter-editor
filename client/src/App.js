import React, { useState, useEffect } from "react";
import { logout } from "./firebase";
import TextEditor from "./TextEditor";
import AuthPage from "./Auth";

function App() {
  const API_URL = "https://letter-editor-backend-fh3x.onrender.com";
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [selectedDraftId, setSelectedDraftId] = useState(null);
  const token = localStorage.getItem("accessToken");

  // Load drafts from local storage on component mount
  useEffect(() => {
    try {
        const savedDrafts = JSON.parse(localStorage.getItem("drafts") || "[]");
        if (Array.isArray(savedDrafts)) {
            setDrafts(savedDrafts);
        } else {
            console.warn("Drafts in local storage are invalid, resetting...");
            setDrafts([]);
            localStorage.removeItem("drafts");
        }
    } catch (error) {
        console.error("Error loading drafts:", error);
        setDrafts([]);
    }
}, []); // Runs only once on mount


  const handleLogout = async () => {
    await logout();
    setUser(null);
    localStorage.removeItem("token");
  };

  const handleSaveToDrive = async () => {
    if (!user || !token) {
      alert("Please log in first.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/save-letter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Letter saved to Google Drive!");
      } else {
        alert("Failed to save letter.");
      }
    } catch (error) {
      console.error("Error saving to Google Drive:", error);
      alert("Error saving letter.");
    }
  };

  const handleSaveDraft = () => {
    // Ensure text is a obj and check if it's empty
    if (!text || typeof text !== "object" || !text.textValue?.trim()) {
      alert("Cannot save an empty draft.");
      return;
    }
  
    const newDraft = {
      id: selectedDraftId || Date.now(),
      content: { ...text }, // Store the full text object
      timestamp: new Date().toLocaleString(),
    };  

    const updatedDrafts = selectedDraftId 
      ? drafts.map(draft => 
          draft.id === selectedDraftId 
            ? newDraft 
            : draft
        )
      : [...drafts, newDraft];

    setDrafts(updatedDrafts);
    localStorage.setItem('drafts', JSON.stringify(updatedDrafts));
    alert(selectedDraftId ? "Draft updated!" : "Draft saved!");
    
    // Optionally reset the selected draft after saving
    setSelectedDraftId(null);
  };

  const handleDeleteDraft = (draftId) => {
    const updatedDrafts = drafts.filter(draft => draft.id !== draftId);
    setDrafts(updatedDrafts);
    localStorage.setItem('drafts', JSON.stringify(updatedDrafts));
    
    // Clear the text editor if the deleted draft was selected
    if (selectedDraftId === draftId) {
      setText("");
      setSelectedDraftId(null);
    }
  };

  const handleSelectDraft = (draft) => {
    if (draft?.content && typeof draft.content === "object") {
      setText({ ...draft.content }); // Ensure we send a valid object
    } else {
      setText({ textValue: draft.content || "" }); // Fallback for old drafts
    }
  
//console.log(draft.content);
    setSelectedDraftId(draft.id);
  };

  return (
    <div className="flex h-screen w-screen">
      {/* Sidebar for Drafts */}
      {user && (
        <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Drafts</h2>
          {drafts.length === 0 ? (
            <p className="text-gray-500">No drafts saved</p>
          ) : (
            drafts.map(draft => (
              <div 
                key={draft.id} 
                className={`p-2 mb-2 border rounded flex justify-between items-center ${
                  selectedDraftId === draft.id 
                    ? 'bg-blue-100 border-blue-500' 
                    : 'bg-white'
                }`}
              >
                <div 
                  onClick={() => handleSelectDraft(draft)} 
                  className="flex-grow cursor-pointer"
                >
                  <p className="text-sm truncate"> {draft.content?.textValue ? draft.content.textValue.slice(0, 10) : "Empty"}...</p>
                  <p className="text-xs text-gray-500">{draft.timestamp}</p>
                </div>
                <button 
                  onClick={() => handleDeleteDraft(draft.id)}
                  className="ml-2 bg-red-500 text-white p-1 rounded text-xs"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div> 
      )}

      {/* Main Content Area */}
      <div className="w-full">
        {user ? (
          <div className="p-4 flex flex-col justify-between">
            <h1 className="text-2xl font-bold text-center">Text Editor</h1>
            <div className="p-4">
              <p>Welcome, {user.displayName}</p>
              <TextEditor 
                value={selectedDraftId? text.textValue : text} 
                onTextChange={(newText) => setText(newText)} 
                className="" 
              />
            </div>
            <div className="flex justify-between mt-4">
              <div>
                <button
                  onClick={handleSaveDraft}
                  className="p-2 bg-green-500 text-white rounded-xl m-2"
                >
                  {selectedDraftId ? 'Update Draft' : 'Save Draft'}
                </button>
                <button
                  onClick={handleSaveToDrive}
                  className="p-2 bg-blue-500 text-white rounded-xl m-2"
                >
                  Save to Google Drive
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-red-500 text-white rounded-xl m-2"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <AuthPage setUser={setUser} />
        )}
      </div>
    </div>
  );
}

export default App;