# TenderIQ

A web application with frontend and dual backend servers.

## Getting Started

### Frontend Setup

```bash
cd TenderIQ
npm install
npm run dev
```

### Backend Setup

The backend consists of two servers: `app` and `app2`.

```
cd python-api
```

1. Create and activate virtual environment:

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# For Windows CMD:
venv\Scripts\activate

# For PowerShell:
venv\Scripts\Activate.ps1

# For Git Bash:
source venv/Scripts/activate
```

> Note: If you get an execution policy error in PowerShell, run:
>
> ```powershell
> Set-ExecutionPolicy Unrestricted -Scope Process
> ```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Start the servers:

Terminal 1:

```bash
uvicorn app:app --reload
```

Terminal 2:

```bash
uvicorn app2:app --reload --port 8001
```

Now you're ready to use TenderIQ! 🚀
