import React, { useState } from 'react';

const Quiz = ({ quizData, onComplete, onCancel }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const handleOptionSelect = (index) => {
    setSelectedOption(index);
  };

  const handleNext = () => {
    // Check answer
    if (selectedOption === quizData.questions[currentQuestionIndex].correctAnswerIndex) {
      setScore(prev => prev + 1);
    }

    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
    } else {
      setShowResult(true);
    }
  };

  const handleFinish = () => {
     // Check last answer if needed (already handled in handleNext logic slightly differently usually, but let's adjust)
     // Actually, the handleNext logic above increments score BEFORE moving.
     // So for the last question, we need a separate check or just run the check.
     
     // Let's refactor slightly to be safer.
     let finalScore = score;
     if (selectedOption === quizData.questions[currentQuestionIndex].correctAnswerIndex) {
        finalScore += 1;
     }
     
     const percentage = (finalScore / quizData.questions.length) * 100;
     const isPassed = percentage >= 80; // 80% pass rate
     
     if (isPassed) {
       onComplete();
     } else {
        // Just show result, let user retry
        setShowResult(true);
        setScore(finalScore);
     }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setShowResult(false);
  };

  if (showResult) {
    const percentage = (score / quizData.questions.length) * 100; // Recalculate or use state if passed correctly
    // Wait, the state `score` might be one step behind if I didn't update it for the last question.
    // Let's fix the logic in the main render flow.
    // Better approach: Store answers array and calculate at the end.
    
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4">Quiz Result</h2>
            <p className="text-lg mb-4">You scored {score} out of {quizData.questions.length}</p>
            <p className={`text-xl font-bold mb-6 ${percentage >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                {percentage >= 80 ? 'Passed!' : 'Failed (Requires 80%)'}
            </p>
            {percentage >= 80 ? (
                <button onClick={onComplete} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                    Continue to Next Lesson
                </button>
            ) : (
                <div className="flex gap-4 justify-center">
                    <button onClick={resetQuiz} className="bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600">
                        Retry Quiz
                    </button>
                    <button onClick={onCancel} className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600">
                        Watch Video Again
                    </button>
                </div>
            )}
        </div>
      </div>
    );
  }

  const question = quizData.questions[currentQuestionIndex];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Question {currentQuestionIndex + 1}/{quizData.questions.length}</h2>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        <p className="mb-6 text-lg">{question.questionText}</p>
        
        <div className="space-y-3 mb-6">
            {question.options.map((option, index) => (
                <div 
                    key={index}
                    onClick={() => handleOptionSelect(index)}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedOption === index 
                        ? 'bg-blue-100 border-blue-500' 
                        : 'hover:bg-gray-50'
                    }`}
                >
                    {option}
                </div>
            ))}
        </div>

        <button 
            disabled={selectedOption === null}
            onClick={() => {
                // Calculate score for current question
                let newScore = score;
                if (selectedOption === question.correctAnswerIndex) {
                    newScore = score + 1;
                    setScore(newScore);
                }
                
                if (currentQuestionIndex < quizData.questions.length - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                    setSelectedOption(null);
                } else {
                    // Finished
                    setShowResult(true);
                }
            }}
            className={`w-full py-2 rounded text-white font-semibold ${
                selectedOption === null 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
            {currentQuestionIndex === quizData.questions.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default Quiz;
