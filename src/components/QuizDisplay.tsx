import React, { useState } from 'react';
import { Quiz, QuizQuestion } from '../types';
import { generateQuizPDF } from '../utils/pdfUtils';
import { CheckCircle, XCircle, Download, ArrowLeft, RefreshCw } from 'lucide-react';

interface QuizDisplayProps {
  quiz: Quiz;
  onBack: () => void;
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({ quiz, onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(new Array(quiz.questions.length).fill(-1));
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isAnswered = selectedAnswers[currentQuestionIndex] !== -1;

  const handleOptionSelect = (optionIndex: number) => {
    if (showResults) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    let score = 0;
    selectedAnswers.forEach((ans, idx) => {
      if (ans === quiz.questions[idx].correctAnswerIndex) score++;
    });
    return score;
  };

  const score = calculateScore();
  const percentage = Math.round((score / quiz.questions.length) * 100);

  return (
    <div className="flex flex-col h-full bg-gray-50 max-w-4xl mx-auto p-4 md:p-6 w-full text-xs md:text-[16px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
          <ArrowLeft size={20} /> Back to Chat
        </button>
        <button 
          onClick={() => generateQuizPDF(quiz)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <Download size={18} /> Download PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col flex-grow">
        
        {/* Quiz Title Header */}
        <div className="bg-indigo-600 p-6 text-white">
          <h1 className="text-xl md:text-2xl font-bold">{quiz.title}</h1>
          <p className="opacity-90 mt-1">{quiz.description}</p>
        </div>

        {/* Content Area */}
        <div className="p-6 py-4 md:p-8 md:py-4 flex-grow overflow-y-auto">
          {!showResults ? (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs md:text-sm font-medium text-gray-500">
                <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
                <span className="bg-gray-100 px-2 py-1 rounded">Progress: {Math.round(((currentQuestionIndex) / quiz.questions.length) * 100)}%</span>
              </div>

              <div className="mt-2">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 leading-relaxed">
                  {currentQuestion.question}
                </h2>
              </div>

              <div className="space-y-3 mt-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === index;
                  return (
                    <button
                      key={index}
                      onClick={() => handleOptionSelect(index)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3
                        ${isSelected 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-500'
                        }
                      `}
                    >
                      <div className={`size-4 md:size-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}
                      `}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className="font-medium text-sm md:text-lg">{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            // Results View
            <div className="space-y-8 animate-fade-in">
              <div className="text-center space-y-4">
                <div className="inline-block p-4 rounded-full bg-indigo-100 mb-2">
                   {percentage >= 70 ? <CheckCircle className="text-indigo-600 size-6 md:size-12" /> : <RefreshCw className="text-orange-500 size-6 md:size-12" />}
                </div>
                <h2 className="text-xl md:text-3xl font-bold text-gray-900">Quiz Completed!</h2>
                <div className="text-2xl md:text-5xl font-extrabold text-indigo-600">{percentage}%</div>
                <p className="text-gray-500">You scored {score} out of {quiz.questions.length}</p>
              </div>

              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-xl font-bold mb-4 text-slate-500">Review</h3>
                <div className="space-y-6">
                  {quiz.questions.map((q, idx) => {
                    const userAns = selectedAnswers[idx];
                    const isCorrect = userAns === q.correctAnswerIndex;
                    
                    return (
                      <div key={idx} className={`p-4 rounded-lg border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <div className="flex gap-2">
                           <span className="font-bold text-gray-700">{idx + 1}.</span>
                           <div className="flex-1">
                             <p className="font-medium text-gray-900">{q.question}</p>
                             <div className="mt-2 text-sm">
                               <p className={`${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                 Your Answer: <span className="font-bold">{q.options[userAns] || 'Skipped'}</span>
                               </p>
                               {!isCorrect && (
                                 <p className="text-green-700 mt-1">
                                   Correct Answer: <span className="font-bold">{q.options[q.correctAnswerIndex]}</span>
                                 </p>
                               )}
                             </div>
                             <div className="mt-2 text-xs text-gray-500 italic">
                               {q.explanation}
                             </div>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        {!showResults && (
          <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-colors
                ${currentQuestionIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}
              `}
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!isAnswered}
              className={`px-6 py-2 rounded-lg font-medium shadow-md transition-all
                ${!isAnswered 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }
              `}
            >
              {currentQuestionIndex === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizDisplay;