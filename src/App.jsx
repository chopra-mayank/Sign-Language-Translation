import "regenerator-runtime/runtime";
import React, { useEffect, useState, useRef } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import Speech from "react-speech";
import CamModel from "./CamModel";
import CustomPoseViewer from "./CustomPoseViewer";
import "./app.css";

 const APIs = {
 TextToSign: "ADD-YOUR-API-HERE",
 SignToTextASL: "ADD-YOUR-API-HERE",
 SignToTextISL: "ADD-YOUR-API-HERE",
 };

function debounce(callback, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), delay);
  };
}

const App = () => {
  const [text, setText] = useState("");
  const [poseUrl, setPoseUrl] = useState(null);
  const [voicePrediction, setVoicePrediction] = useState("");
  const [modelURL, setModelURL] = useState(APIs.SignToTextASL);
  const [mode, setMode] = useState("textToSign"); // textToSign or signToText
  const [signMode, setSignMode] = useState("asl"); // asl or isl
  const [inputValue, setInputValue] = useState("");
  const camModelRef = useRef();

  const handleStartCamera = () => camModelRef.current?.startCamera();
  const handleStopCamera = () => camModelRef.current?.stopCamera();

  const fetchPoseData = async (text) => {
    if (!text.trim()) {
      setPoseUrl(null);
      return;
    }
    try {
      const signModeParam = signMode === "asl" ? "ase" : "ins";
      const url = `${APIs.TextToSign}?spoken=en&signed=${signModeParam}&text=${text}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch pose data");
      const blob = await response.blob();
      const poseUrl = URL.createObjectURL(blob);
      setPoseUrl(poseUrl);
    } catch (error) {
      console.error("Error fetching pose data:", error);
    }
  };

  const handleTextChange = debounce((value) => {
    setText(value);
  }, 1000);

  const toggleMode = () => {
    const newMode = mode === "textToSign" ? "signToText" : "textToSign";
    setMode(newMode);
    setText("");
    setInputValue("");
    setPoseUrl(null);
    setVoicePrediction("");
    
    if (newMode === "signToText") {
      handleStartCamera();
    } else {
      handleStopCamera();
    }
  };

  const toggleSignMode = () => {
    const newSignMode = signMode === "asl" ? "isl" : "asl";
    setSignMode(newSignMode);
    setModelURL(newSignMode === "asl" ? APIs.SignToTextASL : APIs.SignToTextISL);
    
    if (mode === "signToText") {
      handleStopCamera();
      setTimeout(() => {
        setText("");
        setVoicePrediction("");
        handleStartCamera();
      }, 1000);
    }
    
    if (text && mode === "textToSign") {
      fetchPoseData(text);
    }
  };

  const { transcript, listening, browserSupportsSpeechRecognition } = useSpeechRecognition();

  const updateViaVoice = debounce(() => {
    if (transcript) {
      setInputValue(transcript);
      setText(transcript);
    }
  }, 500);

  useEffect(() => {
    if (transcript) {
      updateViaVoice();
    }
  }, [transcript]);

  const updatePrediction = debounce((pred) => {
    setText(pred);
    setVoicePrediction(pred);
  }, 50);

  useEffect(() => {
    if (text && mode === "textToSign") {
      fetchPoseData(text);
    }
  }, [text, mode, signMode]);

  // Cleanup pose URL when component unmounts
  useEffect(() => {
    return () => {
      if (poseUrl) {
        URL.revokeObjectURL(poseUrl);
      }
    };
  }, [poseUrl]);

  // Add effect to ensure full width on mount
  useEffect(() => {
    // Force full width by setting body and html styles
    document.documentElement.style.width = '100%';
    document.documentElement.style.maxWidth = 'none';
    document.body.style.width = '100%';
    document.body.style.maxWidth = 'none';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    // Also check for any parent containers
    const appRoot = document.getElementById('root');
    if (appRoot) {
      appRoot.style.width = '100%';
      appRoot.style.maxWidth = 'none';
    }

    return () => {
      // Cleanup on unmount
      document.documentElement.style.width = '';
      document.documentElement.style.maxWidth = '';
      document.body.style.width = '';
      document.body.style.maxWidth = '';
    };
  }, []);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="app" style={{ width: '100%', maxWidth: 'none' }}>
        <div className="error-message">
          <h2>Browser doesn't support speech recognition.</h2>
          <p>Please use a modern browser like Chrome, Firefox, or Safari.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app" style={{ width: '100%', maxWidth: 'none', minWidth: '100vw' }}>
      {/* Header */}
      <header className="header" style={{ width: '100%', maxWidth: 'none' }}>
        <div className="header-content" style={{ width: '100%', maxWidth: 'none' }}>
          <div className="logo">
            <span className="logo-icon">🤟</span>
            <span className="logo-text">Sign Translation</span>
          </div>
          <div className="header-buttons">
            <button 
              className="header-btn switch-btn"
              onClick={toggleSignMode}
            >
              Switch to {signMode === "asl" ? "ISL" : "ASL"}
            </button>
            <button 
              className="header-btn primary change-mode-btn"
              onClick={toggleMode}
            >
              Change Sign Mode
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content" style={{ width: '100%', maxWidth: 'none' }}>
        <div className="translation-header">
          <h1 className="translation-title">
            {signMode === "asl" ? "American Sign Language" : "Indian Sign Language"}
          </h1>
          <p className="translation-subtitle">
            Current Mode: {mode === "textToSign" ? "Text to Sign" : "Sign to Text"}
          </p>
        </div>

        <div className="cards-container" style={{ width: '100%', maxWidth: 'none' }}>
          {/* Input Card */}
          <div className="card input-card" style={{ width: '100%', maxWidth: 'none' }}>
            <h3 className="card-title">
              {mode === "textToSign" ? "Input Text" : "Input Feed"}
            </h3>
            <div className="card-content" style={{ width: '100%' }}>
              {mode === "textToSign" ? (
                <>
                  <textarea
                    className="text-input"
                    placeholder="Enter text to translate to sign language..."
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      handleTextChange(e.target.value);
                    }}
                    value={inputValue}
                    style={{ width: '100%', maxWidth: 'none' }}
                  />
                  <div className="voice-controls" style={{ width: '100%' }}>
                    <div className="mic-status">
                      <span className="mic-icon">🎤</span>
                      <span className="mic-text">Microphone: {listening ? "on" : "off"}</span>
                    </div>
                    <div className="voice-buttons">
                      <button 
                        className={`voice-btn start-btn ${listening ? "listening" : ""}`}
                        onClick={SpeechRecognition.startListening}
                        disabled={listening}
                      >
                        Start
                      </button>
                      <button 
                        className="voice-btn stop-btn"
                        onClick={SpeechRecognition.stopListening}
                        disabled={!listening}
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="camera-section" style={{ width: '100%' }}>
                  <CamModel
                    ref={camModelRef}
                    preview={true}
                    size={300}
                    info={false}
                    interval={50}
                    onPredict={(prediction) => {
                      for (let key in prediction) {
                        if (prediction[key].probability > 0.5) {
                          updatePrediction(prediction[key].className);
                        }
                      }
                    }}
                    model_url={modelURL}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Output Card */}
          <div className="card output-card" style={{ width: '100%', maxWidth: 'none' }}>
            <h3 className="card-title">
              {mode === "textToSign" ? "Output Feed" : "Output Text"}
            </h3>
            <div className="card-content" style={{ width: '100%' }}>
              {mode === "textToSign" ? (
                <div className="pose-section" style={{ width: '100%' }}>
                  {text ? (
                    <CustomPoseViewer src={poseUrl} />
                  ) : (
                    <div className="pose-placeholder">
                      Enter text to see the sign language translation
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-output" style={{ width: '100%' }}>
                  <div className="output-text">
                    {text || "Start signing to see the translation..."}
                  </div>
                  {text && (
                    <div className="speech-output">
                      <Speech 
                        text={voicePrediction || text}
                        textAsButton={true}
                        displayText="🔊 Play"
                        voice="Google US English"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="tips-section" style={{ width: '100%' }}>
          <h3 className="tips-title">Quick Tips</h3>
          <div className="tips-grid" style={{ width: '100%' }}>
            <div className="tip-card lighting-tip">
              <h4 className="tip-title">Lighting</h4>
              <p className="tip-description">
                Ensure good lighting conditions for better recognition accuracy
              </p>
            </div>
            <div className="tip-card positioning-tip">
              <h4 className="tip-title">Positioning</h4>
              <p className="tip-description">
                Keep your hands within the camera frame and maintain proper distance
              </p>
            </div>
            <div className="tip-card gestures-tip">
              <h4 className="tip-title">Gestures</h4>
              <p className="tip-description">
                Make clear, deliberate gestures and avoid rapid movements
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
