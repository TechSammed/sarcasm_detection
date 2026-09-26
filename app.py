from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import speech_recognition as sr

# Load model
tokenizer = AutoTokenizer.from_pretrained("sarcasm_model")
model = AutoModelForSequenceClassification.from_pretrained("sarcasm_model")

def predict(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    outputs = model(**inputs)

    probs = torch.softmax(outputs.logits, dim=1)
    pred = torch.argmax(probs).item()

    print("Probabilities:", probs.tolist())

    return "Sarcastic 😏" if pred == 1 else "Not Sarcastic 🙂"

def voice_input():
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("Speak...")
        audio = r.listen(source)

    try:
        text = r.recognize_google(audio)
        print("You said:", text)
        return text
    except:
        print("Could not understand")
        return ""

while True:
    print("\n1. Text")
    print("2. Voice")
    print("3. Exit")

    choice = input("Choose: ")

    if choice == "1":
        text = input("Enter text: ")
        print("Result:", predict(text))

    elif choice == "2":
        text = voice_input()
        if text:
            print("Result:", predict(text))

    elif choice == "3":
        break