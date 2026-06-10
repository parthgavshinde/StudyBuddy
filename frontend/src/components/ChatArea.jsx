import React, { useRef, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { FiMessageCircle, FiTrash2, FiMic, FiSend, FiVolume2 } from "react-icons/fi";

const ChatArea = () => {
  const {
    messages,
    customQuery,
    setCustomQuery,
    isBusy,
    isListening,
    setIsListening,
    currentlyReadingId,
    handleSendQuery,
    startPodcastAudio,
    clearChatHistory,
  } = useOutletContext();

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      rec.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setCustomQuery((prev) => {
            const space = prev && !prev.endsWith(" ") ? " " : "";
            return prev + space + finalTranscript;
          });
          
          if (textareaRef.current) {
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
                textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
              }
            }, 0);
          }
        }
      };

      setRecognition(rec);
      
      return () => {
        try {
          rec.abort();
        } catch (e) {}
      };
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }
  }, [setIsListening, setCustomQuery]);

  const handleTextareaChange = (e) => {
    setCustomQuery(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendQuery();
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBusy]);

  const toggleListening = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in your browser. Please try using Chrome.");
      return;
    }
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  return (
    <>
      <header className="chat-header">
        <div className="chat-title">
          <FiMessageCircle className="text-indigo-400" /> Study Assistant Stream
        </div>
        <div className="chat-actions">
          <button 
            type="button" 
            className="reset-button"
            onClick={clearChatHistory} 
            title="Clear Chat"
          >
            <FiTrash2 /> Reset
          </button>
        </div>
      </header>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.sender === "user" ? "user-row" : "ai-row"}`}>
            <div className={`message-bubble ${msg.sender}`}>
              {msg.sender === "ai" ? (
                <div className="markdown-content">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                  {msg.id !== "welcome-msg" && !msg.text.startsWith("📄") && !msg.text.startsWith("🧹") && !msg.text.startsWith("⚠️") && (
                    <div className="message-actions">
                      <button
                        type="button"
                        onClick={() => startPodcastAudio(msg.text, msg.id)}
                        className={`listen-button ${currentlyReadingId === msg.id ? "active" : ""}`}
                      >
                        <FiVolume2 style={{ marginRight: '4px' }} />
                        {currentlyReadingId === msg.id ? "Speaking..." : "Listen"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>{msg.text}</div>
              )}
            </div>
          </div>
        ))}

        {isBusy && (
          <div className="message-row ai-row">
            <div className="message-bubble ai loading-bubble">
              <div className="loading-dots">
                <div></div><div></div><div></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="input-container">
          <button
            type="button"
            className={`mic-button ${isListening ? "active" : ""}`}
            onClick={toggleListening}
            disabled={isBusy}
            title="Voice Input"
          >
            <FiMic />
          </button>
          
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            placeholder="Ask a question about your study material..."
            value={customQuery}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
            rows={1}
          />
          
          <button
            type="button"
            className="send-button"
            onClick={() => { handleSendQuery(); if(textareaRef.current) textareaRef.current.style.height="auto"; }}
            disabled={isBusy || !customQuery.trim()}
            title="Send Message"
          >
            <FiSend />
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatArea;
