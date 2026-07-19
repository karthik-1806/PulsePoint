"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2 } from 'lucide-react';
import VenueMap from './VenueMap';
import { useAccessibility } from '@/lib/AccessibilityContext';

export default function FanAgentWidget() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'agent'; text: string }[]>([]);
  const { globalLanguage: language, setGlobalLanguage: setLanguage } = useAccessibility();
  const [stepFree, setStepFree] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [route, setRoute] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const isArabic = language === 'Arabic';
  
  // Speech Recognition setup (Web Speech API)
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      // Very basic language mapping for speech recognition
      const langMap: Record<string, string> = {
        'English': 'en-US',
        'Spanish': 'es-ES',
        'French': 'fr-FR',
        'Portuguese': 'pt-PT',
        'Arabic': 'ar-SA',
        'Mandarin': 'zh-CN'
      };
      recognitionRef.current.lang = langMap[language] || 'en-US';
    }
  }, [language]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Could not start speech recognition", e);
      }
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      // Try to find a matching voice
      const langMap: Record<string, string> = {
        'English': 'en', 'Spanish': 'es', 'French': 'fr', 
        'Portuguese': 'pt', 'Arabic': 'ar', 'Mandarin': 'zh'
      };
      utterance.lang = langMap[language] || 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    const userMsg = query.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setQuery('');
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const res = await fetch(`${API_URL}/fan-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMsg,
          language,
          step_free: stepFree
        })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'agent', text: data.response }]);
      if (data.route && data.route.length > 0) {
        setRoute(data.route);
      }
      speak(data.response);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'agent', text: "Sorry, there was an error connecting to the agent." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex flex-col md:flex-row gap-6 p-6 max-w-5xl mx-auto bg-white/90 backdrop-blur-lg rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] border border-white/40 mt-10 transition-all hover:shadow-[0_20px_60px_rgba(8,_112,_184,_0.15)]"
    >
      <div className="flex-1 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-slate-800">PulsePoint Fan Agent</h2>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            Language:
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="p-2 border rounded-md bg-white"
              aria-label="Select Language"
            >
              {['English', 'Spanish', 'French', 'Portuguese', 'Arabic', 'Mandarin'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
          
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={stepFree} 
              onChange={(e) => setStepFree(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
              aria-label="Toggle Step-Free Route"
            />
            Step-Free Route
          </label>
        </div>

        {/* Quick Questions */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-slate-700">Quick questions</h3>
          <div className="flex flex-wrap gap-2">
            {[
              "Which gate should I use for section 150?",
              "What is the step-free route to accessible seating?",
              "Where is the nearest prayer room?",
              "How do I get to the metro after the match?",
              "Where can I refill a water bottle?"
            ].map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const fixedAnswers: Record<string, string> = {
                    "Which gate should I use for section 150?": "For Section 150, the closest entry is Gate C. Once inside, follow the blue concourse signs to your right.",
                    "What is the step-free route to accessible seating?": "Please use the designated accessible entrance at Gate A. Elevators are located immediately to the left after security.",
                    "Where is the nearest prayer room?": "The nearest multi-faith prayer room is located on the main concourse near Section 120, adjacent to the family restrooms.",
                    "How do I get to the metro after the match?": "To reach the Metro station, exit via the North Gates and follow the pedestrian walkway on 1st Avenue for about 3 blocks.",
                    "Where can I refill a water bottle?": "Water refill stations are located outside most major restrooms. The closest one to your current location is near Section 112."
                  };
                  const fixedRoutes: Record<string, string[]> = {
                    "Which gate should I use for section 150?": ["Gate C", "Main Concourse (Right)", "Section 150"],
                    "What is the step-free route to accessible seating?": ["Gate A (Accessible Entry)", "Elevator 1", "Accessible Seating Deck"],
                    "Where is the nearest prayer room?": ["Current Location", "Main Concourse", "Section 120", "Multi-faith Prayer Room"],
                    "How do I get to the metro after the match?": ["North Gates", "Pedestrian Walkway", "1st Avenue", "Metro Station"],
                    "Where can I refill a water bottle?": ["Current Location", "Concourse Restrooms", "Water Station (Near Sec 112)"]
                  };
                  setMessages(prev => [
                    ...prev,
                    { role: 'user', text: q },
                    { role: 'agent', text: fixedAnswers[q] || "I don't have a fixed answer for that." }
                  ]);
                  setRoute(fixedRoutes[q] || []);
                }}
                className="px-4 py-2 bg-slate-800 text-slate-200 text-sm rounded-full border border-slate-700 hover:bg-slate-700 transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div 
          className="flex-1 min-h-[300px] border border-slate-200 rounded-lg p-4 bg-slate-50 overflow-y-auto flex flex-col gap-3"
          aria-live="polite"
          aria-atomic="false"
        >
          {messages.length === 0 && (
            <p className="text-slate-400 text-center mt-auto mb-auto">How can I help you navigate Lumen Field?</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-sm' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
              }`}>
                {m.role === 'agent' && (
                  <button 
                    onClick={() => speak(m.text)} 
                    className="float-right ml-2 text-slate-400 hover:text-blue-500 transition-colors"
                    aria-label="Read aloud"
                  >
                    <Volume2 size={16} />
                  </button>
                )}
                <p className="text-sm leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start">
               <div className="bg-slate-200 animate-pulse w-24 h-8 rounded-full"></div>
             </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <button
            type="button"
            onClick={toggleListen}
            className={`p-3 rounded-full transition-colors flex items-center justify-center ${
              isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 p-3 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Text input for Fan Agent"
          />
          
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
      
      {/* Visual Map Area */}
      <div className="md:w-1/3 flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-slate-800">Route Map</h3>
        <VenueMap route={route} />
        {route.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Current Route</h4>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              {route.map((node, i) => (
                <li key={i}>{node}</li>
              ))}
            </ol>
            {stepFree && (
              <span className="inline-block mt-3 px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">
                Step-Free Path
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
