import React, { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";

const TestPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Read passed mcqs data from navigation state
  const mcqs = location.state?.mcqs || [
    {
      question: "Sample Question: What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      answer: "Paris",
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleOptionSelect = (option) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentIndex]: option
    });
  };

  const handleNext = () => {
    if (currentIndex < mcqs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const calculateScore = () => {
    let score = 0;
    mcqs.forEach((q, index) => {
      if (selectedAnswers[index] === q.answer) {
        score++;
      }
    });
    return score;
  };

  if (submitted) {
    const score = calculateScore();
    const percentage = Math.round((score / mcqs.length) * 100);

    return (
      <div className="test-container">
        <header className="test-header">
          <h1>Test Results</h1>
          <div className="score-badge">
            <span className="score-label">Your Score:</span>
            <span className="score-value">{score}/{mcqs.length}</span>
          </div>
          <div className="accuracy-badge">
            <span className="accuracy-label">Accuracy:</span>
            <span className="accuracy-value">{percentage}%</span>
          </div>
        </header>
        
        <div className="results-summary">
          {mcqs.map((q, index) => {
            const isCorrect = selectedAnswers[index] === q.answer;
            return (
              <div key={index} className={`result-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="result-header">
                  <span className="question-num">Question {index + 1}</span>
                  <span className={`status-pill ${isCorrect ? 'correct' : 'incorrect'}`}>
                    {isCorrect ? '✓ Correct' : '✕ Wrong'}
                  </span>
                </div>
                <p className="question-text-small">{q.question}</p>
                <div className="answer-comparison">
                  <div className="answer-box">
                    <span className="label">Your Answer</span>
                    <span className={`value ${isCorrect ? 'correct' : 'incorrect'}`}>
                      {selectedAnswers[index] || "Not answered"}
                    </span>
                  </div>
                  {!isCorrect && (
                    <div className="answer-box">
                      <span className="label">Correct Answer</span>
                      <span className="value correct">{q.answer}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="results-actions">
          <button 
            className="secondary-button" 
            onClick={() => {
              setSubmitted(false);
              setCurrentIndex(0);
              setSelectedAnswers({});
            }}
          >
            Restart Test
          </button>
          <button 
            className="primary-button" 
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = mcqs[currentIndex];

  return (
    <div className="test-container">
      <nav className="test-nav">
        <Link to="/" className="back-link">← Quit Test</Link>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentIndex + 1) / mcqs.length) * 100}%` }}
          ></div>
        </div>
        <span>Question {currentIndex + 1} of {mcqs.length}</span>
      </nav>

      <main className="test-main">
        <div className="question-card">
          <h2 className="question-text">{currentQuestion.question}</h2>
          <div className="options-grid">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`option-button ${selectedAnswers[currentIndex] === option ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(option)}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="test-controls">
          <button 
            className="secondary-button" 
            onClick={handleBack} 
            disabled={currentIndex === 0}
          >
            Previous
          </button>
          
          {currentIndex < mcqs.length - 1 ? (
            <button 
              className="primary-button" 
              onClick={handleNext}
              disabled={!selectedAnswers[currentIndex]}
            >
              Next
            </button>
          ) : (
            <button 
              className="submit-test-button" 
              onClick={handleSubmit}
              disabled={Object.keys(selectedAnswers).length < mcqs.length}
            >
              Submit Test
            </button>
          )}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .test-container {
          max-width: 800px;
          margin: 4rem auto;
          padding: 2rem;
          background: rgba(17, 24, 39, 0.7);
          backdrop-filter: blur(12px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
          color: white;
        }

        .test-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 3rem;
          gap: 2rem;
        }

        .back-link {
          color: #94a3b8;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: white;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #a855f7);
          transition: width 0.3s ease;
        }

        .question-text {
          font-size: 1.5rem;
          margin-bottom: 2.5rem;
          line-height: 1.4;
          font-weight: 600;
        }

        .options-grid {
          display: grid;
          gap: 1rem;
        }

        .option-button {
          display: flex;
          align-items: center;
          padding: 1.25rem 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #e2e8f0;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 1rem;
          gap: 1rem;
        }

        .option-button:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .option-button.selected {
          background: rgba(99, 102, 241, 0.2);
          border-color: #6366f1;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
        }

        .option-letter {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          font-weight: 700;
          color: #94a3b8;
        }

        .selected .option-letter {
          background: #6366f1;
          color: white;
        }

        .test-controls, .results-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .results-actions {
          justify-content: center;
          gap: 2rem;
        }

        .primary-button, .submit-test-button {
          padding: 0.75rem 2rem;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          border: none;
          border-radius: 12px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }

        .secondary-button {
          padding: 0.75rem 2rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: white;
          font-weight: 600;
          cursor: pointer;
        }

        .primary-button:disabled, .secondary-button:disabled, .submit-test-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .primary-button:not(:disabled):hover {
          transform: translateY(-2px);
        }

        .test-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .score-badge, .accuracy-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 100px;
          margin: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .score-label, .accuracy-label {
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .score-value, .accuracy-value {
          font-weight: 700;
          font-size: 1.1rem;
        }

        .results-summary {
          margin: 2rem 0;
          display: grid;
          gap: 1.5rem;
        }

        .result-item {
          padding: 1.5rem;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .result-item.correct { border-left: 4px solid #10b981; }
        .result-item.incorrect { border-left: 4px solid #ef4444; }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .question-num {
          font-weight: 600;
          color: #94a3b8;
        }

        .status-pill {
          padding: 0.25rem 0.75rem;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .status-pill.correct { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .status-pill.incorrect { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

        .question-text-small {
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
          color: #f8fafc;
        }

        .answer-comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .answer-box {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .answer-box .label {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .answer-box .value {
          font-weight: 600;
        }

        .answer-box .value.correct { color: #10b981; }
        .answer-box .value.incorrect { color: #ef4444; }
      `}} />
    </div>
  );
};

export default TestPage;
