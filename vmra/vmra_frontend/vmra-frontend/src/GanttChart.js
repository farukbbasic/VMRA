// Importing necessary libraries
import React from 'react';
import './GanttChart.css'; // Add styles for the Gantt chart

const GanttChart = ({ tasks }) => {
  const startTime = Math.min(...tasks.map(task => new Date(task.startTime).getTime()));
  const endTime = Math.max(...tasks.map(task => new Date(task.endTime).getTime()));
  const totalDuration = endTime - startTime;

  // Predefined color list
  const colors = [
    "#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#33FFF3", "#A133FF", 
    "#FFC733", "#33FF8A", "#FF3333", "#33A1FF", "#8AFF33", "#FF8A33", 
    "#8A33FF"-, "#33FFC7", "#FF338A", "#A1FF33", "#5733FF", "#FFA133", 
    "#33FFA1", "#4CAF50"
  ];

  // Create a map for VM ID to color
  const vmColorMap = {};
  let colorIndex = 0;

  tasks.forEach(task => {
    if (!vmColorMap[task.vmId]) {
      vmColorMap[task.vmId] = colors[colorIndex % colors.length];
      colorIndex++;
    }
  });

  // Function to get color for a VM
  const getVmColor = (vmId) => vmColorMap[vmId];

  // Get unique VMs from tasks
  const uniqueVms = [...new Set(tasks.map(task => task.vmId))];

  return (
    <div className="gantt-chart">
      <div className="gantt-header">
        <h3>Gantt Chart</h3>
      </div>

      {/* Display VM Names with their colors */}
      <div className="gantt-legend">
        {uniqueVms.map(vmId => (
          <div key={vmId} className="gantt-legend-item">
            <div
              className="gantt-legend-color"
              style={{
                backgroundColor: getVmColor(vmId),
                width: '20px',
                height: '20px',
                display: 'inline-block',
                marginRight: '8px',
                borderRadius: '50%'
              }}
            ></div>
            <span>VM {vmId}</span>
          </div>
        ))}
      </div>

      <div className="gantt-container">
        {tasks.map((task, index) => {
          const taskStart = new Date(task.startTime).getTime();
          const taskEnd = new Date(task.endTime).getTime();
          const leftPosition = ((taskStart - startTime) / totalDuration) * 100;
          const width = ((taskEnd - taskStart) / totalDuration) * 100;

          return (
            <div key={index} className="gantt-row">
              <span className="task-label">{task.taskName} (VM{task.vmId})</span>
              <div
                className="gantt-bar"
                style={{
                  left: `${leftPosition}%`,
                  width: `${width}%`,
                  backgroundColor: getVmColor(task.vmId),
                }}
              ></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GanttChart;
