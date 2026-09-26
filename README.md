# Sarcasm Detection App

This is a Python-based command-line application that detects whether a given statement is sarcastic or not. It supports both text and voice input. The application is powered by a fine-tuned sequence classification model using the Hugging Face Transformers library.

## Features

- **Text Input:** Type a sentence and get a prediction on whether it's sarcastic.
- **Voice Input:** Speak into your microphone and get a sarcasm prediction based on transcribed text (uses Google Speech Recognition).
- **Pre-trained Model:** Uses a custom-trained transformer model loaded from the local `sarcasm_model` directory.

## Prerequisites

- Python 3.8+
- A working microphone (for voice input)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <your-github-repo-url>
   cd Sarcasm
   ```

2. **Create a Conda environment (Optional but recommended):**
   ```bash
   conda create -n sarcasm python=3.10 -y
   
   # Activate the environment:
   conda activate sarcasm
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Download the Model:**
   The `sarcasm_model` folder contains large model weights (e.g., `model.safetensors` which is ~438MB) and is **not** included in this repository due to GitHub size limits. 
   
   *You must download the model and place it in the root directory.*
   - **Download Link:** [Insert your Google Drive or Hugging Face link here]
   
   Make sure your folder structure looks exactly like this after downloading:
   ```text
   Sarcasm/
   ├── app.py
   ├── requirements.txt
   ├── README.md
   └── sarcasm_model/
       ├── config.json
       ├── model.safetensors
       ├── tokenizer.json
       └── tokenizer_config.json
   ```

## Usage

Run the main application script:

```bash
python app.py
```

You will be presented with an interactive menu:
```text
1. Text
2. Voice
3. Exit
```
Choose `1` to type text manually, or `2` to speak into your microphone.

## Troubleshooting

- **PyAudio Installation Issues:** If you are on Windows and get errors installing PyAudio (needed for Voice input), try installing it using Anaconda (`conda install pyaudio`) or find a pre-compiled `.whl` file for your specific Python version.
- **Model Not Found:** If you get an error that the model cannot be loaded, ensure the `sarcasm_model` folder is in the exact same directory as `app.py` and contains all the necessary `.json` and `.safetensors` files.
