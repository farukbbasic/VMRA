from flask import Flask, jsonify, request
import random
from sklearn.linear_model import LinearRegression
import numpy as np
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Start with an empty list of VMs
vms = []

# Simulated historical data for ML workload prediction
historical_data = {}

@app.route('/vms', methods=['GET'])
def get_vms():
    return jsonify(vms)

@app.route('/allocate', methods=['POST'])
def allocate_resources():
    data = request.json
    vm_id = data.get('vm_id')
    cpu_allocation = data.get('cpu')
    memory_allocation = data.get('memory')

    total_cpu = sum(vm['cpu_usage'] for vm in vms)
    for vm in vms:
        if vm['id'] == vm_id:
            # Check if adding this allocation exceeds 100% CPU limit
            if total_cpu - vm['cpu_usage'] + cpu_allocation > 100:
                return jsonify({"error": "Total CPU usage cannot exceed 100%"}), 400

            vm['cpu_usage'] = cpu_allocation
            vm['memory_usage'] = memory_allocation
            return jsonify({"message": "Resources allocated successfully", "vm": vm})

    return jsonify({"error": "VM not found"}), 404

@app.route('/schedule', methods=['POST'])
def schedule_vms():
    time_slice = 5  # Example time slice in seconds
    for vm in vms:
        vm['status'] = "Scheduled"
    return jsonify({"message": "Round-robin scheduling applied", "time_slice": time_slice, "vms": vms})

@app.route('/predict', methods=['GET'])
def predict_workload():
    predictions = []
    for vm in vms:
        vm_name = vm['name']
        if vm_name in historical_data:
            cpu_data = historical_data[vm_name]['cpu']
            memory_data = historical_data[vm_name]['memory']

            # Prepare data for linear regression
            x = np.array(range(len(cpu_data))).reshape(-1, 1)
            y_cpu = np.array(cpu_data).reshape(-1, 1)
            y_memory = np.array(memory_data).reshape(-1, 1)

            cpu_model = LinearRegression().fit(x, y_cpu)
            memory_model = LinearRegression().fit(x, y_memory)

            # Predict next usage
            next_index = len(cpu_data)
            predicted_cpu = cpu_model.predict([[next_index]])[0][0]
            predicted_memory = memory_model.predict([[next_index]])[0][0]

            predictions.append({
                "vm_id": vm['id'],
                "predicted_cpu": round(predicted_cpu, 2),
                "predicted_memory": round(predicted_memory, 2)
            })

    return jsonify(predictions)

@app.route('/summary', methods=['GET'])
def summary():
    total_cpu = sum(vm['cpu_usage'] for vm in vms)
    total_memory = sum(vm['memory_usage'] for vm in vms)
    summary_data = {
        "total_cpu_usage": total_cpu,
        "total_memory_usage": total_memory,
        "vm_count": len(vms)
    }
    return jsonify(summary_data)

@app.route('/add_vm', methods=['POST'])
def add_vm():
    data = request.json
    new_vm = {
        "id": len(vms) + 1,
        "name": f"VM{len(vms) + 1}",
        "cpu_usage": data.get('cpu_usage', random.randint(10, 50)),
        "memory_usage": data.get('memory_usage', random.randint(1024, 8192)),
        "status": "Running"
    }
    vms.append(new_vm)

    # Update historical data for the new VM
    historical_data[new_vm['name']] = {
        "cpu": [new_vm['cpu_usage']],
        "memory": [new_vm['memory_usage']]
    }

    return jsonify({"message": "VM added successfully", "vm": new_vm})

if __name__ == '__main__':
    app.run(debug=True)
