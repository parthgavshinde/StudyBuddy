import React, { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { FiEdit3, FiXCircle, FiBarChart2, FiCheckCircle, FiX, FiArrowLeft } from "react-icons/fi";

const McqTestView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const mcqs = location.state?.mcqs || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (mcqs.length === 0) {
    return (
      <div className="mcq-view">
        <header className="view-header">
          <div className="title"><FiEdit3 className="text-indigo-400" /> MCQ Suite</div>
        </header>
        <div className="empty-state">
          <FiXCircle size={64} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }} />
          <h3>No Test Available</h3>
          <p>Please generate a test from the Dashboard first.</p>
          <Link to="/" className="home-link">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const handleOptionSelect = (option) => {
    setSelectedAnswers({ ...selectedAnswers, [currentIndex]: option });
  };

  const handleNext = () => {
    if (currentIndex < mcqs.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const getCorrectAnswerText = (q) => {
    if (['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
      const idx = q.correct_answer.charCodeAt(0) - 65;
      return q.options[idx];
    }
    return q.correct_answer;
  };

  const calculateScore = () => {
    let score = 0;
    mcqs.forEach((q, index) => {
      if (selectedAnswers[index] === getCorrectAnswerText(q)) score++;
    });
    return score;
  };

  if (submitted) {
    const score = calculateScore();
    const percentage = Math.round((score / mcqs.length) * 100);
    const wrongAnswers = mcqs.length - score;

    return (
      <div className="mcq-view">
        <header className="view-header">
          <div className="title"><FiBarChart2 className="text-indigo-400" style={{ color: 'var(--accent-indigo)' }} /> Test Results</div>
        </header>
        <div className="view-content results-view">
          
          <div className="result-card">
            <div className="score-display">{score}/{mcqs.length}</div>
            <div className="accuracy-text">Accuracy: {percentage}%</div>
            
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-value">{mcqs.length}</span>
                <span className="stat-label">Questions</span>
              </div>
              <div className="stat-item">
                <span className="stat-value" style={{ color: 'var(--accent-success)' }}>{score}</span>
                <span className="stat-label">Correct</span>
              </div>
              <div className="stat-item">
                <span className="stat-value" style={{ color: 'var(--accent-danger)' }}>{wrongAnswers}</span>
                <span className="stat-label">Wrong</span>
              </div>
            </div>

            <div className="action-buttons" style={{ justifyContent: 'center', gap: '1rem' }}>
              <button className="secondary-button" onClick={() => { setSubmitted(false); setCurrentIndex(0); setSelectedAnswers({}); }}>
                Retake Test
              </button>
              <button className="primary-button" onClick={() => navigate("/")}>
                Back to Dashboard
              </button>
            </div>
          </div>

          <div className="analysis-container">
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', textAlign: 'center', fontSize: '1.5rem' }}>Detailed Analysis</h3>
            {mcqs.map((q, idx) => {
              const actualCorrectAnswer = getCorrectAnswerText(q);
              const isCorrect = selectedAnswers[idx] === actualCorrectAnswer;
              const hasSkipped = !selectedAnswers[idx];

              return (
                <div key={idx} className="analysis-card">
                  <div className="analysis-header">
                    <div className="analysis-question">
                      <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>{idx + 1}.</span>
                      {q.question}
                    </div>
                    {isCorrect ? (
                      <FiCheckCircle className="status-icon correct" />
                    ) : (
                      <FiXCircle className="status-icon wrong" />
                    )}
                  </div>
                  
                  <div className="analysis-options">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[idx] === opt;
                      const isActuallyCorrect = actualCorrectAnswer === opt;
                      
                      let optionClass = "analysis-option";
                      if (isActuallyCorrect) optionClass += " correct";
                      else if (isSelected && !isCorrect) optionClass += " wrong";

                      return (
                        <div key={optIdx} className={optionClass}>
                          <div className="option-badge">
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <span>{opt}</span>
                          {isSelected && <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'inherit', fontWeight: '600' }}>(Your Answer)</span>}
                        </div>
                      );
                    })}
                    {hasSkipped && (
                      <div className="analysis-option wrong" style={{ marginTop: '0.5rem' }}>
                        <span>⚠️ You skipped this question.</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    );
  }

  const currentQuestion = mcqs[currentIndex];

  return (
    <div className="mcq-view">
      <header className="view-header">
        <div className="title"><FiEdit3 className="text-indigo-400" /> MCQ Suite</div>
      </header>

      <div className="view-content test-view">
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiArrowLeft /> Quit
          </Link>
          <span>Question {currentIndex + 1} of {mcqs.length}</span>
        </div>
        
        <div className="progress-container" style={{ maxWidth: '800px' }}>
          <div className="progress-fill" style={{ width: `${((currentIndex + 1) / mcqs.length) * 100}%` }}></div>
        </div>

        <div className="question-container">
          <div className="question-text">{currentQuestion.question}</div>
          <div className="options-list">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`option-btn ${selectedAnswers[currentIndex] === option ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(option)}
              >
                <span className="option-label">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="action-buttons">
          <button className="secondary-button" onClick={handleBack} disabled={currentIndex === 0}>
            Previous
          </button>
          
          {currentIndex < mcqs.length - 1 ? (
            <button className="primary-button" onClick={handleNext} disabled={!selectedAnswers[currentIndex]}>
              Next
            </button>
          ) : (
            <button className="primary-button" onClick={handleSubmit} disabled={Object.keys(selectedAnswers).length < mcqs.length}>
              Submit Test
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default McqTestView;
