import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [tableData, setTableData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'none' });
  const [lastChecked, setLastChecked] = useState(null);
  const [action, setAction] = useState('Select action');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');

  // Utility function to generate random power values between 10.0W and 15.0W
  const getRandomPower = () => (Math.random() * (15 - 10) + 10).toFixed(1) + 'W';

  // Utility function to generate random terminal numbers between T1000 and T2200
  const getRandomTerminal = () => 'T' + (Math.floor(Math.random() * (2200 - 1000 + 1)) + 1000);

  // Utility function to get random units
  const units = ["120A", "120B", "60B", "80U", "80L", "240A", "240B", "240C", "240D"];
  const getRandomUnit = () => units[Math.floor(Math.random() * units.length)];

  // Generate random table data on component mount
  useEffect(() => {
    generateData();
  }, []);

  const generateData = () => {
    let data = [];
    for (let i = 0; i < 15; i++) {
      data.push({
        Include: false,
        Unit: getRandomUnit(),
        Terminal: getRandomTerminal(),
        VNC: "Go",
        AppAdmin: "Go",
        IP: `192.168.1.${i + 1}`,
        MAC: `XX:XX:XX:XX:XX:${String(i + 1).padStart(2, '0')}`,
        Switch: `S${i + 1}`,
        Port: `P${i + 1}`,
        Power: getRandomPower(),
        Orion: "Go",
        Zabbix: "Go"
      });
    }
    setTableData(data);
  };

  const sortTable = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'none';
    }

    if (direction !== 'none') {
      const sortedData = [...tableData].sort((a, b) => {
        if (key === 'Power') {
          const aValue = parseFloat(a[key]);
          const bValue = parseFloat(b[key]);
          return direction === 'ascending' ? aValue - bValue : bValue - aValue;
        } else {
          return direction === 'ascending'
            ? a[key].localeCompare(b[key])
            : b[key].localeCompare(a[key]);
        }
      });
      setTableData(sortedData);
    }

    setSortConfig({ key, direction });
  };

  const handleCheckboxChange = (index, event) => {
    const newTableData = [...tableData];
    if (event.shiftKey && lastChecked !== null) {
      const start = Math.min(lastChecked, index);
      const end = Math.max(lastChecked, index);
      const newValue = tableData[lastChecked].Include;
      for (let i = start; i <= end; i++) {
        newTableData[i].Include = newValue;
      }
    } else {
      newTableData[index].Include = !newTableData[index].Include;
      setLastChecked(index);
    }
    setTableData(newTableData);
  };

  const handleSearch = () => {
    if (searchTerm) {
      console.log(`Searching for: ${searchTerm}`);
      fetch(`http://127.0.0.1:5000/search?query=${searchTerm}`)
        .then(response => response.json())
        .then(data => {
          console.log("Search result:", data); // Log the result from the backend
          setTableData(data);  // Populate the table with the result
          setSelectedSiteId(searchTerm);  // Save the site ID for further actions
        })
        .catch(error => {
          console.error('Error fetching data:', error);
        });
    } else {
      console.log("Search term is empty");
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();  // Trigger search when Enter key is pressed
    }
  };

  const handleSubmit = () => {
    if (action === 'Select action') {
      alert('Please select an action');
    } else if (action === 'Get IP + MAC') {
      const selectedSiteId = searchTerm;

      fetch('http://127.0.0.1:5000/get_ip_mac', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ site_id: selectedSiteId }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            alert(data.error);
          } else {
            console.log('Active IP/MAC Leases:', data);  // This should print the IP/MAC data

            // Ensure you're displaying this data in the table
            setTableData(prevData => {
              // Assume 'Terminal' is in both the data and tableData
              return prevData.map(row => {
                if (row.Terminal === selectedSiteId) {
                  return { ...row, IP: data.ip, MAC: data.mac };  // Update the matching row
                }
                return row;
              });
            });
          }
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    } else {
      alert(`Action: ${action}`);
    }
  };

  return (
    <div className="App night-mode">
      <div className="search-container">
        <input
          type="text"
          className="search-box"
          placeholder="Search Site..."
          value={searchTerm || ''}  // Ensure it never becomes undefined
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}  // Detect Enter key
        />
        <div className="right-container">
          <select className="action-dropdown" value={action} onChange={(e) => setAction(e.target.value)} style={{ width: '130%' }}>
            <option>Select action</option>
            <option>Reboot Browser</option>
            <option>Reboot Terminal</option>
            <option>Get IP + MAC</option>
          </select>
          <button className="submit-button" onClick={handleSubmit}>Submit</button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Include</th>
            <th
              style={{ color: sortConfig.key === 'Unit' && sortConfig.direction !== 'none' ? (sortConfig.direction === 'ascending' ? 'blue' : 'purple') : '' }}
              onClick={() => sortTable('Unit')}
            >
              Unit
            </th>
            <th
              style={{ color: sortConfig.key === 'Terminal' && sortConfig.direction !== 'none' ? (sortConfig.direction === 'ascending' ? 'blue' : 'purple') : '' }}
              onClick={() => sortTable('Terminal')}
            >
              Terminal
            </th>
            <th>VNC</th>
            <th>App Admin</th>
            <th
              style={{ color: sortConfig.key === 'IP' && sortConfig.direction !== 'none' ? (sortConfig.direction === 'ascending' ? 'blue' : 'purple') : '' }}
              onClick={() => sortTable('IP')}
            >
              IP
            </th>
            <th>MAC</th>
            <th
              style={{
                color: sortConfig.key === 'Switch' && sortConfig.direction !== 'none' ? (sortConfig.direction === 'ascending' ? 'blue' : 'purple') : ''
              }}
              onClick={() => sortTable('Switch')}
            >
              Switch
            </th>
            <th>Port</th>
            <th
              style={{ color: sortConfig.key === 'Power' && sortConfig.direction !== 'none' ? (sortConfig.direction === 'ascending' ? 'blue' : 'purple') : '' }}
              onClick={() => sortTable('Power')}
            >
              Power
            </th>
            <th>Orion</th>
            <th>Zabbix</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, index) => (
            <tr key={index} style={{ backgroundColor: row.Include ? 'green' : '#424242' }}>
              <td>
                <input
                  type="checkbox"
                  checked={row.Include}
                  onChange={(e) => handleCheckboxChange(index, e)}
                  style={{
                    transform: "scale(1.5)",
                    backgroundColor: row.Include ? "green" : "#424242",
                    color: row.Include ? "white" : "#f0f0f0",
                  }}
                />
              </td>
              <td>{row.Unit}</td>
              <td>{row.Terminal}</td>
              <td>
                <button onClick={() => alert(`VNC Go button clicked for row ${index + 1}`)}>Go</button>
              </td>
              <td>
                <button onClick={() => alert(`App Admin Go button clicked for row ${index + 1}`)}>Go</button>
              </td>
              <td>{row.IP}</td>
              <td>{row.MAC}</td>
              <td>{row.Switch}</td>
              <td>{row.Port}</td>
              <td>{row.Power}</td>
              <td>
                <button onClick={() => alert(`Orion Go button clicked for row ${index + 1}`)}>Go</button>
              </td>
              <td>
                <button onClick={() => alert(`Zabbix Go button clicked for row ${index + 1}`)}>Go</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div >
  );
}

export default App;