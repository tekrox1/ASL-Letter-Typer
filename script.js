class ASLTyper {
    constructor() {
        this.webcam = null;
        this.model = null;
        this.isWebcamRunning = false;
        this.isModelLoaded = false;
        this.predictionLoop = null;
        
        // Detection settings
        this.confidenceThreshold = 0.7;
        this.detectionDelay = 2000; // milliseconds
        this.lastDetection = null;
        this.detectionStartTime = null;
        this.stableDetectionCount = 0;
        this.requiredStableDetections = 10; // Number of consecutive detections needed
        
        // DOM elements
        this.initializeElements();
        this.setupEventListeners();
        this.updateSettingsDisplay();
    }

    initializeElements() {
        this.webcamElement = document.getElementById('webcam');
        this.canvasElement = document.getElementById('canvas');
        this.startBtn = document.getElementById('start-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.modelUrlInput = document.getElementById('model-url');
        this.loadModelBtn = document.getElementById('load-model-btn');
        this.statusMessage = document.getElementById('status-message');
        this.modelStatus = document.getElementById('model-status');
        this.currentLetter = document.getElementById('current-letter');
        this.confidence = document.getElementById('confidence');
        this.predictionsContainer = document.getElementById('predictions-container');
        this.typedOutput = document.getElementById('typed-output');
        this.clearOutputBtn = document.getElementById('clear-output');
        this.copyOutputBtn = document.getElementById('copy-output');
        this.confidenceThresholdSlider = document.getElementById('confidence-threshold');
        this.detectionDelaySlider = document.getElementById('detection-delay');
        this.thresholdValue = document.getElementById('threshold-value');
        this.delayValue = document.getElementById('delay-value');
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startWebcam());
        this.stopBtn.addEventListener('click', () => this.stopWebcam());
        this.loadModelBtn.addEventListener('click', () => this.loadModel());
        this.clearOutputBtn.addEventListener('click', () => this.clearOutput());
        this.copyOutputBtn.addEventListener('click', () => this.copyOutput());
        
        this.confidenceThresholdSlider.addEventListener('input', (e) => {
            this.confidenceThreshold = parseFloat(e.target.value);
            this.updateSettingsDisplay();
        });
        
        this.detectionDelaySlider.addEventListener('input', (e) => {
            this.detectionDelay = parseFloat(e.target.value) * 1000;
            this.updateSettingsDisplay();
        });
    }

    updateSettingsDisplay() {
        this.thresholdValue.textContent = this.confidenceThreshold.toFixed(1);
        this.delayValue.textContent = (this.detectionDelay / 1000).toFixed(1);
    }

    async startWebcam() {
        try {
            this.statusMessage.textContent = 'Starting camera...';
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });
            
            this.webcamElement.srcObject = stream;
            this.isWebcamRunning = true;
            
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.statusMessage.textContent = 'Camera started successfully';
            
            // Start prediction loop if model is loaded
            if (this.isModelLoaded) {
                this.startPredictionLoop();
            }
            
        } catch (error) {
            console.error('Error starting webcam:', error);
            this.statusMessage.textContent = 'Error: Could not access camera';
        }
    }

    stopWebcam() {
        if (this.webcamElement.srcObject) {
            const tracks = this.webcamElement.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.webcamElement.srcObject = null;
        }
        
        this.isWebcamRunning = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.statusMessage.textContent = 'Camera stopped';
        
        if (this.predictionLoop) {
            clearInterval(this.predictionLoop);
            this.predictionLoop = null;
        }
    }

    async loadModel() {
        const modelUrl = this.modelUrlInput.value.trim();
        if (!modelUrl) {
            alert('Please enter a valid Teachable Machine model URL');
            return;
        }

        try {
            this.modelStatus.textContent = 'Loading model...';
            this.loadModelBtn.disabled = true;

            // Load the model
            this.model = await tmImage.load(modelUrl + 'model.json', modelUrl + 'metadata.json');

            // Debug: Log model information
            console.log('Model loaded successfully!');
            console.log('Number of classes:', this.model.getTotalClasses());
            console.log('Class names:', this.model.getClassLabels());

            this.isModelLoaded = true;
            this.modelStatus.textContent = `Model loaded: ${this.model.getTotalClasses()} classes`;
            this.loadModelBtn.disabled = false;

            // Start prediction loop if webcam is running
            if (this.isWebcamRunning) {
                this.startPredictionLoop();
            }

        } catch (error) {
            console.error('Error loading model:', error);
            this.modelStatus.textContent = 'Error loading model';
            this.loadModelBtn.disabled = false;
        }
    }

    startPredictionLoop() {
        if (this.predictionLoop) {
            clearInterval(this.predictionLoop);
        }
        
        this.predictionLoop = setInterval(() => {
            this.predict();
        }, 100); // Predict every 100ms
    }

    async predict() {
        if (!this.model || !this.isWebcamRunning) return;

        try {
            const predictions = await this.model.predict(this.webcamElement);
            this.processPredictions(predictions);
        } catch (error) {
            console.error('Prediction error:', error);
        }
    }

    processPredictions(predictions) {
        // Debug: Log all predictions
        console.log('All predictions:', predictions.map(p => `${p.className}: ${(p.probability * 100).toFixed(1)}%`));

        // Sort predictions by confidence
        predictions.sort((a, b) => b.probability - a.probability);

        // Display all predictions
        this.displayPredictions(predictions);

        // Get the top prediction
        const topPrediction = predictions[0];
        const confidence = topPrediction.probability;
        const letter = topPrediction.className;

        // Update current detection display
        this.currentLetter.textContent = letter;
        this.confidence.textContent = `${(confidence * 100).toFixed(1)}%`;

        // Check if confidence meets threshold
        if (confidence >= this.confidenceThreshold) {
            this.handleStableDetection(letter, confidence);
        } else {
            this.resetDetection();
        }
    }

    displayPredictions(predictions) {
        this.predictionsContainer.innerHTML = '';
        predictions.forEach(prediction => {
            const item = document.createElement('div');
            item.className = 'prediction-item';
            item.innerHTML = `
                <span>${prediction.className}</span>
                <span>${(prediction.probability * 100).toFixed(1)}%</span>
            `;
            this.predictionsContainer.appendChild(item);
        });
    }

    handleStableDetection(letter, confidence) {
        const currentTime = Date.now();
        
        if (this.lastDetection === letter) {
            this.stableDetectionCount++;
            
            // Check if we have enough stable detections and enough time has passed
            if (this.stableDetectionCount >= this.requiredStableDetections) {
                if (!this.detectionStartTime) {
                    this.detectionStartTime = currentTime;
                }
                
                const timeElapsed = currentTime - this.detectionStartTime;
                if (timeElapsed >= this.detectionDelay) {
                    this.typeLetter(letter);
                    this.resetDetection();
                }
            }
        } else {
            // New letter detected, reset counters
            this.lastDetection = letter;
            this.stableDetectionCount = 1;
            this.detectionStartTime = null;
        }
    }

    resetDetection() {
        this.lastDetection = null;
        this.stableDetectionCount = 0;
        this.detectionStartTime = null;
    }

    typeLetter(letter) {
        const currentText = this.typedOutput.value;
        this.typedOutput.value = currentText + letter;
        
        // Scroll to bottom
        this.typedOutput.scrollTop = this.typedOutput.scrollHeight;
        
        console.log(`Typed letter: ${letter}`);
    }

    clearOutput() {
        this.typedOutput.value = '';
    }

    async copyOutput() {
        try {
            await navigator.clipboard.writeText(this.typedOutput.value);
            this.copyOutputBtn.textContent = 'Copied!';
            setTimeout(() => {
                this.copyOutputBtn.textContent = 'Copy to Clipboard';
            }, 2000);
        } catch (error) {
            console.error('Failed to copy text:', error);
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ASLTyper();
});
