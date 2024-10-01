import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tableData, setTableData] = useState([]);
  const [newRow, setNewRow] = useState({
    Include: '',
    Unit: '',
    Terminal: '',
    VNC: '',
    IP: '',
    MAC: '',
    Switch: '',
    Port: '',
    Power: '',
    Orion: '',
    Zabbix: ''
  });

  useEffect(() => {
    // Fetch table data from the backend API
    axios.get('/api/data')
      .then(response => {
        setTableData(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the data!', error);
      });
  }, []);

  const handleInputChange = (e) => {
    setNewRow({ ...newRow, [e.target.name]: e.target.value });
  };

  const addRow = () => {
    axios.post('/api/data', newRow)
      .then(response => {
        setTableData([...tableData, newRow]);
        setNewRow({
          Include: '',
          Unit: '',
          Terminal: '',
          VNC: '',
          IP: '',
          MAC: '',
          Switch: '',
          Port: '',
          Power: '',
          Orion: '',
          Zabbix: ''
        });
      })
      .catch(error => {
        console.error('There was an error adding the row!', error);
      });
  };

  const deleteRow = (index) => {
    axios.delete(`/api/data/${index}`)
      .then(response => {
        setTableData(tableData.filter((row, i) => i !== index));
      })
      .catch(error => {
        console.error('There was an error deleting the row!', error);
      });
  };

  return (
    <div className="App">
      <h1>Table Dashboard</h1>
      <table>
        <thead>
          <tr>
            <th>Include</th>
            <th>Unit</th>
            <th>Terminal</th>
            <th>VNC</th>
            <th>IP</th>
            <th>MAC</th>
            <th>Switch</th>
            <th>Port</th>
            <th>Power</th>
            <th>Orion</th>
            <th>Zabbix</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, index) => (
            <tr key={index}>
              <td>{row.Include}</td>
              <td>{row.Unit}</td>
              <td>{row.Terminal}</td>
              <td>{row.VNC}</td>
              <td>{row.IP}</td>
              <td>{row.MAC}</td>
              <td>{row.Switch}</td>
              <td>{row.Port}</td>
              <td>{row.Power}</td>
              <td>{row.Orion}</td>
              <td>{row.Zabbix}</td>
              <td>
                <button onClick={() => deleteRow(index)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Add New Row</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        {Object.keys(newRow).map((key) => (
          <div key={key}>
            <label>{key}: </label>
            <input
              type="text"
              name={key}
              value={newRow[key]}
              onChange={handleInputChange}
            />
          </div>
        ))}
        <button onClick={addRow}>Add Row</button>
      </form>
    </div>
  );
}

export default App;