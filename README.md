# Sign Translation Web App

A real-time web app that translates **English** to **American Sign Language (ASL)** and **Indian Sign Language (ISL)** using animated stick figures. The app also supports sign-to-text translation via webcam input.

## Features

- **Text to Sign**: Converts English text to animated stick figure signs in ASL/ISL.
- **Sign to Text**: Recognizes hand gestures through webcam and converts them to text.
- **Real-time**: Instant feedback for both text-to-sign and sign-to-text.
- **Stick Figure Animation**: Simple and clear stick figure representations of signs.
- **Cross-Language Support**: Switch between ASL and ISL.

## Installation

1.  Clone the repo:

    ```bash
    git clone https://github.com/i1sm3ky/Sign-Language-Translation.git
    cd Sign-Language-Translation-main
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Change model API links in `app.jsx`.

        ```

    const APIs = {
    TextToSign: "ADD-YOUR-API-HERE",
    SignToTextASL: "ADD-YOUR-API-HERE",
    SignToTextISL: "ADD-YOUR-API-HERE",
    };
    ```

4.  Run the app:

    ```bash
    npm run dev
    ```

5.  Open `http://localhost:5173` in your browser.

## Usage

- **Text to Sign**: Enter text on left to view the corresponding sign.
- **Sign to Text**: Enable webcam, perform a sign, and see the text translation.
- **Toggle Languages**: Switch between ASL and ISL using the language toggle button.

## Technologies

- **Frontend**: React.js TensorFlow.js/MediaPipe (for gesture recognition)
- **Libraries**: React-pose-viewer, React-teachable-machine,
