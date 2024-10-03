from flask import Flask, jsonify, request
import pandas as pd
import requests
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

    query = str(query)

    df['Terminal'] = df['Terminal'].fillna('').astype(str)

    filtered_df = df[(df['Site'] == query) | (df['Terminal'].str.lower() == query.lower())]

    results = filtered_df.to_dict(orient='records')
    return jsonify(results)

# New route to handle fetching IP and MAC information
@app.route('/get_ip_mac', methods=['POST'])
def get_ip_mac():
    data = request.get_json()
    print(f"Received data from frontend: {data}")  # Check the received site_id
    
    site_id = data.get('site_id')
    if not site_id:
        print("Error: Site ID not provided")
        return jsonify({"error": "Site ID not provided"}), 400

    # Simulate the process of fetching IP/MAC
    print(f"Fetching IP/MAC for site ID: {site_id}")
    # Add logic to fetch the IP/MAC data
    # Example:
    ip_mac_data = {"ip": "192.168.1.10", "mac": "00:1A:2B:3C:4D:5E"}  # Dummy data

    print(f"IP/MAC Data: {ip_mac_data}")
    return jsonify(ip_mac_data)

def extract_active_leases(leases_data):
    leases = []
    for line in leases_data.splitlines():
        parts = line.split()
        if len(parts) >= 3:
            mac_address = parts[1]
            terminal_id = parts[2]
            leases.append({'MAC': mac_address, 'Terminal': terminal_id})
    return leases

def match_leases_with_terminals(leases, site_id):
    matched = []
    terminals_in_site = df[df['Site'] == site_id]['Terminal'].values
    
    for lease in leases:
        if lease['Terminal'] in terminals_in_site:
            matched.append(lease)
    
    return matched

if __name__ == '__main__':
    app.run(debug=True)