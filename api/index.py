from flask import Flask, jsonify, request
from flask_cors import CORS

# App instance
app = Flask(__name__)
CORS(app)

# Setting up endpoint
@app.route("/api/home", methods=["POST"])
def return_home():
    data = request.get_json()
    input = data.get("userInput") # defined in your useState
    word_count = len(input.split(" "))
    
    return jsonify({
        "user_input": f"Your input: {input}",
        "word_length": f"Input with length {word_count} received!",
    })

if __name__ == "__main__":
    app.run(debug=True, port=8000)

