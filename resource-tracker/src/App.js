import React from "react";
import ResourceTracker from "./ResourceTracker";
import Footer from "./footer";
function App() {
  return (
    <div className="App">
      <div className="page-wrapper">
        <ResourceTracker />
        <main className="page-content">
          {/* optional additional content */}
        </main>
        {/* <Footer /> */}
      </div>
    </div>
  );
}

export default App;
