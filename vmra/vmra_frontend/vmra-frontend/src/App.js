// Importing necessary libraries
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import GanttChart from './GanttChart';

const App = () => {
  const [vms, setVms] = useState([]);
  const [summary, setSummary] = useState({});
  const [predictions, setPredictions] = useState([]);
  const [simulation, setSimulation] = useState([]);
  const [tasks, setTasks] = useState([]); // For storing tasks for Gantt chart
  const [isScheduling, setIsScheduling] = useState(false); // Track if scheduling is in progress
  const [canRestart, setCanRestart] = useState(false); // Track if restart is allowed

  // Fetch VMs data
  const fetchVms = async () => {
    try {
      const response = await axios.get('http://localhost:5000/vms');
      const vmsWithTasks = response.data.map(vm => ({
        ...vm,
        remainingTasks: vm.remainingTasks || 0 // Ensure remainingTasks is initialized
      }));
      setVms(vmsWithTasks);
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

  // Apply round-robin scheduling and simulate execution
  const scheduleVms = async () => {
    if (simulation.length === 0) {
      alert('No VMs available to schedule tasks.');
      return;
    }

    try {
      setIsScheduling(true); // Disable restart during scheduling
      setCanRestart(false); // Disable restart button
      const response = await axios.post('http://localhost:5000/schedule');
      setSimulation(prevSimulation => prevSimulation.map(vm => ({
        ...vm,
        status: 'Running',
        remainingTasks: vm.remainingTasks || 5 // Ensure remainingTasks is initialized for scheduling
      })));

      let currentTime = new Date().getTime(); // Start time tracking

      const simulateExecution = () => {
        let queueIndex = 0;

        const interval = setInterval(() => {
          if (simulation.length === 0) {
            clearInterval(interval);
            return;
          }

          setSimulation(prevSimulation => {
            const updatedSimulation = [...prevSimulation];

            // Process one VM at a time in round-robin order
            const currentVM = updatedSimulation[queueIndex];
            if (currentVM && currentVM.remainingTasks > 0) { // Check if currentVM is valid
              const startTime = new Date(currentTime);
              currentTime += 1000; // Increment time for the next task
              const endTime = new Date(currentTime);

              currentVM.remainingTasks -= 1;
              currentVM.cpu_usage = Math.max(currentVM.cpu_usage - 2, 0);
              currentVM.memory_usage = Math.max(currentVM.memory_usage - 128, 0);
              currentVM.status = currentVM.remainingTasks === 0 ? 'Completed' : 'Running';

              // Set CPU and memory to 0 when tasks are completed
              if (currentVM.remainingTasks === 0) {
                currentVM.cpu_usage = 0;
                currentVM.memory_usage = 0;
              }

              // Add task to Gantt chart
              const ganttTask = {
                vmId: currentVM.id,
                taskName: `Task ${5 - currentVM.remainingTasks}`,
                startTime,
                endTime,
                color: currentVM.id % 2 === 0 ? 'blue' : 'orange' // Alternate colors for tasks
              };
              setTasks(prevTasks => [...prevTasks, ganttTask]);
            }

            queueIndex = (queueIndex + 1) % updatedSimulation.length;

            return updatedSimulation;
          });

          // Check if all tasks are completed
          const allCompleted = simulation.every(vm => vm.remainingTasks === 0);
          if (allCompleted) {
            clearInterval(interval);

            // Allow restart after scheduling is finished
            setIsScheduling(false);
            setCanRestart(true); // Enable restart button
          }
        }, 1000); // Execute every second
      };

      simulateExecution();
    } catch (error) {
      console.error('Error scheduling VMs:', error);
    }
  };

  // Add a new VM dynamically
  const addVm = () => {
    if ((summary.total_cpu_usage || 0) >= 100) {
      alert('Cannot add more VMs: CPU usage limit reached');
      return;
    }

    setCanRestart(false); // Disable restart button during VM addition

    const newVm = {
      id: vms.length + 1,
      name: `VM${vms.length + 1}`,
      cpu_usage: Math.min(Math.floor(Math.random() * 50), 100 - (summary.total_cpu_usage || 0)),
      memory_usage: Math.floor(Math.random() * 5000),
      status: 'Scheduled',
      remainingTasks: 5 // Ensure new VMs have remainingTasks initialized
    };

    setVms([...vms, newVm]);
    setSimulation([...simulation, newVm]);
    setSummary(prevSummary => ({
      ...prevSummary,
      total_cpu_usage: (prevSummary.total_cpu_usage || 0) + newVm.cpu_usage,
      total_memory_usage: (prevSummary.total_memory_usage || 0) + newVm.memory_usage,
      vm_count: (prevSummary.vm_count || 0) + 1
    }));
  };

  // Restart the process by clearing all data
  const restart = () => {
    setVms([]);
    setSummary({});
    setSimulation([]); // Reset to an empty array
    setTasks([]);
    setCanRestart(false); // Disable restart button after reset
  };

  // Enable the Restart button when all tasks are completed
  useEffect(() => {
    const allCompleted = simulation.length > 0 && simulation.every(vm => vm.status === 'Completed');
    if (allCompleted) {
      setCanRestart(true); // Enable the Restart button
      setIsScheduling(false); // Ensure scheduling is marked as finished
    }
  }, [simulation]);

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
        {simulation.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>CPU Usage</th>
                <th>Memory Usage</th>
                <th>Status</th>
                <th>Remaining Tasks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {simulation.map((vm, index) => (
                vm ? (
                  <tr key={vm.id || index}>
                    <td>{vm.id}</td>
                    <td>{vm.name}</td>
                    <td>{vm.cpu_usage}</td>
                    <td>{vm.memory_usage}</td>
                    <td>{vm.status}</td>
                    <td>{vm.remainingTasks ?? 0}</td>
                    <td>
                      <button
                        onClick={() => allocateResources(vm.id, vm.cpu_usage + 10, vm.memory_usage + 512)}
                        disabled={vm.status === 'Completed'}
                      >
                        Allocate Resources
                      </button>
                    </td>
                  </tr>
                ) : null
              ))}
            </tbody>
          </table>
        ) : (
          <p>No VMs available. Please add VMs to start scheduling.</p>
        )}
        <button onClick={addVm} disabled={summary.total_cpu_usage >= 100 || isScheduling}>
          Add VM
        </button>
        <button onClick={restart} disabled={!canRestart}>
          Restart
        </button>
      </div>

      <div className="gantt">
        <h2>Task Gantt Chart</h2>
        <GanttChart tasks={tasks} />
      </div>

      <div className="actions">
        <button onClick={scheduleVms} disabled={isScheduling || !simulation.length}>
          Apply Round-Robin Scheduling
        </button>
      </div>
    </div>
  );
};

export default App;
