from flask import Flask, jsonify, request
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load the CSV file into a pandas DataFrame with 'Site' as string to preserve leading zeros
csv_file_path = './data/AllSites.csv'
df = pd.read_csv(csv_file_path, dtype={'Site': str})

@app.route('/')
def home():
    return "Flask API is running! Visit /search?query= to fetch data."

# Search endpoint
@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('query')

    # Convert query to string to ensure correct filtering
    query = str(query)

    # Log the query for debugging purposes
    print(f"Received query: {query}")

    # Ensure 'Terminal' is a string and handle missing values
    df['Terminal'] = df['Terminal'].fillna('').astype(str)

    # Filter DataFrame by 'Site' or 'Terminal' (case-insensitive for Terminal)
    filtered_df = df[(df['Site'] == query) | (df['Terminal'].str.lower() == query.lower())]

    # Log the filtered DataFrame for debugging purposes
    print(f"Filtered data:\n{filtered_df}")

    # Convert to dictionary and return as JSON
    results = filtered_df.to_dict(orient='records')
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)