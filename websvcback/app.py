from flask import Flask, jsonify, request
import pandas as pd
# import requests
from flask_cors import CORS
import subprocess
import requests
import json

app = Flask(__name__)
CORS(app)

data = {}
# Load the CSV file into a pandas DataFrame with 'Site' as string to preserve leading zeros
csv_file_path = './data/AllSites.csv'
df = pd.read_csv(csv_file_path, dtype={'Site': str})
df['Terminal'] = df['Terminal'].fillna('').astype(str)
json_data = df.to_json(orient='records')

def fetch_leases(url):
    response = requests.post(url)
    response.raise_for_status()
    print(response.text)  # Check for request errors

    return response.text

def extract_active_leases(data):
    lines = data.split('\n')
        
    active_lease_section = False
    active_leases = []

    for line in lines:
        if "Active leases" in line or "----------------------------------" in line:
            active_lease_section = True
            continue
        if active_lease_section:
            if "Inactive or non-responsive leases" in line:
                break
            if line.strip():  # Skip empty lines
                elements = line.split('\t')
                ip_address = elements[2]
                mac_address = elements[1]
                terminal = elements[3]

                active_leases.append({'MAC': mac_address, 'Terminal': terminal, 'IP': ip_address})

    return json.dumps(active_leases, indent=4)


@app.route('/')
def home():
    print(json_data)
    return json_data

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
    ip_address = None

    data = request.get_json()
    siteID = data.get('siteId')
    for index, row in df.iterrows():
        if row['Site'] == siteID:
            ip_address = row['NSD']
            break
    if ip_address:
        nds =f"http://{ip_address}/dnsmasq.leases"
        subprocess.Popen(['start', 'msedge', nds], shell=True)

        try:
            data = fetch_leases(nds)
            active_leases = extract_active_leases(data)
            return jsonify(active_leases)
        except requests.exceptions.RequestException as e:
            print(f"Error fetching data: {e}")
            return jsonify(f"Error fetching data: {e}")
    else:
        return jsonify(f"Error fetching data: {e}")


@app.route('/reboot_terminal_browser', methods=['POST'])
def reboot_terminal_browser():
    data = request.get_json()
    action = data.get('Action')
    print(action)
    
    return action

    # data = request.get_json()
    # print(f"Received data from frontend: {data}")  # Check the received site_id
    
    # site_id = data.get('site_id')
    # if not site_id:
    #     print("Error: Site ID not provided")
    #     return jsonify({"error": "Site ID not provided"}), 400

    # # Simulate the process of fetching IP/MAC
    # print(f"Fetching IP/MAC for site ID: {site_id}")
    # # Add logic to fetch the IP/MAC data
    # # Example:
    # ip_mac_data = {"ip": "192.168.1.10", "mac": "00:1A:2B:3C:4D:5E"}  # Dummy data

    # print(f"IP/MAC Data: {ip_mac_data}")
    

# def extract_active_leases(leases_data):
#     leases = []
#     for line in leases_data.splitlines():
#         parts = line.split()
#         if len(parts) >= 3:
#             mac_address = parts[1]
#             terminal_id = parts[2]
#             leases.append({'MAC': mac_address, 'Terminal': terminal_id})
#     return leases

# def match_leases_with_terminals(leases, site_id):
#     matched = []
#     terminals_in_site = df[df['Site'] == site_id]['Terminal'].values
    
#     for lease in leases:
#         if lease['Terminal'] in terminals_in_site:
#             matched.append(lease)
    
#     return matched

if __name__ == '__main__':
    app.run(debug=True)