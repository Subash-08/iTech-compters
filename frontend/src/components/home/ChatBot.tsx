import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const ChatBot = ({ open, onClose }) => {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi 👋, I'm your AI assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(
        "https://n8n.srv1174153.hstgr.cloud/webhook/itech-chat-bot",
        { message: userMessage },
        { headers: { "Content-Type": "application/json" } }
      );

      const botReply =
        response.data?.output || "Sorry, I couldn’t find any info on that.";

      setMessages((prev) => [...prev, { role: "bot", text: botReply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "⚠️ Something went wrong. Please try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-20 right-6 w-80 h-96 bg-white shadow-2xl rounded-3xl border border-gray-200 flex flex-col z-[10000]">
      {/* Header */}
      <div className="bg-blue-500 text-white px-5 py-4 rounded-t-3xl font-semibold flex justify-between items-center">
        <span>AI Assistant</span>
        <button onClick={onClose} className="text-white text-lg">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`my-2 flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-2xl text-sm max-w-[80%] ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-sm text-gray-500 animate-pulse">Thinking…</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center border-t p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 text-sm bg-gray-100 rounded-full outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="ml-2 bg-blue-500 text-white p-3 rounded-full"
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
