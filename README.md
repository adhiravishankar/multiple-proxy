# multiple-proxy

A simple, configurable, multi-target local proxy server in Node.js. Ideal for local front-end and back-end development where you need to route requests to multiple different servers, bypass CORS restrictions, and log proxy traffic.

## Features

- **Multiple Targets**: Proxy multiple unique endpoints simultaneously on different local ports.
- **JSON Configuration**: Configured simply via a `proxy-config.json` array.
- **CORS Override**: Automatically handles preflight `OPTIONS` requests and injects permissive CORS headers to bypass strict cross-origin issues during local development.
- **Detailed Logging**: Uses `morgan` and a custom file logger (`logs/`) to track all proxy requests, responses, headers, and errors.
- **Auto-Reload**: Uses `nodemon` in the start script to automatically reload when you update the proxy script.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Your Proxies

Copy the example configuration to create your own:

```bash
cp proxy-config.json.example proxy-config.json
```

Edit `proxy-config.json` and specify the local port (`listenPort`), the target URL (`target`), and a descriptive `name` for each proxy block.

```json
[
  {
    "listenPort": 4000,
    "target": "http://localhost:5000",
    "name": "Backend API"
  },
  {
    "listenPort": 4001,
    "target": "https://remote-api.example.com",
    "name": "External Service"
  }
]
```

### 3. Run the Proxy

```bash
npm start
```

The console will output the startup sequence and dynamically open listeners for all specified targets. Log files will be generated in the `logs/` directory.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
