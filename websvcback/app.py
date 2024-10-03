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
    
    # Filter DataFrame by 'Site' or 'Terminal'
    filtered_df = df[(df['Site'] == query) | (df['Terminal'] == query)]

    # Convert to dictionary and return as JSON
    results = filtered_df.to_dict(orient='records')
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)