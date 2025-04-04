
// Importing necessary libraries
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [vms, setVms] = useState([]);
  const [summary, setSummary] = useState({});
  const [predictions, setPredictions] = useState([]);

  // Fetch VMs data
  const fetchVms = async () => {
    try {
      const response = await axios.get('http://localhost:5000/vms');
      setVms(response.data);
    } catch (error) {
      console.error('Error fetching VMs:', error);
    }
  };

  // Fetch summary data
  const fetchSummary = async () => {
    try {
      const response = await axios.get('http://localhost:5000/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  // Fetch predictions
  const fetchPredictions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/predict');
      setPredictions(response.data);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  // Allocate resources to a VM
  const allocateResources = async (vmId, cpu, memory) => {
    try {
      await axios.post('http://localhost:5000/allocate', {
        vm_id: vmId,
        cpu: cpu,
        memory: memory,
      });
      fetchVms();
    } catch (error) {
      console.error('Error allocating resources:', error);
    }
  };

  // Apply round-robin scheduling
  const scheduleVms = async () => {
    try {
      await axios.post('http://localhost:5000/schedule');
      fetchVms();
    } catch (error) {
      console.error('Error scheduling VMs:', error);
    }
  };

  useEffect(() => {
    fetchVms();
    fetchSummary();
    fetchPredictions();
  }, []);

  return (
    <div className="App">
      <h1>Virtual Machine Resource Allocator</h1>
      <div className="summary">
        <h2>Summary</h2>
        <p>Total CPU Usage: {summary.total_cpu_usage}</p>
        <p>Total Memory Usage: {summary.total_memory_usage}</p>
        <p>VM Count: {summary.vm_count}</p>
      </div>

      <div className="vms">
        <h2>Virtual Machines</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>CPU Usage</th>
              <th>Memory Usage</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vms.map((vm) => (
              <tr key={vm.id}>
                <td>{vm.id}</td>
                <td>{vm.name}</td>
                <td>{vm.cpu_usage}</td>
                <td>{vm.memory_usage}</td>
                <td>{vm.status}</td>
                <td>
                  <button
                    onClick={() => allocateResources(vm.id, vm.cpu_usage + 10, vm.memory_usage + 512)}
                  >
                    Allocate Resources
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="predictions">
        <h2>Predictions</h2>
        <table>
          <thead>
            <tr>
              <th>VM ID</th>
              <th>Predicted CPU</th>
              <th>Predicted Memory</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((prediction) => (
              <tr key={prediction.vm_id}>
                <td>{prediction.vm_id}</td>
                <td>{prediction.predicted_cpu}</td>
                <td>{prediction.predicted_memory}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="actions">
        <button onClick={scheduleVms}>Apply Round-Robin Scheduling</button>
      </div>
    </div>
  );
};

export default App;
