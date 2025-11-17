# NSSM Service Manager

## 📦 What is NSSM?

NSSM (Non-Sucking Service Manager) is a tool that helps you run any application as a Windows service.

## 📦 What's Included

`nssm.exe` is already included in this directory, so you can start using it right away!

Official NSSM website: https://nssm.cc/

## 📁 Directory Structure

```
nssm/
├── nssm.exe                      # NSSM executable (included)
│
├── install-all-services.bat      # 🌟 Install both services (RECOMMENDED)
├── start-all-services.bat        # Start all services
├── stop-all-services.bat         # Stop all services
├── status-all-services.bat       # Check all services status
├── uninstall-all-services.bat    # Uninstall all services
│
├── install-service.bat           # Install Node.js service only
├── start-service.bat             # Start Node.js service
├── stop-service.bat              # Stop Node.js service
├── restart-service.bat           # Restart Node.js service
├── status-service.bat            # Check Node.js service status
├── uninstall-service.bat         # Uninstall Node.js service
│
├── install-natapp-service.bat    # Install Natapp service only
├── start-natapp-service.bat      # Start Natapp service
├── stop-natapp-service.bat       # Stop Natapp service
├── restart-natapp-service.bat    # Restart Natapp service
├── status-natapp-service.bat     # Check Natapp service status
│
└── README.md                     # This file
```

## 🚀 Quick Start (Recommended)

### Option A: Install Both Services (Node.js + Natapp) ⭐⭐⭐

**Step 1**: Install both services (Run as Administrator):
```batch
install-all-services.bat
```

**Step 2**: Start services:
```batch
start-all-services.bat
```
Or use Windows commands:
```batch
net start MIOCardService    # This will auto-start NatappTunnel
```

**Step 3**: Check status:
```batch
status-all-services.bat     # Interactive status dashboard
```

**Manage both services**:
```batch
start-all-services.bat      # Start both
stop-all-services.bat       # Stop both
status-all-services.bat     # Check status
uninstall-all-services.bat  # Remove both
```

### Option B: Install Services Separately

**Node.js Service Only**:
```batch
install-service.bat         # Install
start-service.bat           # Start
status-service.bat          # Check status
stop-service.bat            # Stop
uninstall-service.bat       # Uninstall
```

**Natapp Service Only** (requires Node.js service):
```batch
install-natapp-service.bat  # Install
start-natapp-service.bat    # Start
status-natapp-service.bat   # Check status
stop-natapp-service.bat     # Stop
```

**Windows Commands**:
```batch
net start MIOCardService    # Start Node.js
net start NatappTunnel      # Start Natapp
net stop NatappTunnel       # Stop Natapp
net stop MIOCardService     # Stop Node.js
services.msc                # Open Service Manager
```

## ⚙️ Service Configuration

### Node.js Service (MIOCardService)
- **Service Name**: `MIOCardService`
- **Display Name**: `MIO Card API Service`
- **Startup Type**: Automatic (starts on boot)
- **Working Directory**: Project root
- **Port**: 5200
- **Logs**: `logs/service-stdout.log`, `logs/service-stderr.log`
- **Auto-Restart**: Yes (1 second delay)

### Natapp Service (NatappTunnel)
- **Service Name**: `NatappTunnel`
- **Display Name**: `Natapp Tunnel Service`
- **Startup Type**: Automatic (starts on boot)
- **Working Directory**: `natapp/` (for config.ini)
- **Depends On**: MIOCardService (starts after Node.js)
- **Logs**: `logs/natapp-stdout.log`, `logs/natapp-stderr.log`
- **Auto-Restart**: Yes (5 second delay)
- **Config Required**: `natapp/config.ini`

## 🔧 Manual Configuration

To manually configure services using NSSM GUI:
```batch
nssm.exe edit MIOCardService    # Configure Node.js service
nssm.exe edit NatappTunnel      # Configure Natapp service
```

## 📝 View Service Status

**Interactive Dashboard** (Recommended):
```batch
status-all-services.bat     # View both services with menu
```

**Windows Services Manager**:
1. Open: `Win + R` → `services.msc`
2. Find services:
   - "MIO Card API Service" (MIOCardService)
   - "Natapp Tunnel Service" (NatappTunnel)
3. Check status, startup type, and properties

**Command Line**:
```batch
sc query MIOCardService     # Check Node.js service
sc query NatappTunnel       # Check Natapp service
```

## 🔄 Service Auto-Restart

Both services are configured to automatically restart on failure:

**Node.js Service**:
- Restart delay: 1 second
- Action on failure: Restart automatically
- Throttle: 1000ms

**Natapp Service**:
- Restart delay: 5 seconds  
- Action on failure: Restart automatically
- Throttle: 5000ms
- Note: Will wait for Node.js service to be ready

## 📋 Logs

Service logs are automatically saved in `logs/` directory:

**Log Files**:
```
logs/
├── service-stdout.log    # Node.js standard output
├── service-stderr.log    # Node.js errors
├── natapp-stdout.log     # Natapp output (includes tunnel URL)
└── natapp-stderr.log     # Natapp errors
```

**View Logs in Real-time**:
```batch
status-all-services.bat              # Interactive viewer with menu
powershell -Command "Get-Content logs\service-stdout.log -Wait -Tail 30"
powershell -Command "Get-Content logs\natapp-stdout.log -Wait -Tail 30"
```

**Or use the project log viewer**:
```batch
..\view-logs.bat    # View all logs from project root
```

## ⚠️ Important Notes

1. **Administrator Rights Required**: All install/uninstall operations require administrator privileges.
   - Right-click scripts → "Run as administrator"
   
2. **Service Dependencies**: Natapp service depends on Node.js service.
   - Node.js must be running before Natapp
   - Stopping Node.js will not auto-stop Natapp
   - Starting Node.js will auto-start Natapp (if configured)

3. **Natapp Configuration**: Create `natapp/config.ini` before installing Natapp service.
   - See `natapp/config.ini.example` for template
   - Service will fail to start without valid config

4. **Port Conflicts**: Make sure port 5200 is not used by other applications.

5. **Node.js Path**: The script will automatically detect your Node.js installation.

6. **Firewall**: You may need to allow port 5200 through Windows Firewall.

7. **Logs**: Service logs use append mode - they will grow over time.
   - Check `logs/` folder periodically
   - Delete old logs if disk space is a concern

## 🆘 Troubleshooting

### Node.js Service won't start
- Check if Node.js is installed: `node --version`
- Check if port 5200 is available: `netstat -ano | findstr :5200`
- View error logs: `logs\service-stderr.log`
- Test manually: `node server.js`

### Natapp Service won't start
- Check if Node.js service is running: `sc query MIOCardService`
- Verify `natapp/config.ini` exists and is valid
- Check natapp.exe location: `natapp\natapp.exe`
- View error logs: `logs\natapp-stderr.log`
- Test manually: `natapp\natapp.exe`

### Service crashes repeatedly
- Check logs in `logs/` directory for error messages
- Verify all dependencies are installed
- Check Windows Event Viewer (eventvwr.msc) for details
- Increase restart delay if needed (edit via nssm GUI)

### Natapp tunnel not showing
- Check `logs\natapp-stdout.log` for tunnel URL
- Verify natapp config.ini has valid authtoken
- Ensure Node.js service is responding on port 5200
- Test local access: http://localhost:5200

### Permission errors
- Make sure you run install/uninstall scripts as Administrator
- Right-click → "Run as administrator"

### Port 5200 already in use
```batch
netstat -ano | findstr :5200        # Find process using port
taskkill /PID <process_id> /F       # Kill the process
```

### Services Manager shows "Starting..." forever
- Check service logs for errors
- The service may be waiting for dependencies
- Restart computer if services are stuck

## 🔗 Resources

- NSSM Official Site: https://nssm.cc/
- NSSM Documentation: https://nssm.cc/usage
- Service Management Guide: https://nssm.cc/commands

