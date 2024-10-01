from flask import Flask, jsonify, request
from flask_cors import CORS  # Import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Sample data
data = [
    {'Include': 'Yes', 'Unit': 'Unit 1', 'Terminal': 'T1', 'VNC': 'Go', 'IP': '192.168.1.1', 'MAC': 'XX:XX:XX:XX:XX:01', 'Switch': 'S1', 'Port': 'P1', 'Power': 'On', 'Orion': 'View', 'Zabbix': 'View'},
    {'Include': 'No', 'Unit': 'Unit 2', 'Terminal': 'T2', 'VNC': 'Go', 'IP': '192.168.1.2', 'MAC': 'XX:XX:XX:XX:XX:02', 'Switch': 'S2', 'Port': 'P2', 'Power': 'Off', 'Orion': 'View', 'Zabbix': 'View'}
]

# Root route to avoid "Not Found"
@app.route('/')
def index():
    return 'Flask API is running! Visit /api/data to get table data.'

# API to get table data
@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify(data)

# API to add a new row
@app.route('/api/data', methods=['POST'])
def add_row():
    new_row = request.json
    data.append(new_row)
    return jsonify({'message': 'Row added successfully'}), 201

# API to delete a row
@app.route('/api/data/<int:index>', methods=['DELETE'])
def delete_row(index):
    if 0 <= index < len(data):
        del data[index]
        return jsonify({'message': 'Row deleted successfully'}), 200
    else:
        return jsonify({'error': 'Row not found'}), 404

# API to update a row
@app.route('/api/data/<int:index>', methods=['PUT'])
def update_row(index):
    updated_row = request.json
    if 0 <= index < len(data):
        data[index] = updated_row
        return jsonify({'message': 'Row updated successfully'}), 200
    else:
        return jsonify({'error': 'Row not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)