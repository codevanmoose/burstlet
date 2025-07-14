#!/bin/bash
# Add environment variables to DigitalOcean app using JSON

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

APP_ID="41fe1a5b-84b8-4cf8-a69f-5330c7ed7518"

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log "🔧 Adding environment variables to DigitalOcean app"
log "App ID: $APP_ID"
log "=========================================================="

# Get current app spec as JSON
log "Getting current app configuration..."
doctl apps get $APP_ID --output json > /tmp/current-app.json

# Create Python script to add env vars
cat > /tmp/update_env_vars.py << 'EOF'
import json
import sys

# Load current app config
with open('/tmp/current-app.json', 'r') as f:
    apps = json.load(f)
    app = apps[0] if isinstance(apps, list) else apps

# Environment variables to add
env_vars_to_add = [
    # Authentication secrets
    {"key": "CSRF_SECRET", "value": "FfVCH60pzK6oNfabfPPH00eyomn8hDoM", "scope": "RUN_TIME", "type": "SECRET"},
    {"key": "ADMIN_OVERRIDE_TOKEN", "value": "0VCLj55hHvinycPTGMdY8rfsAugdCMft", "scope": "RUN_TIME", "type": "SECRET"},
    {"key": "SESSION_SECRET", "value": "52BoIp4PVyHESnbjZUTb2wbvMQzVuYha", "scope": "RUN_TIME", "type": "SECRET"},
    {"key": "ENCRYPTION_KEY", "value": "28e404e25b30f35d4a3cd2b91c304993", "scope": "RUN_TIME", "type": "SECRET"},
    # Public configuration
    {"key": "FRONTEND_URL", "value": "https://burstlet.vercel.app", "scope": "RUN_TIME"},
    {"key": "SUPABASE_ANON_KEY", "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0", "scope": "RUN_TIME"},
    {"key": "STORAGE_BUCKET", "value": "burstlet-media", "scope": "RUN_TIME"},
    {"key": "REDIS_URL", "value": "redis://localhost:6379", "scope": "RUN_TIME"},
    # OAuth client IDs
    {"key": "YOUTUBE_CLIENT_ID", "value": "placeholder-add-real-id", "scope": "RUN_TIME"},
    {"key": "TIKTOK_CLIENT_ID", "value": "placeholder-add-real-id", "scope": "RUN_TIME"},
    {"key": "INSTAGRAM_CLIENT_ID", "value": "placeholder-add-real-id", "scope": "RUN_TIME"},
    {"key": "TWITTER_CLIENT_ID", "value": "placeholder-add-real-id", "scope": "RUN_TIME"},
]

# Get the spec
spec = app.get('spec', {})

# Find the api service
for service in spec.get('services', []):
    if service.get('name') == 'api':
        if 'envs' not in service:
            service['envs'] = []
        
        # Get existing env var keys
        existing_keys = {env.get('key') for env in service['envs']}
        
        # Add new env vars that don't exist
        for new_env in env_vars_to_add:
            if new_env['key'] not in existing_keys:
                service['envs'].append(new_env)
                print(f"Adding: {new_env['key']}")
            else:
                print(f"Skipping (already exists): {new_env['key']}")

# Save the updated spec
with open('/tmp/updated-spec.json', 'w') as f:
    json.dump(spec, f, indent=2)
EOF

# Run the Python script
log "Processing environment variables..."
python3 /tmp/update_env_vars.py

# Convert JSON to YAML format that doctl expects
log "Converting to YAML format..."
python3 << 'EOF'
import json
import sys

with open('/tmp/updated-spec.json', 'r') as f:
    spec = json.load(f)

# Simple JSON to YAML converter for our needs
def json_to_yaml(obj, indent=0):
    lines = []
    spaces = "  " * indent
    
    if isinstance(obj, dict):
        for key, value in obj.items():
            if isinstance(value, (dict, list)):
                lines.append(f"{spaces}{key}:")
                lines.extend(json_to_yaml(value, indent + 1))
            else:
                if isinstance(value, str) and (" " in value or ":" in value or value.startswith("EV[")):
                    lines.append(f'{spaces}{key}: "{value}"')
                elif isinstance(value, bool):
                    lines.append(f"{spaces}{key}: {str(value).lower()}")
                else:
                    lines.append(f"{spaces}{key}: {value}")
    elif isinstance(obj, list):
        for item in obj:
            if isinstance(item, dict):
                lines.append(f"{spaces}-")
                # Special handling for first key to be on same line as dash
                first = True
                for key, value in item.items():
                    if first:
                        if isinstance(value, (dict, list)):
                            lines[-1] += f" {key}:"
                            lines.extend(json_to_yaml(value, indent + 1))
                        else:
                            if isinstance(value, str) and (" " in value or ":" in value):
                                lines[-1] += f' {key}: "{value}"'
                            else:
                                lines[-1] += f" {key}: {value}"
                        first = False
                    else:
                        if isinstance(value, (dict, list)):
                            lines.append(f"{spaces}  {key}:")
                            lines.extend(json_to_yaml(value, indent + 2))
                        else:
                            if isinstance(value, str) and (" " in value or ":" in value):
                                lines.append(f'{spaces}  {key}: "{value}"')
                            else:
                                lines.append(f"{spaces}  {key}: {value}")
            else:
                lines.append(f"{spaces}- {item}")
    
    return lines

yaml_lines = json_to_yaml(spec)
yaml_content = "\n".join(yaml_lines)

with open('/tmp/updated-spec.yaml', 'w') as f:
    f.write(yaml_content)
EOF

# Apply the updated spec
log "Applying updated configuration..."
if doctl apps update $APP_ID --spec /tmp/updated-spec.yaml; then
    success "✅ Environment variables added successfully!"
    log ""
    log "The app will now redeploy with the new configuration."
    log "This typically takes 5-10 minutes."
    log ""
    log "Monitor deployment at:"
    log "https://cloud.digitalocean.com/apps/$APP_ID"
    log ""
    warning "Note: OAuth credentials are still placeholders and need real values"
else
    error "Failed to update app configuration"
    error "You may need to add the variables manually at:"
    error "https://cloud.digitalocean.com/apps/$APP_ID/settings"
fi

# Clean up
rm -f /tmp/current-app.json /tmp/update_env_vars.py /tmp/updated-spec.json /tmp/updated-spec.yaml