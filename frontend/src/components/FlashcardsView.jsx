import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { FiZap, FiFolder, FiArrowLeft, FiArrowRight } from "react-icons/fi";

const FlashcardsView = () => {
  const location = useLocation();
  const flashcards = location.state?.flashcards || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const handleNext = () => {
    setFlipped(false);
    setTimeout(() => setCurrentIndex((p) => (p + 1) % flashcards.length), 200);
  };

  const handlePrev = () => {
    setFlipped(false);
    setTimeout(() => setCurrentIndex((p) => (p - 1 + flashcards.length) % flashcards.length), 200);
  };

  return (
    <div className="flashcards-view">
      <header className="view-header">
        <div className="title">
          <FiZap className="text-indigo-400" /> Memory Decks
        </div>
      </header>

      <div className="view-content">
        <div className="deck-header">
          <h2>Automated Q/A Study Deck</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Review key takeaways with interactive memory cards.</p>
        </div>

        {flashcards.length > 0 ? (
          <div className="flashcard-container">
            <div style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Card {currentIndex + 1} of {flashcards.length}
            </div>

            <div className="flashcard" onClick={() => setFlipped(!flipped)}>
              <div className={`card-inner ${flipped ? "flipped" : ""}`}>
                <div className="card-front">
                  <span className="card-tag question">Question</span>
                  <div className="card-text">{flashcards[currentIndex].question}</div>
                  <div className="card-hint">Tap to reveal answer</div>
                </div>
                <div className="card-back">
                  <span className="card-tag answer">Answer</span>
                  <div className="card-text">{flashcards[currentIndex].answer}</div>
                  <div className="card-hint">Tap to flip back</div>
                </div>
              </div>
            </div>

            <div className="card-controls">
              <button onClick={handlePrev} className="control-button"><FiArrowLeft size={20} /></button>
              <button onClick={() => setFlipped(!flipped)} className="flip-button">
                {flipped ? "Show Question" : "Reveal Answer"}
              </button>
              <button onClick={handleNext} className="control-button"><FiArrowRight size={20} /></button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <FiFolder size={64} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }} />
            <h3>No Flashcards Available</h3>
            <p>Please generate flashcards from the Dashboard first.</p>
            <Link to="/" className="home-link">Back to Dashboard</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardsView;
