import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Paperclip, FileText, Image as ImageIcon, File, Sparkles, X, BrainCircuit, Plus, Settings2, Check } from 'lucide-react';
import { Message, MessageRole, FileAttachment, Quiz } from '../types';
import { fileToBase64, readDocxAsText, readFileAsText } from '../utils/fileUtils';

interface ChatInterfaceProps {
  onQuizGenerated: (quiz: Quiz) => void;
}

type ToolType = 'NONE' | 'QUIZ';

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onQuizGenerated }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: MessageRole.MODEL,
      text: "Hello! I'm QuizMaster. Upload your study materials and ask questions, or use the Tools menu to generate a custom quiz.",
      timestamp: Date.now()
    }
  ]);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolType>('NONE');
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close tools menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setShowToolsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const newAttachments: FileAttachment[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      try {
        let type = file.type;
        let data = '';

        if (file.name.endsWith('.docx')) {
            data = await readDocxAsText(file);
            type = 'text/plain'; 
        } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            data = await readFileAsText(file);
            type = 'text/plain';
        } else {
            data = await fileToBase64(file);
        }

        if (!type && file.name.endsWith('.pdf')) type = 'application/pdf';

        newAttachments.push({
          name: file.name,
          type: type,
          data: data
        });
      } catch (error) {
        console.error("Error processing file", file.name, error);
        alert(`Failed to process ${file.name}. Please ensure it is a valid file.`);
      }
    }

    setFiles(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && files.length === 0) || isLoading) return;

    if (activeTool === 'QUIZ') {
      await handleGenerateQuiz();
    } else {
      await handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === MessageRole.USER ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const formData = { history , newMessage : userMsg.text, files }
      const response = await fetch("/api/generate-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body : JSON.stringify(formData)
      })
      const data = await response.json();
      console.log(data)

      if(response.status === 200) {
        const modelMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: MessageRole.MODEL,
          text: data.text,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, modelMsg]);
      } else {
        throw new Error(data.message || "Unknown error")
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: MessageRole.MODEL,
        text: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: Date.now(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    const prompt = input; // Capture current input before clearing
    setInput('');
    setIsLoading(true);

    const tempId = Date.now().toString();
    setMessages(prev => [...prev, {
        id: tempId,
        role: MessageRole.USER,
        text: prompt || "Generate a quiz based on the attached files.",
        timestamp: Date.now()
    }]);

    // Show temporary loading message
    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: loadingId,
      role: MessageRole.MODEL,
      text: "Analyzing content and generating quiz...",
      timestamp: Date.now()
    }]);

    try {
      const formdata = {
        files,
        prompt : prompt || "Generate a quiz based on the attached files."
      }

      const response = await fetch("/api/generate-quiz", {
        method : "POST",
        headers : {
          "Content-Type" : "application/json"
        },
        body : JSON.stringify(formdata)
      })
      
      const result = await response.json();

      if(response.ok) {
        setMessages(prev => {
          // Remove the temporary loading message
          const filtered = prev.filter(m => m.id !== loadingId);
          
          if (result.refusalReason) {
             return [...filtered, {
               id: Date.now().toString(),
               role: MessageRole.MODEL,
               text: result.refusalReason,
               timestamp: Date.now(),
               isError: true
             }];
          } else if (result.quiz) {
             return [...filtered, {
               id: Date.now().toString(),
               role: MessageRole.MODEL,
               text: `I've generated a quiz titled "**${result.quiz.title}**" with ${result.quiz.questions.length} questions based on your request.`,
               quizData: result.quiz,
               timestamp: Date.now()
             }];
          }
          return filtered;
        });
      } else {
        throw new Error(result.refusalReason || "Unknown error")
      }
    } catch (error) {
       setMessages(prev => prev.map(m => {
          if (m.id === loadingId) {
              return {
                  ...m,
                  text: "Sorry, I failed to generate a valid quiz. Please try again with different files or instructions.",
                  isError: true
              };
          }
          return m;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon size={16} />;
    if (type.includes('pdf')) return <FileText size={16} />;
    if (type.includes('text')) return <FileText size={16} />;
    return <File size={16} />;
  };

  const toggleTool = (tool: ToolType) => {
    if (activeTool === tool) {
      setActiveTool('NONE');
    } else {
      setActiveTool(tool);
    }
    setShowToolsMenu(false);
  };

  return (
    <div className="flex flex-col h-full bg-white max-w-5xl mx-auto shadow-2xl rounded-none md:rounded-2xl overflow-hidden border border-gray-100">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <BrainCircuit size={24} />
            </div>
            <div>
                <h1 className="font-bold text-xl text-gray-800">QuizMaster</h1>
                <p className="text-xs text-gray-500">Study Assistant</p>
            </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
        {messages.map((msg) => {
          const isUser = msg.role === MessageRole.USER;
          return (
            <div
              key={msg.id}
              className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed break-words
                  ${isUser 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : msg.isError 
                      ? 'bg-orange-50 text-orange-900 border border-orange-100 rounded-bl-none'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }
                `}
              >
                <ReactMarkdown
                  components={{
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                  }}
                >
                  {msg.text}
                </ReactMarkdown>

                {/* Render Quiz Button if data exists */}
                {msg.quizData && (
                    <div className="mt-4 pt-4 border-t border-gray-100/50">
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                            <h3 className="font-bold text-indigo-900 text-lg mb-1">{msg.quizData.title}</h3>
                            <p className="text-indigo-700 text-xs mb-3">{msg.quizData.questions.length} Questions</p>
                            <button 
                              onClick={() => msg.quizData && onQuizGenerated(msg.quizData)}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                               <Sparkles size={16} /> Start Quiz
                            </button>
                        </div>
                    </div>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && (
            <div className="flex justify-start w-full">
                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 relative">
        
        {/* File Previews */}
        {files.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
            {files.map((file, idx) => (
              <div key={idx} className="relative flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-medium border border-indigo-100 shrink-0">
                {getFileIcon(file.type)}
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button onClick={() => removeFile(idx)} className="hover:text-red-500 ml-1">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          
          <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all flex flex-col relative">
             
             {/* Active Tool Indicator */}
             {activeTool === 'QUIZ' && (
                <div className="flex items-center gap-2 px-3 pt-2">
                   <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles size={10} /> QUIZ MODE ACTIVE
                   </span>
                </div>
             )}

             <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder={activeTool === 'QUIZ' ? "Enter topic or instructions for the quiz..." : "Ask about your documents..."}
                className="w-full bg-transparent border-none p-3 focus:ring-0 resize-none max-h-32 min-h-[50px] outline-none text-gray-700"
                rows={1}
             />
             <div className="flex justify-between items-center px-2 pb-2">
                 <div className="flex gap-2 items-center">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Upload file"
                    >
                        <Paperclip size={20} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        multiple 
                        accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp"
                    />

                    {/* Tools Menu Button */}
                    <div className="relative" ref={toolsMenuRef}>
                        <button
                        onClick={() => setShowToolsMenu(!showToolsMenu)}
                        className={`py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium
                            ${showToolsMenu || activeTool !== 'NONE' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}
                        `}
                        title="Tools"
                        >
                            <Plus size={16} className={showToolsMenu ? 'rotate-45 transition-transform' : 'transition-transform'} />
                            <span className="hidden sm:inline">Tools</span>
                        </button>

                        {/* Dropdown Menu */}
                        {showToolsMenu && (
                        <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-fade-in">
                            <div className="p-2">
                                <div className="text-xs font-semibold text-gray-400 px-3 py-2 uppercase tracking-wider">Productivity</div>
                                <button 
                                onClick={() => toggleTool('QUIZ')}
                                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 text-sm transition-colors
                                    ${activeTool === 'QUIZ' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}
                                `}
                                >
                                <div className={`p-1.5 rounded-md ${activeTool === 'QUIZ' ? 'bg-indigo-200' : 'bg-gray-100'}`}>
                                    <Sparkles size={16} />
                                </div>
                                <div className="flex-1">Quiz Generator</div>
                                {activeTool === 'QUIZ' && <Check size={16} />}
                                </button>
                            </div>
                        </div>
                        )}
                    </div>
                 </div>
                 <div className="text-xs text-gray-400 px-2">
                     {input.length}/2000
                 </div>
             </div>
          </div>
          
          <button
              onClick={handleSend}
              disabled={(!input && files.length === 0) || isLoading}
              className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center
                ${(!input && files.length === 0) || isLoading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : activeTool === 'QUIZ'
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }
              `}
              title={activeTool === 'QUIZ' ? "Generate Quiz" : "Send Message"}
          >
              {activeTool === 'QUIZ' ? <Sparkles size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;