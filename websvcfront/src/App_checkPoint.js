import React, { useState, useEffect } from "react";
import axios from "axios";
import { CopyToClipboard } from "react-copy-to-clipboard"; // Add this import
import "./App.css";

function App() {
  const [tableData, setTableData] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "none",
  });
  const [lastChecked, setLastChecked] = useState(null);
  const [action, setAction] = useState("Select action");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedRows, setSelectedRows] = useState([]); // Add this state for selected rows
  const [clipboardData, setClipboardData] = useState(""); // Clipboard data state
  const [isCopyEnabled, setIsCopyEnabled] = useState(false); // Handle when to enable copying
  const [originalTableData, setOriginalTableData] = useState([]); // Store the original data

  useEffect(() => {
    // Data will only be fetched when a search is performed
  }, []);

  const fetchData = async () => {
    try {
      const result = await axios.get('your-data-fetch-url');
      setTableData(result.data);  // Set the table data
      setOriginalTableData(result.data);  // Also store the original data
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const sortTable = (column) => {
    let direction = "ascending";
  
    // If the column is the same and the direction is ascending, set to descending
    if (sortConfig.key === column && sortConfig.direction === "ascending") {
      direction = "descending";
    }
  
    // If it's clicked twice (descending) or three times (back to default state), clear sorting
    if (sortConfig.key === column && sortConfig.direction === "descending") {
      setSortConfig({ key: column, direction: "none" }); // third click resets the background only
      return; // Stop sorting, keep the current data
    }
  
    // Continue sorting logic otherwise
    setSortConfig({ key: column, direction: direction });
  
    const sortedData = [...tableData].sort((a, b) => {
      if (a[column] < b[column]) {
        return direction === "ascending" ? -1 : 1;
      }
      if (a[column] > b[column]) {
        return direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
  
    setTableData(sortedData);
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

    const selected = newTableData.filter((row) => row.Include); // Update selected rows
    setSelectedRows(selected);
    setIsCopyEnabled(selected.length > 0); // Enable "Copy to clipboard" only if at least one row is selected
  };

  const formatClipboardData = () => {
    return selectedRows
      .map((row) => {
        return `${selectedSiteId}\n${row.Unit}\n${row.Terminal}\n${row.IP}\n${row.MAC}\n-------------------`;
      })
      .join("\n");
  };

  const handleSearch = () => {
    if (searchTerm) {
      console.log(`Searching for: ${searchTerm}`);
      fetch(`http://127.0.0.1:5000/search?query=${searchTerm}`)
        .then((response) => response.json())
        .then((data) => {
          console.log("Search result:", data);
          setTableData(data); // Populate the table with the result
          setSelectedSiteId(searchTerm); // Save the site ID for further actions
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    } else {
      console.log("Search term is empty");
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearch(); // Trigger search when Enter key is pressed
    }
  };

  const get_ip_mac = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/get_ip_mac", {
        siteId: selectedSiteId,
      });

      let data = response.data;
      console.log("Received data:", data); // Check the structure
      console.log("Type of data:", typeof data); // Check the exact type

      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
          console.log("Parsed data:", data);
        } catch (e) {
          console.error("Error parsing JSON:", e);
        }
      }

      if (Array.isArray(data)) {
        setTableData((prevData) => {
          return prevData.map((row) => {
            const leaseData = data.find((d) => d.Terminal === row.Terminal);
            if (leaseData) {
              return { ...row, IP: leaseData.IP, MAC: leaseData.MAC };
            }
            return row;
          });
        });
      } else {
        console.error("Data is not an array:", data);
      }
    } catch (error) {
      console.error("Error fetching IP/MAC:", error);
    }
  };

  const handleAppAdminGoClick = (ip) => {
    const url = `http://${ip}/`;
    window.open(url, "_blank");
  };

  const handleVNCGoClick = (ip) => {
    const vncCommand = `"C:\\Program Files\\TightVNC\\tvnviewer.exe" -host=${ip} -password=S3cur3tech0624`;
    console.log("Running VNC command:", vncCommand);
    axios
      .post("http://127.0.0.1:5000/run_vnc", { command: vncCommand })
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.error("Error executing VNC command:", error);
      });
  }; 

  const handleSubmit = () => {
    if (action === "Select action") {
      alert("Please select an action");
    } else if (action === "Get IP + MAC") {
      get_ip_mac();
    } else if (action === "Reboot Browser" || action === "Reboot Terminal") {
      reboot_terminal_browser();
    } else if (action === "Copy to clipboard") {
      const clipboardData = formatClipboardData();  // Generate the clipboard data
      navigator.clipboard.writeText(clipboardData).then(
        () => {
          alert("Data copied to clipboard!");
        },
        (err) => {
          console.error("Failed to copy to clipboard", err);
        }
      );
    } else {
      alert(`Action: ${action}`);
    }
  }; 

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    } else if (sortConfig.key === key && sortConfig.direction === "descending") {
      direction = "default";
    }
  
    setSortConfig({ key, direction });
  
    if (direction === "default") {
      setTableData(originalTableData); // Reset to original data if default
    } else {
      const sortedData = [...tableData].sort((a, b) => {
        if (a[key] < b[key]) {
          return direction === "ascending" ? -1 : 1;
        }
        if (a[key] > b[key]) {
          return direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
      setTableData(sortedData);
    }
  };
  
  const reboot_terminal_browser = () => {
    console.log("Rebooting terminal/browser");
    // Add your logic for rebooting the terminal or browser here
  };

  const handleZabbixGoClick = (terminal) => {
    const zabbixUrl = `http://10.36.133.173/zabbix/zabbix.php?action=search&search=${terminal}`;
    window.open(zabbixUrl, "_blank");
  };

  return (
    <div className="App night-mode">
      <div className="search-container">
        <input
          type="text"
          className="search-box"
          placeholder="Search Site."
          value={searchTerm || ""}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <div className="right-container">
          <select
            className="action-dropdown"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            style={{ width: "130%" }}
          >
            <option>Select action</option>
            <option>Get IP + MAC</option>
            <option>Get Orion</option>
            <option>Reboot Browser</option>
            <option>Reboot Terminal</option>
            <option disabled={!isCopyEnabled}>Copy to clipboard</option>
          </select>

          <CopyToClipboard text={clipboardData}>
            <button className="submit-button" onClick={handleSubmit}>
              Submit
            </button>
          </CopyToClipboard>
        </div>
      </div>

      <table>
      <thead>
            <tr>
              <th>Include</th>
              <th
                style={{
                  backgroundColor:
                    sortConfig.key === "Unit" && sortConfig.direction !== "none"
                      ? sortConfig.direction === "ascending"
                        ? "rgba(135, 206, 250, 0.5)" // Light background for ascending
                        : "rgba(173, 216, 230, 0.5)" // Light background for descending
                      : "rgb(51, 51, 51)", // No background for default
                }}
                onClick={() => sortTable("Unit")}
              >
                Unit
              </th>
              <th
                style={{
                  backgroundColor:
                    sortConfig.key === "Terminal" && sortConfig.direction !== "none"
                      ? sortConfig.direction === "ascending"
                        ? "rgba(135, 206, 250, 0.5)"
                        : "rgba(173, 216, 230, 0.5)"
                      : "rgb(51, 51, 51)",
                }}
                onClick={() => sortTable("Terminal")}
              >
                Terminal
              </th>
              <th>VNC</th>
              <th>App Admin</th>
              <th
                style={{
                  backgroundColor:
                    sortConfig.key === "IP" && sortConfig.direction !== "none"
                      ? sortConfig.direction === "ascending"
                        ? "rgba(135, 206, 250, 0.5)"
                        : "rgba(173, 216, 230, 0.5)"
                      : "rgb(51, 51, 51)",
                }}
                onClick={() => sortTable("IP")}
              >
                IP
              </th>
              <th>MAC</th>
              <th
                style={{
                  backgroundColor:
                    sortConfig.key === "Switch" && sortConfig.direction !== "none"
                      ? sortConfig.direction === "ascending"
                        ? "rgba(135, 206, 250, 0.5)"
                        : "rgba(173, 216, 230, 0.5)"
                      : "rgb(51, 51, 51)",
                }}
                onClick={() => sortTable("Switch")}
              >
                Switch
              </th>
              <th>Port</th>
              <th
                style={{
                  backgroundColor:
                    sortConfig.key === "Power" && sortConfig.direction !== "none"
                      ? sortConfig.direction === "ascending"
                        ? "rgba(135, 206, 250, 0.5)"
                        : "rgba(173, 216, 230, 0.5)"
                      : "rgb(51, 51, 51)",
                }}
                onClick={() => sortTable("Power")}
              >
                Power
              </th>
              <th>Orion</th>
              <th>Zabbix</th>
            </tr>
          </thead>
        <tbody>
          {tableData.map((row, index) => (
            <tr key={index} style={{ backgroundColor: row.Include ? "green" : "#424242" }}>
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
                {row.IP && <button onClick={() => handleVNCGoClick(row.IP)}>Go</button>}
              </td>
              <td>
                {row.IP && <button onClick={() => handleAppAdminGoClick(row.IP)}>Go</button>}
              </td>
              <td>{row.IP}</td>
              <td>{row.MAC}</td>
              <td>{row.Switch}</td>
              <td>{row.Port}</td>
              <td>{row.Power}</td>
              <td> {/* Orion column - currently empty or future Orion functionality */} </td>
              <td>
                <button onClick={() => handleZabbixGoClick(row.Terminal)}>Go</button>
              </td> {/* Zabbix column */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
