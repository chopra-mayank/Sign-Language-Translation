import React, { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import * as tmImage from "@teachablemachine/image";

// Forward the ref to allow parent to call methods on CamModel
const CamModel = forwardRef(({ model_url, onPredict, preview = true, size = 200, info = true, interval = null }, ref) => {
  const [prediction, setPrediction] = useState(null);
  const [isCameraRunning, setIsCameraRunning] = useState(false); // Track camera state
  const previewRef = React.useRef();
  const requestRef = React.useRef();
  const intervalRef = React.useRef();
  const webcamRef = React.useRef();

  // Initialize webcam and model
  async function init() {
    const modelURL = model_url + "model.json";
    const metadataURL = model_url + "metadata.json";
    const model = await tmImage.load(modelURL, metadataURL);
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

    if (preview) {
      previewRef.current.replaceChildren(webcam.canvas);
    }

    async function loop() {
      if (webcam === null) {
        return;
      }
      webcam.update(); // update the webcam frame
      await predict();

      if (interval === null) {
        requestRef.current = window.requestAnimationFrame(loop);
      } else {
        intervalRef.current = setTimeout(loop, interval);
      }
    }

    async function predict() {
      // predict can take in an image, video, or canvas HTML element
      const prediction = await model.predict(webcam.canvas);
      setPrediction(prediction);
      if (onPredict) {
        onPredict(prediction);
      }
    }

    setIsCameraRunning(true); // Camera is running
  }

  // Start camera (this is what the parent will use to start the webcam)
  function startCamera() {
    if (!isCameraRunning) {
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

      // Remove the webcam canvas
      document.querySelector("#webcam-container").firstChild?.remove();
    }
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

  let label = [];
  if (info && prediction) {
    label = (
      <table id="label-container">
        <thead>
          <tr>
            <td>class name</td>
            <td>probability</td>
          </tr>
        </thead>
        <tbody>
          {prediction.map((p, i) => (
            <tr key={i}>
              <td>{p.className}</td>
              <td>{p.probability.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div>
      {label}
      <div id="webcam-container" ref={previewRef} />
    </div>
  );
});

export default CamModel;
