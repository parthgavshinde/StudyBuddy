import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import ChatArea from "./components/ChatArea";
import FlashcardsView from "./components/FlashcardsView";
import McqTestView from "./components/McqTestView";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<ChatArea />} />
          <Route path="flashcards" element={<FlashcardsView />} />
          <Route path="test" element={<McqTestView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
