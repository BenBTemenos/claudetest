# Setup Instructions for Windows Host

Your WSL IP address is: **172.22.150.116**

## Start the Application

### 1. Start Backend Server

In WSL terminal:
```bash
cd /home/bboussiba/workspace/bentest/backend

# Install Python dependencies first (if not already installed)
python3 -m pip install flask flask-cors

# Start the backend
python3 app.py
```

Backend will be available at: `http://172.22.150.116:5000`

### 2. Start Frontend Server

In another WSL terminal:
```bash
cd /home/bboussiba/workspace/bentest/frontend

# Start React dev server
npm start
```

Frontend will be available at: `http://172.22.150.116:3000`

## Access from Windows

Open your Windows browser and navigate to:

**http://172.22.150.116:3000**

## Important Notes

- Both servers are configured to bind to `0.0.0.0` making them accessible from your Windows host
- The frontend is configured to call the backend API at `http://172.22.150.116:5000`
- If your WSL IP changes, you'll need to update the `.env` file in the frontend directory

## Troubleshooting

### If the WSL IP address changes:

1. Get new IP:
   ```bash
   hostname -I | awk '{print $1}'
   ```

2. Update `frontend/.env`:
   ```
   REACT_APP_API_URL=http://YOUR_NEW_IP:5000/api
   ```

3. Restart the frontend server

### Firewall Issues

If you can't access from Windows, you may need to allow the ports through WSL firewall:
```bash
sudo ufw allow 5000
sudo ufw allow 3000
```

Or disable the firewall temporarily for testing:
```bash
sudo ufw disable
```
