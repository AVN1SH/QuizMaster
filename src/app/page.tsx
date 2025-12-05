"use client";
import React, { useState } from 'react';
import ChatInterface from '../components/ChatInterface';
import QuizDisplay from '../components/QuizDisplay';
import { Quiz, AppView } from '../types';


const page: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  const handleQuizGenerated = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentView(AppView.QUIZ);
  };

  const handleBackToChat = () => {
    setCurrentView(AppView.CHAT);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-0 md:p-6 font-sans">

      <div className={`w-full h-screen md:h-[90vh] max-w-5xl transition-opacity duration-300 ${currentView === AppView.CHAT ? 'block opacity-100' : 'hidden opacity-0'}`}>
          <ChatInterface onQuizGenerated={handleQuizGenerated} />
      </div>

      {currentView === AppView.QUIZ && activeQuiz && (
          <div className="w-full h-screen md:h-[95vh] max-w-5xl animate-fade-in">
              <QuizDisplay 
                  quiz={activeQuiz} 
                  onBack={handleBackToChat} 
              />
          </div>
      )}
    </div>
  );
};

export default page;