import React, { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import * as tmImage from "@teachablemachine/image";

// Forward the ref to allow parent to call methods on CamModel
const CamModel = forwardRef(({ model_url, onPredict, preview = true, size = 300, info = false, interval = null }, ref) => {
  const [prediction, setPrediction] = useState(null);
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const previewRef = React.useRef();
  const requestRef = React.useRef();
  const intervalRef = React.useRef();
  const webcamRef = React.useRef();
  const modelRef = React.useRef();

  // Initialize webcam and model
  async function init() {
    try {
      setIsLoading(true);
      setError(null);
      
      const modelURL = model_url + "model.json";
      const metadataURL = model_url + "metadata.json";
      
      // Load the model
      const model = await tmImage.load(modelURL, metadataURL);
      modelRef.current = model;
      
      const flip = true; // whether to flip the webcam
      const webcam = new tmImage.Webcam(size, size, flip); // width, height, flip
      webcamRef.current = webcam; // Store the webcam reference

      await webcam.setup(); // request access to the webcam
      await webcam.play();

      if (interval === null) {
        requestRef.current = window.requestAnimationFrame(loop);
      } else {
        intervalRef.current = setTimeout(loop, interval);
      }

      if (preview && previewRef.current) {
        previewRef.current.replaceChildren(webcam.canvas);
      }

      async function loop() {
        if (!webcamRef.current || !modelRef.current) {
          return;
        }
        webcamRef.current.update(); // update the webcam frame
        await predict();

        if (interval === null) {
          requestRef.current = window.requestAnimationFrame(loop);
        } else {
          intervalRef.current = setTimeout(loop, interval);
        }
      }

      async function predict() {
        try {
          // predict can take in an image, video, or canvas HTML element
          const prediction = await modelRef.current.predict(webcamRef.current.canvas);
          setPrediction(prediction);
          if (onPredict) {
            onPredict(prediction);
          }
        } catch (err) {
          console.error("Prediction error:", err);
        }
      }

      setIsCameraRunning(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Camera initialization error:", err);
      setError("Failed to initialize camera. Please check permissions and try again.");
      setIsLoading(false);
    }
  }

  // Start camera (this is what the parent will use to start the webcam)
  function startCamera() {
    if (!isCameraRunning && !isLoading) {
      init(); // Initialize and start the webcam if it's not running
    }
  }

  // Stop camera
  function stopCamera() {
    if (webcamRef.current) {
      const webcam = webcamRef.current;
      webcam.stop(); // Stop the webcam
      setIsCameraRunning(false); // Update the state to reflect that the camera is stopped

      // Cleanup the animation frames and timeouts
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }

      // Clear the webcam canvas
      if (previewRef.current) {
        previewRef.current.innerHTML = '';
      }
      
      // Clean up references
      webcamRef.current = null;
      modelRef.current = null;
    }
    setError(null);
  }

  // Expose startCamera and stopCamera methods to the parent via the ref
  useImperativeHandle(ref, () => ({
    startCamera,
    stopCamera,
  }));

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera(); // Ensure cleanup when the component is unmounted
    };
  }, []);

  // Render prediction info if requested
  let label = null;
  if (info && prediction) {
    label = (
      <div className="prediction-info">
        <table className="prediction-table">
          <thead>
            <tr>
              <th>Class Name</th>
              <th>Probability</th>
            </tr>
          </thead>
          <tbody>
            {prediction.map((p, i) => (
              <tr key={i}>
                <td>{p.className}</td>
                <td>{(p.probability * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="cam-model-container">
      {label}
      <div className="webcam-wrapper">
        {error && (
          <div className="camera-error">
            <p>{error}</p>
            <button onClick={startCamera} className="retry-btn">
              Retry
            </button>
          </div>
        )}
        {isLoading && (
          <div className="camera-loading">
            <div className="loading-spinner"></div>
            <p>Initializing camera...</p>
          </div>
        )}
        {!isCameraRunning && !isLoading && !error && (
          <div className="camera-placeholder">
            <div className="camera-icon">📷</div>
            <p>Camera is ready to start</p>
          </div>
        )}
        <div 
          id="webcam-container" 
          ref={previewRef}
          className={`webcam-container ${isCameraRunning ? 'active' : ''}`}
        />
      </div>
    </div>
  );
});

export default CamModel;