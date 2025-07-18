# cinematography-portfolio

Portfolio website built using React. Uses terraform to automate hosting infrastructure on AWS.

## Deploy Frontend

Build the frontend

```console
cd frontend
npm run build
```

Run the python script to deploy the changes

```console
cd infra/frontend-deployment
uv run main.py
```
