from flask import Flask, render_template, request, jsonify
import requests
import json
import os
from datetime import datetime

app = Flask(__name__)
history_path = "history/conversation_history.json"

# ✅ Replace with your actual OpenRouter API key (you've already added it correctly)
API_KEY = "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"
API_URL = "https://openrouter.ai/api/v1/chat/completions"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

@app.route("/")
def index():
    return render_template("index.html")

# ✅ Detect emotions from response
def detect_emotion(response):
    response_lower = response.lower()
    if any(word in response_lower for word in ["sad", "sorry", "depressed", "alone", "tired", "hopeless"]):
        return "😔"
    elif any(word in response_lower for word in ["happy", "great", "awesome", "joy", "excited", "grateful"]):
        return "😊"
    elif any(word in response_lower for word in ["angry", "mad", "furious", "annoyed", "upset"]):
        return "😠"
    elif any(word in response_lower for word in ["confused", "lost", "stuck"]):
        return "😕"
    elif any(word in response_lower for word in ["love", "caring", "support", "understand"]):
        return "❤️"
    else:
        return "🙂"

# ✅ Main chatbot route
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_input = data.get("message", "")
    
    try:
        # ✅ Request to OpenRouter with compatible free model
        response = requests.post(
            API_URL,
            headers=HEADERS,
            json={
                "model": "mistralai/mistral-7b-instruct",  # ✅ Free & supported on OpenRouter
                "messages": [
                    {
                        "role": "system",
                        "content": "You are FeelBot, a caring and kind mental health assistant. Always reply with empathy and calmness."
                    },
                    {
                        "role": "user",
                        "content": user_input
                    }
                ]
            }
        )

        output = response.json()
        print("🟢 API Response:", json.dumps(output, indent=2))

        if "choices" in output:
            bot_response = output["choices"][0]["message"]["content"].strip()
        else:
            raise ValueError("No choices returned from the API.")

        emoji = detect_emotion(bot_response)
        final_response = bot_response + " " + emoji

    except Exception as e:
        print("❌ Error during API call:", e)
        final_response = "😭 Sorry, I’m still having trouble replying. Please try again soon."

    save_to_history(user_input, final_response)
    return jsonify({"response": final_response})

# ✅ Save chat to local JSON file
def save_to_history(user, bot):
    if not os.path.exists("history"):
        os.makedirs("history")
    history = []
    if os.path.exists(history_path):
        with open(history_path, "r") as f:
            history = json.load(f)
    history.append({
        "timestamp": datetime.now().isoformat(),
        "user": user,
        "bot": bot
    })
    with open(history_path, "w") as f:
        json.dump(history, f, indent=4)

# ✅ Run the Flask server
if __name__ == "__main__":
    app.run(debug=True)