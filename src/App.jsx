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
    timer = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

function fadeTextTransition(element, text) {
  document.querySelector(element).classList.add("fade-out");
  if (text) document.querySelector(element).innerHTML = text;
  setTimeout(() => {
    document.querySelector(element).classList.remove("fade-out");
    document.querySelector(element).classList.add("fade-in");
  }, 300);
  setTimeout(() => {
    document.querySelector(element).classList.remove("fade-in");
  }, 600);
}

let mode = "textToSign";
let signMode = "ase";
const App = () => {
  const [text, setText] = useState("hi");
  const [poseUrl, setPoseUrl] = useState(null);
  const [voicePrediction, setVoicePrediction] = useState("");
  const [modelURL, setModelURL] = useState(APIs.SignToTextASL);
  const camModelRef = useRef();

  const handleStartCamera = () => {
    camModelRef.current.startCamera();
  };

  const handleStopCamera = () => {
    camModelRef.current.stopCamera();
  };

  const fetchPoseData = async (text) => {
    try {
      const dynamicApiUrl = `${APIs.TextToSign}?spoken=en&signed=${signMode}&text=${text}`;
      const response = await fetch(dynamicApiUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch pose data");
      }

      const poseBlob = await response.blob();
      const poseUrl = URL.createObjectURL(poseBlob);
      setPoseUrl(poseUrl);
    } catch (error) {
      console.error("Error fetching pose data:", error);
    }
  };

  function changeTextBase() {
    let tempText = document.querySelector(".text-input").value;
    if (tempText) {
      setText(tempText);
      setTimeout(() => document.querySelector(".pose-viewer-div").classList.remove("hide-pose-viewer"), 1000);
    } else {
      document.querySelector(".pose-viewer-div").classList.add("hide-pose-viewer");
      setText("hi");
    }
  }

  const changeText = debounce(changeTextBase, 1000);
  useEffect(() => {
    document.querySelector(".text-input").addEventListener("input", changeText);
    return () => {
      document.querySelector(".text-input").removeEventListener("input", changeText);
    };
  }, []);

  useEffect(() => {
    if (text) {
      fetchPoseData(text);
    }

    return () => {
      if (poseUrl) {
        URL.revokeObjectURL(poseUrl);
      }
    };
  }, [text]);

  function changeMode() {
    if (mode === "textToSign") {
      mode = "signToText";
      document.querySelector(".sign-mode-text").style.transform = "translateX(3.5em)";
      document.querySelector(".sign-mode-sign").style.transform = `translateX(-${signMode === "ase" ? 3.5 : 3}em)`;
      document.querySelector(".text-card").style.transform = "translateX(26.05vw)";
      document.querySelector(".pose-card").style.transform = "translateX(-26.05vw)";
      fadeTextTransition(".voice-input-div", "");
      fadeTextTransition(".voice-output-div", "");
      document.querySelector(".voice-input-div").classList.add("hide-voice-control");
      document.querySelector(".voice-output-div").classList.remove("hide-voice-control");
      document.querySelector(".text-input").placeholder = "";
      document.querySelector(".text-input").disabled = true;
      fadeTextTransition(".text-card-title", "Output Text");
      fadeTextTransition(".pose-card-title", "Input Feed");
      fadeTextTransition(".change-mode-btn-text", "Sign to Text");
      document.querySelector(".video-output-div").classList.add("hide-video-div");
      handleStartCamera();
      setTimeout(() => (document.querySelector(".text-input").value = ""), 100);
    } else {
      mode = "textToSign";
      document.querySelector(".sign-mode-text").style.transform = "translateX(0)";
      document.querySelector(".sign-mode-sign").style.transform = "translateX(0)";
      document.querySelector(".text-card").style.transform = "translateX(0)";
      document.querySelector(".pose-card").style.transform = "translateX(0)";
      fadeTextTransition(".voice-input-div", "");
      fadeTextTransition(".voice-output-div", "");
      document.querySelector(".voice-output-div").classList.add("hide-voice-control");
      document.querySelector(".voice-input-div").classList.remove("hide-voice-control");
      fadeTextTransition(".text-input", "");
      document.querySelector(".text-input").placeholder = "Enter text";
      document.querySelector(".text-input").disabled = false;
      fadeTextTransition(".text-card-title", "Input Text");
      fadeTextTransition(".pose-card-title", "Output Feed");
      fadeTextTransition(".change-mode-btn-text", "Text to Sign");
      document.querySelector(".video-output-div").classList.remove("hide-video-div");
      handleStopCamera();
      setTimeout(() => (document.querySelector(".text-input").value = ""), 100);
    }
  }

  function changeSignMode() {
    if (signMode === "ase") {
      signMode = "ins";
      fadeTextTransition(".sign-mode-title", "ISL");
      if (mode === "signToText") {
        handleStopCamera();
        setModelURL(APIs.SignToTextISL);
        while (modelURL != APIs.SignToTextASL) setModelURL(APIs.SignToTextISL);
        setTimeout(() => {
          document.querySelector(".text-input").value = "";
          handleStartCamera();
        }, 2000);
      }
    } else if (signMode === "ins") {
      signMode = "ase";
      fadeTextTransition(".sign-mode-title", "ASL");
      if (mode === "signToText") {
        handleStopCamera();
        setModelURL(APIs.SignToTextASL);
        setTimeout(() => {
          document.querySelector(".text-input").value = "";
          handleStartCamera();
        }, 2000);
      }
    }
    document.querySelector(".sign-mode-sign").style.transform = `translateX(-${mode === "signToText" ? (signMode === "ase" ? 3.5 : 3.2) : ""}em)`;
    fetchPoseData(text);
  }

  const { transcript, listening, browserSupportsSpeechRecognition } = useSpeechRecognition();

  function updateViaVoiceBase() {
    document.querySelector(".text-input").value = transcript;
    changeText();
  }

  const updateViaVoice = debounce(updateViaVoiceBase, 500);

  if (transcript) updateViaVoice();

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  function updatePredictionBase(pred) {
    document.querySelector(".text-input").value = pred;
    setVoicePrediction(pred);
  }

  const updatePrediction = debounce(updatePredictionBase, 50);

  return (
    <div className="main-container">
      <h2>Sign Translation</h2>
      <h4 className="sign-mode-label">
        <span className="sign-mode-text">Text</span> to <span className="sign-mode-sign sign-mode-title">ASL</span>
      </h4>
      <div className="mode-selection-div">
        <button onClick={changeMode}>
          <div className="change-mode-btn-text">Text to Sign</div>
        </button>
        <button onClick={changeSignMode}>Change Sign Mode</button>
      </div>
      <div className="app-container">
        <div className="card text-card">
          <h3 className="card-title text-card-title">Input Text</h3>
          <textarea className="text-input" placeholder="Enter text" />
          <div className="voice-control-div">
            <div className="voice-input-div">
              <p className="voice-input-label">Microphone: {listening ? "on" : "off"}</p>
              <div className="voice-input-btn-div">
                <button onClick={SpeechRecognition.startListening}>Start</button>
                <button onClick={SpeechRecognition.stopListening}>Stop</button>
              </div>
            </div>
            <div className="voice-output-div hide-voice-control">
              <span className="voice-output-btn-text">Play</span>
              <Speech text={voicePrediction} />
            </div>
          </div>
        </div>
        <div className="card pose-card">
          <h3 className="card-title pose-card-title">Output Feed</h3>
          <div className="video-input-div">
            <CamModel
              ref={camModelRef}
              preview={true}
              size={300}
              info={false}
              interval={50}
              onPredict={(prediction) => {
                for (let key in prediction) {
                  if (prediction[key].probability > 0.5) {
                    let pred = prediction[key].className;
                    updatePrediction(pred);
                  }
                }
              }}
              model_url={modelURL}
            ></CamModel>
          </div>
          <div className="video-output-div">
            <div className="pose-viewer-div hide-pose-viewer">
              <CustomPoseViewer src={poseUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
