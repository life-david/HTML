from flask import Flask, render_template, jsonify, request
import psutil
import platform
import time # Có thể cần nếu không dùng interval trong cpu_percent
import threading

app = Flask(__name__)

running_apps = []  # Biến toàn cục để lưu danh sách các ứng dụng đang chạy

def update_running_apps():
    """Cập nhật danh sách các ứng dụng đang chạy."""
    global running_apps
    apps = []
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            info = proc.info
            apps.append({
                "pid": info['pid'],
                "name": info['name'],
                "status": "Đã bật"
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue
    running_apps = apps

def start_app_monitor():
    """Chạy luồng cập nhật danh sách ứng dụng mỗi 2 phút."""
    def monitor():
        while True:
            update_running_apps()
            time.sleep(120)  # Cập nhật mỗi 2 phút
    threading.Thread(target=monitor, daemon=True).start()

def get_system_stats():
    """Lấy thông tin CPU, RAM, Disk và Nhiệt độ."""
    
    # CPU - dùng interval=0.5 để phản hồi nhanh hơn, không cần time.sleep ở JS nhiều
    # Nếu interval=None, bạn cần tính toán sự khác biệt giữa 2 lần gọi
    cpu_usage = psutil.cpu_percent(interval=0.5) 
    
    # Memory (RAM)
    mem = psutil.virtual_memory()
    mem_percent = mem.percent
    mem_total_gb = round(mem.total / (1024**3), 1)
    mem_used_gb = round(mem.used / (1024**3), 1)

    # Disk Usage (Ổ đĩa gốc)
    disk_path = 'C:\\' if platform.system() == "Windows" else '/'
    try:
        disk = psutil.disk_usage(disk_path)
        disk_percent = disk.percent
        disk_total_gb = round(disk.total / (1024**3), 1)
        disk_used_gb = round(disk.used / (1024**3), 1)
    except FileNotFoundError:
         # Xử lý trường hợp không tìm thấy ổ đĩa (ví dụ: ổ đĩa mạng bị ngắt)
        disk_percent = 'N/A'
        disk_total_gb = 'N/A'
        disk_used_gb = 'N/A'


    # Temperature (Rất phụ thuộc hệ thống!)
    temperatures = {}
    cpu_temp_value = 'N/A' # Giá trị mặc định
    try:
        temps = psutil.sensors_temperatures()
        print("Temperature sensors:", temps)  # Log để kiểm tra cảm biến
        if temps:
            # Logic tìm nhiệt độ CPU
            found_cpu_temp = False
            # Ưu tiên các key phổ biến
            preferred_keys = ['coretemp', 'k10temp', 'cpu_thermal', 'cpu-thermal', 'acpitz']
            for key in preferred_keys:
                 if key in temps:
                     # Lấy giá trị nhiệt độ hiện tại đầu tiên tìm thấy trong key đó
                     if temps[key]:
                         cpu_temp_value = temps[key][0].current
                         found_cpu_temp = True
                         break
            
            # Nếu không tìm thấy trong các key ưu tiên, thử lấy key đầu tiên có chữ 'cpu' hoặc 'core'
            if not found_cpu_temp:
                 for name, entries in temps.items():
                     if 'cpu' in name.lower() or 'core' in name.lower() or 'package' in name.lower():
                         if entries:
                             cpu_temp_value = entries[0].current
                             found_cpu_temp = True
                             break

            # Nếu vẫn không tìm thấy, thử lấy giá trị đầu tiên bất kỳ (ít tin cậy hơn)
            # if not found_cpu_temp and temps:
            #      first_sensor_key = list(temps.keys())[0]
            #      if temps[first_sensor_key]:
            #           cpu_temp_value = temps[first_sensor_key][0].current
            
    except Exception as e:
        print(f"Error fetching temperature: {e}")
        cpu_temp_value = 'N/A' 
    
    # Làm tròn nếu là số
    if isinstance(cpu_temp_value, (int, float)):
        cpu_temp_value = round(cpu_temp_value, 1)

    temperatures['cpu_temp'] = cpu_temp_value

    # Lấy thông tin các tiến trình
    top_processes = get_process_info(limit=10)

    return {
        "cpu_usage": cpu_usage,
        "memory": {
            "percent": mem_percent,
            "used_gb": mem_used_gb,
            "total_gb": mem_total_gb
        },
        "disk": {
            "path": disk_path,
            "percent": disk_percent,
            "used_gb": disk_used_gb,
            "total_gb": disk_total_gb
        },
        "temperature": temperatures,
        "processes": top_processes  # Thêm thông tin tiến trình
    }

def get_process_info(limit=10):
    """Lấy thông tin các tiến trình sử dụng nhiều CPU và RAM nhất."""
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
        try:
            info = proc.info
            processes.append({
                "pid": info['pid'],
                "name": info['name'],
                "cpu_percent": info['cpu_percent'],
                "memory_mb": round(info['memory_info'].rss / (1024 ** 2), 1) if info['memory_info'] else 0
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            # Bỏ qua các tiến trình không thể truy cập
            continue

    # Sắp xếp theo CPU sử dụng (giảm dần) và lấy top `limit` tiến trình
    processes = sorted(processes, key=lambda x: x['cpu_percent'], reverse=True)[:limit]
    return processes

def get_temperature_and_fan_speed():
    """Lấy thông tin nhiệt độ CPU, GPU và tốc độ quạt."""
    temperatures = {}
    fan_speeds = {}

    # Lấy nhiệt độ CPU
    if hasattr(psutil, "sensors_temperatures"):
        temp_data = psutil.sensors_temperatures()
        if "coretemp" in temp_data:  # Tên sensor có thể khác tùy hệ thống
            cpu_temps = temp_data["coretemp"]
            temperatures["cpu"] = round(cpu_temps[0].current, 1) if cpu_temps else "N/A"

    # Lấy tốc độ quạt (nếu có)
    if hasattr(psutil, "sensors_fans"):
        fan_data = psutil.sensors_fans()
        if "coretemp" in fan_data:  # Tên sensor có thể khác tùy hệ thống
            fan_speeds["cpu"] = fan_data["coretemp"][0].current if fan_data["coretemp"] else "N/A"

    return {"temperatures": temperatures, "fan_speeds": fan_speeds}

@app.route('/')
def index():
    """Phục vụ file index.html."""
    return render_template('index.html')

@app.route('/api/stats')
def api_stats():
    stats = get_system_stats()
    temp_and_fan = get_temperature_and_fan_speed()
    stats.update(temp_and_fan)
    print("API /api/stats response:", stats)  # Log để kiểm tra
    return jsonify(stats)

@app.route('/api/running_apps')
def api_running_apps():
    """API trả về danh sách các ứng dụng đang chạy."""
    for app in running_apps:
        app['icon'] = '<i class="fas fa-check-circle text-success"></i>'  # Biểu tượng trạng thái "đang bật"
    return jsonify(running_apps)

@app.route('/api/process/terminate', methods=['POST'])
def terminate_process():
    """API để dừng một tiến trình."""
    data = request.get_json()
    pid = data.get('pid')
    try:
        proc = psutil.Process(pid)
        proc.terminate()  # Gửi tín hiệu dừng
        return jsonify({"status": "success", "message": f"Process {pid} terminated."}), 200
    except psutil.NoSuchProcess:
        return jsonify({"status": "error", "message": f"Process {pid} not found."}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/process/restart', methods=['POST'])
def restart_process():
    """API để khởi động lại một tiến trình."""
    data = request.get_json()
    pid = data.get('pid')
    try:
        proc = psutil.Process(pid)
        proc.terminate()  # Dừng tiến trình hiện tại
        proc.wait()  # Chờ tiến trình dừng hoàn toàn
        proc = psutil.Popen(proc.cmdline())  # Khởi động lại tiến trình với cùng lệnh
        return jsonify({"status": "success", "message": f"Process {pid} restarted."}), 200
    except psutil.NoSuchProcess:
        return jsonify({"status": "error", "message": f"Process {pid} not found."}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    start_app_monitor()  # Bắt đầu theo dõi ứng dụng
    app.run(debug=True, host='0.0.0.0', port=5000)