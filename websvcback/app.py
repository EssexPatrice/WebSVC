from flask import Flask, jsonify, request
import pandas as pd
from flask_cors import CORS
import subprocess
import requests
import json

app = Flask(__name__)
CORS(app, supports_credentials=True)

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

            print(active_leases)

            return jsonify(active_leases)
        except requests.exceptions.RequestException as e:
            print(f"Error fetching data: {e}")
            return jsonify(f"Error fetching data: {e}")
    else:
        return jsonify(f"Error fetching data: {e}")

@app.route('/run_vnc', methods=['POST'])
def run_vnc():
    data = request.get_json()
    command = data.get('command')
    try:
        # Execute the VNC command
        subprocess.run(command, shell=True)
        return jsonify({'status': 'success', 'message': 'Command executed successfully'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)

# This function will return site info based on the site ID
@app.route("/get_orion_data", methods=["POST"])
def get_orion_data():
    try:
        site_id = request.json.get("siteId")
        if not site_id:
            return jsonify({"error": "Site ID is required"}), 400

        data = load_data()  # Assuming load_data() loads 'AllSites.csv'
        site_info = data[data['SiteID'] == site_id]

        if site_info.empty:
            return jsonify({"error": "Site not found"}), 404

        orion_value = site_info['Orion'].values[0]  # Get the Orion value ('at' or 'mi')
        
        return jsonify({
            "siteId": site_id,
            "orionValue": orion_value
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/reboot_terminal_browser', methods=['POST'])
def reboot_terminal_browser():
    data = request.get_json()
    action = data.get('Action')
    print(action)
    
    return action

if __name__ == '__main__':
    app.run(debug=True)