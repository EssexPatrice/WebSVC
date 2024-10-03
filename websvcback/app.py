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
    site_id = data.get('site_id')
    
    # Find the NSD IP address for the given site
    nsd_ip = df.loc[df['Site'] == site_id, 'NSD'].values
    if len(nsd_ip) == 0:
        return jsonify({'error': 'Site not found or NSD missing'}), 404
    
    nsd_url = f'http://{nsd_ip[0]}/dnsmasq.leases'
    
    try:
        response = requests.get(nsd_url)
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch leases'}), 500

        leases_data = response.text
        # Simulate extracting active leases and matching them with Terminal IDs
        active_leases = extract_active_leases(leases_data)
        
        # Filter active leases by Terminal ID matching
        matched_leases = match_leases_with_terminals(active_leases, site_id)
        
        return jsonify(matched_leases)
        
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Error fetching data: {str(e)}'}), 500

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