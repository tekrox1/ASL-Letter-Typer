# ASL Letter Typer

A web application that uses your webcam to detect ASL (American Sign Language) letters and automatically type them.

## Features

- **Real-time ASL Detection**: Uses your webcam to detect ASL letters in real-time
- **Automatic Typing**: Detected letters are automatically typed after a configurable delay
- **Confidence Threshold**: Adjustable confidence threshold to filter out uncertain predictions
- **Stable Detection**: Requires multiple consecutive detections before typing to avoid false positives
- **Live Predictions**: Shows all model predictions with confidence scores
- **Customizable Settings**: Adjust detection delay and confidence threshold
- **Copy to Clipboard**: Easy copying of typed text

## How to Use

### 1. Prepare Your Teachable Machine Model

1. Go to [Teachable Machine](https://teachablemachine.withgoogle.com/)
2. Create an "Image Project"
3. Train your model with ASL letter images for each letter (A-Z)
4. Export your model and get the shareable link
5. Your model URL should look like: `https://teachablemachine.withgoogle.com/models/YOUR_MODEL_ID/`

### 2. Run the Application

1. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)
2. Allow camera access when prompted
3. Enter your Teachable Machine model URL in the input field
4. Click "Load Model" to load your trained model
5. Click "Start Camera" to begin webcam capture
6. Hold up ASL letters in front of your camera
7. Watch as detected letters are automatically typed!

### 3. Adjust Settings

- **Confidence Threshold**: Minimum confidence required for detection (0.1 - 1.0)
- **Detection Delay**: How long to hold a letter before it's typed (1-5 seconds)

## Technical Details

### Requirements

- Modern web browser with webcam support
- HTTPS connection (required for webcam access)
- Trained Teachable Machine model for ASL letters

### How It Works

1. **Webcam Capture**: Accesses your camera using WebRTC APIs
2. **Real-time Prediction**: Continuously analyzes webcam frames (10 FPS)
3. **Stable Detection**: Requires 10+ consecutive detections above confidence threshold
4. **Timed Typing**: Types letter after holding it for the specified delay period

### File Structure

```
asltyper/
├── index.html      # Main HTML file
├── style.css       # Styling and layout
├── script.js       # Main application logic
└── README.md       # This file
```

## Troubleshooting

### Camera Issues
- Ensure you're using HTTPS (required for webcam access)
- Check browser permissions for camera access
- Try refreshing the page if camera doesn't start

### Model Loading Issues
- Verify your Teachable Machine model URL is correct
- Ensure the model was exported as a "TensorFlow.js" model
- Check browser console for error messages

### Detection Issues
- Ensure good lighting conditions
- Hold letters clearly in front of the camera
- Adjust confidence threshold if getting too many/few detections
- Make sure your model was trained with similar hand positions and backgrounds

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

## Privacy

- All processing happens locally in your browser
- No data is sent to external servers (except loading the model)
- Webcam feed is not recorded or transmitted

## License

This project is open source and available under the MIT License.
