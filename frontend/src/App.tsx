import React from "react";
import { ReduxProvider } from "./components/providers/ReduxProvider";
import ExampleUsage from "./components/ExampleUsage";

function App() {
  return (
    <ReduxProvider>
      <div className="App">
        <h1>Hello World! Welcome to CogniFlow AI Stack.</h1>
        <ExampleUsage />
      </div>
    </ReduxProvider>
  );
}

export default App;
