import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { FiMessageSquare, FiZap, FiEdit3, FiFileText, FiCheck, FiPlay, FiPause, FiX, FiDisc, FiCpu, FiPlus, FiTrash2 } from "react-icons/fi";
import "./components.css";

const PRESET_QUERIES = [
  "Summarize the provided text comprehensively with key takeaways",
  "List all important definitions and concepts clearly",
  "Explain the central themes for high-scoring exam preparation",
  "Generate a structured study guide outline from these notes",
]; 

const getRecentChats = () => {
  let initialConvos = [];
  try {
    const saved = localStorage.getItem("studybuddy_recent_chats");
    if (saved) {
      initialConvos = JSON.parse(saved);
    } else {
      const legacySaved = localStorage.getItem("studybuddy_chats");
      if (legacySaved) {
        const legacyMsgs = JSON.parse(legacySaved);
        if (legacyMsgs && legacyMsgs.length > 1) {
           initialConvos = [{
             id: Date.now().toString(),
             title: "Previous Conversation",
             messages: legacyMsgs,
             createdAt: new Date().toISOString()
           }];
        }
      }
    }
  } catch (e) {
    console.error("Failed to load history", e);
  }

  const defaultMessages = [
    {
      id: "welcome-msg",
      sender: "ai",
      text: "👋 Welcome to **StudyBuddy**! Upload a PDF study material from the left panel, choose a preset question or type your own query to start generating comprehensive structured insights.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ];

  if (initialConvos.length > 0) {
    return {
      convos: initialConvos,
      activeId: initialConvos[0].id,
      activeMsgs: initialConvos[0].messages
    };
  }

  const newId = Date.now().toString();
  const newConvo = {
    id: newId,
    title: "New Conversation",
    messages: defaultMessages,
    createdAt: new Date().toISOString()
  };

  return {
    convos: [newConvo],
    activeId: newId,
    activeMsgs: defaultMessages
  };
};

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [studyContext, setStudyContext] = useState(() => {
    return localStorage.getItem("studybuddy_latest_context") || "";
  });

  const initialState = getRecentChats();
  const [recentChats, setRecentChats] = useState(initialState.convos);
  const [activeChatId, setActiveChatId] = useState(initialState.activeId);
  const [messages, setMessages] = useState(initialState.activeMsgs);

  const [file, setFile] = useState(null);
  const [customQuery, setCustomQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingTest, setGeneratingTest] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [autoVoice, setAutoVoice] = useState(false);
  const [currentlyReadingId, setCurrentlyReadingId] = useState(null);
  const [voiceConversationMode, setVoiceConversationMode] = useState(false);

  const [podcast, setPodcast] = useState({
    active: false,
    text: "",
    playing: false,
    paused: false,
    speed: 1,
  });

  const saveChat = (updatedChats) => {
    localStorage.setItem("studybuddy_recent_chats", JSON.stringify(updatedChats));
  };

  useEffect(() => {
    setRecentChats(prev => {
      const updated = prev.map(c => {
        if (c.id === activeChatId) {
          let newTitle = c.title;
          if (newTitle === "New Conversation" && messages.length > 1) {
            const firstUserMsg = messages.find(m => m.sender === "user");
            if (firstUserMsg) {
              newTitle = firstUserMsg.text.slice(0, 40) + (firstUserMsg.text.length > 40 ? "..." : "");
            }
          }
          return { ...c, messages: messages, title: newTitle };
        }
        return c;
      });
      saveChat(updated);
      return updated;
    });
  }, [messages, activeChatId]);

  const startNewChat = () => {
    const defaultMessages = [
      {
        id: "welcome-msg",
        sender: "ai",
        text: "👋 Welcome to **StudyBuddy**! Upload a PDF study material from the left panel, choose a preset question or type your own query to start generating comprehensive structured insights.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    const newId = Date.now().toString();
    const newConvo = {
      id: newId,
      title: "New Conversation",
      messages: defaultMessages,
      createdAt: new Date().toISOString()
    };
    
    setRecentChats(prev => {
      const updated = [newConvo, ...prev];
      saveChat(updated);
      return updated;
    });
    setActiveChatId(newId);
    setMessages(defaultMessages);
    setFile(null);
    setStudyContext("");
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setPodcast((p) => ({ ...p, active: false, playing: false }));
    }
  };

  const loadChat = (id) => {
    const chat = recentChats.find(c => c.id === id);
    if (chat) {
      setActiveChatId(chat.id);
      setMessages(chat.messages);
      setFile(null);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setPodcast((p) => ({ ...p, active: false, playing: false }));
      }
    }
  };

  const deleteChat = (id, e) => {
    e.stopPropagation();
    setRecentChats(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveChat(updated);
      
      if (activeChatId === id) {
        if (updated.length > 0) {
          setActiveChatId(updated[0].id);
          setMessages(updated[0].messages);
        } else {
          setTimeout(startNewChat, 0); 
        }
      }
      return updated;
    });
  };

  const handleFileSelection = (e) => {
    const selected = e.target.files?.[0] || null;
    if (selected) {
      setFile(selected);
      setError(null);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "ai",
          text: `📄 Selected document: **${selected.name}**. Ready to process queries or generate test suites!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const clearChatHistory = () => {
    const initial = [
      {
        id: "welcome-msg",
        sender: "ai",
        text: "🧹 Workspace reset successfully. Upload a PDF or ask a query to begin fresh study analysis.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(initial);
    setFile(null);
    setCustomQuery("");
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setPodcast((p) => ({ ...p, active: false, playing: false }));
    }
  };

  const handleSendQuery = async (queryToSend) => {
    const targetQuery = queryToSend?.trim() || customQuery.trim();
    if (!targetQuery) return;

    if (!file && messages.length <= 2) {
      setError("Please upload a PDF study document first.");
      return;
    }

    if (location.pathname !== "/") {
      navigate("/");
    }

    setError(null);
    const userMsgId = Date.now().toString();
    const newMessages = [
      ...messages,
      {
        id: userMsgId,
        sender: "user",
        text: targetQuery,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    setMessages(newMessages);
    setCustomQuery("");
    setLoading(true);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setPodcast((p) => ({ ...p, active: false, playing: false }));
    }

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      } else {
        formData.append("file", new Blob([""], { type: "application/pdf" }), "previous_context.pdf");
      }
      formData.append("query", targetQuery);

      const resp = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        throw new Error(`Server returned HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const answerText = data.answer || "No response received.";

      if (data.selected_chunks && Array.isArray(data.selected_chunks)) {
        const combinedContext = data.selected_chunks.join("\n\n");
        setStudyContext(combinedContext);
        localStorage.setItem("studybuddy_latest_context", combinedContext);
      } else if (answerText) {
        setStudyContext(answerText);
        localStorage.setItem("studybuddy_latest_context", answerText);
      }

      const aiMsgId = (Date.now() + 1).toString();
      const aiMessage = {
        id: aiMsgId,
        sender: "ai",
        text: answerText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMessage]);

      if ((autoVoice || voiceConversationMode) && !isListening) {
        startPodcastAudio(answerText, aiMsgId);
      }
    } catch (err) {
      console.error("Query error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: `⚠️ **Error processing request**: ${err.message}. Please verify backend connectivity.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTest = async () => {
    if (!file) {
      navigate("/test");
      return;
    }
    
    setError(null);
    setGeneratingTest(true);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setPodcast((p) => ({ ...p, active: false, playing: false }));
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const resp = await fetch("http://localhost:8000/generate-test", {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) throw new Error(`HTTP Error ${resp.status}`);

      const data = await resp.json();
      if (data.mcqs && Array.isArray(data.mcqs) && data.mcqs.length > 0) {
        navigate("/test", { state: { mcqs: data.mcqs } });
      } else {
        throw new Error("Could not construct test MCQs from the uploaded document.");
      }
    } catch (err) {
      console.error("Test generation error:", err);
      setError(`Test suite extraction failed: ${err.message}`);
    } finally {
      setGeneratingTest(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    try {
      setGeneratingFlashcards(true);

      const formData = new FormData();
      if (file) formData.append("file", file);
      if (studyContext) formData.append("text", studyContext);

      const res = await fetch("http://localhost:8000/generate-flashcards", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.flashcards || data.flashcards.length === 0) {
        alert("No flashcards generated 😓");
        return;
      }

      navigate("/flashcards", { state: { flashcards: data.flashcards } });
    } catch (err) {
      console.error(err);
      alert("Flashcard error");
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const startPodcastAudio = (textToSpeak, msgId = null) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setCurrentlyReadingId(msgId);

    const cleanText = textToSpeak.replace(/###|##|#|\*\*|\*|`|-/g, "").replace(/\[.*?\]\(.*?\)/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = podcast.speed;

    utterance.onstart = () => {
      setPodcast((prev) => ({ ...prev, active: true, text: cleanText, playing: true, paused: false }));
    };

    utterance.onend = () => {
      setPodcast((prev) => ({ ...prev, playing: false, paused: false }));
      setCurrentlyReadingId(null);
    };
    window.speechSynthesis.speak(utterance);
  };

  const togglePlayPausePodcast = () => {
    if (!("speechSynthesis" in window)) return;
    if (window.speechSynthesis.speaking) {
      if (podcast.paused) {
        window.speechSynthesis.resume();
        setPodcast((p) => ({ ...p, playing: true, paused: false }));
      } else {
        window.speechSynthesis.pause();
        setPodcast((p) => ({ ...p, playing: false, paused: true }));
      }
    } else if (podcast.text) {
      startPodcastAudio(podcast.text, currentlyReadingId);
    }
  };

  const stopPodcastAudio = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setPodcast({ active: false, text: "", playing: false, paused: false, speed: 1 });
    setCurrentlyReadingId(null);
  };

  const handleSpeedChange = (e) => {
    const newSpeed = parseFloat(e.target.value);
    setPodcast((prev) => ({ ...prev, speed: newSpeed }));
    if (podcast.active && podcast.text && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(podcast.text);
        utterance.rate = newSpeed;
        utterance.onend = () => setPodcast((p) => ({ ...p, playing: false, paused: false }));
        window.speechSynthesis.speak(utterance);
        setPodcast((p) => ({ ...p, playing: true, paused: false }));
      }, 100);
    }
  };

  const isBusy = loading || generatingTest || generatingFlashcards;

  const outletContext = {
    studyContext, setStudyContext,
    messages, setMessages,
    customQuery, setCustomQuery,
    loading, generatingTest, generatingFlashcards,
    isListening, setIsListening,
    autoVoice, setAutoVoice,
    currentlyReadingId, setCurrentlyReadingId,
    voiceConversationMode, setVoiceConversationMode,
    podcast, setPodcast,
    isBusy, handleSendQuery, startPodcastAudio, clearChatHistory
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <Link to="/" className="sidebar-logo">
          <FiCpu className="text-indigo-400" /> StudyBuddy
        </Link>

        <div style={{ padding: '0 1rem', marginBottom: '0.5rem' }}>
          <button 
            className="action-button" 
            onClick={startNewChat} 
            disabled={isBusy}
            style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', boxShadow: 'none' }}
          >
            <FiPlus /> New Chat
          </button>
        </div>

        <div className="chat-history-container">
          <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>Recent Chats</h3>
          {recentChats.map(chat => (
            <div 
              key={chat.id} 
              className={`history-item ${chat.id === activeChatId ? 'active' : ''}`}
              onClick={() => loadChat(chat.id)}
            >
              <div className="history-text">
                <span className="history-title">{chat.title}</span>
                <span className="history-date">
                  {chat.createdAt.includes('T') ? new Date(chat.createdAt).toLocaleDateString() : chat.createdAt}
                </span>
              </div>
              <button 
                className="history-delete"
                onClick={(e) => deleteChat(chat.id, e)}
                title="Delete Chat"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-nav">
          <Link to="/" className={`nav-link ${location.pathname === "/" ? "active" : ""}`}>
            <FiMessageSquare /> Assistant Stream
          </Link>
          <Link to="/flashcards" className={`nav-link ${location.pathname === "/flashcards" ? "active" : ""}`}>
            <FiZap /> Memory Decks
          </Link>
          <Link to="/test" className={`nav-link ${location.pathname === "/test" ? "active" : ""}`}>
            <FiEdit3 /> MCQ Suite
          </Link>
        </div>

        <div className="upload-section">
          <h3>Source Document</h3>
          <label className={`upload-box ${isBusy ? "disabled" : ""}`}>
            <div className="icon"><FiFileText /></div>
            <p style={{ marginTop: '0.5rem', fontWeight: 500 }}>Upload Study PDF</p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click to browse or drop file</span>
            <input
              type="file"
              accept=".pdf"
              className="hidden-input"
              onChange={handleFileSelection}
              disabled={isBusy}
            />
          </label>
          {file && (
            <div className="file-success">
              <FiCheck /> {file.name}
            </div>
          )}
          {error && <div className="error-text">{error}</div>}
        </div>

        <div className="preset-section">
          <h3>Quick Actions</h3>
          <div className="preset-list">
            {PRESET_QUERIES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                className="preset-button"
                onClick={() => handleSendQuery(preset)}
                disabled={isBusy}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="spacer" />

        <div className="quick-tools">
          <button
            onClick={handleGenerateFlashcards}
            className="action-button"
            style={{ marginBottom: '1rem' }}
            disabled={isBusy}
          >
            <FiZap style={{ marginRight: '8px' }} />
            {generatingFlashcards ? "Generating Flashcards..." : "Generate Flashcards"}
          </button>
          <button 
            type="button" 
            className="action-button"
            onClick={handleGenerateTest}
            disabled={isBusy}
          >
            <FiEdit3 style={{ marginRight: '8px' }} />
            {generatingTest ? "Generating Test..." : "Generate MCQ Test"}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet context={outletContext} />

        {podcast.active && (
          <div className="podcast-player">
            <div className="player-info">
              <FiDisc className={`player-icon ${podcast.playing ? "spinning" : ""}`} />
              <div className="player-text">
                <span>Podcast Mode</span>
                <p>{podcast.text}</p>
              </div>
            </div>

            <div className="player-controls">
              <select 
                value={podcast.speed} 
                onChange={handleSpeedChange} 
                className="speed-select"
              >
                <option value={0.85}>0.85x</option>
                <option value={1}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
              </select>

              <button
                type="button"
                onClick={togglePlayPausePodcast}
                className="play-button"
              >
                {podcast.playing ? <FiPause /> : <FiPlay />}
              </button>
              
              <button
                type="button"
                onClick={stopPodcastAudio}
                className="close-button"
              >
                <FiX />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardLayout;
