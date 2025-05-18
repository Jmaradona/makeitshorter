import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </div>
  );
}

export default App;