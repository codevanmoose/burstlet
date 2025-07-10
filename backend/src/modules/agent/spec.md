# Agent Module Specification

## Overview
The agent module provides AI-friendly APIs designed specifically for autonomous agents and LLMs to interact with the Burstlet platform. It implements semantic endpoints, natural language processing, and the Model Context Protocol (MCP) for seamless AI integration.

## Van Moose Compliance
- ✅ **File Size**: All files under 500 lines
- ✅ **Module Isolation**: Self-contained agent interface
- ✅ **Agent-First**: Designed specifically for AI consumption
- ✅ **KISS Principle**: Simple, semantic API design
- ✅ **Type Safety**: Full TypeScript with Zod validation

## Architecture

### Components
1. **AgentService** (`service.ts`) - Core agent logic (497 lines)
2. **AgentController** (`controller.ts`) - HTTP handlers (389 lines)
3. **AgentRoutes** (`routes.ts`) - Route definitions (24 lines)
4. **AgentModule** (`module.ts`) - Module initialization (127 lines)
5. **Types** (`types.ts`) - TypeScript interfaces (185 lines)
6. **MCP Server** (`../mcp/server.ts`) - Model Context Protocol server

### Dependencies
- **Internal**: Auth, AI Generation, Platform Integrations, Content Management, Analytics
- **External**: MCP SDK, Express, Zod

## Features

### Semantic API Endpoints
- Natural language-friendly routes
- Self-documenting responses
- Context-aware suggestions
- Recovery instructions for errors

### Core Capabilities
1. **Content Generation**
   - Video generation with AI
   - Blog post creation
   - Social media content
   - Script writing

2. **Analytics & Insights**
   - Performance analysis
   - AI-powered insights
   - Growth recommendations
   - Trend detection

3. **Publishing & Distribution**
   - Multi-platform publishing
   - Scheduled posting
   - Batch operations
   - Platform optimization

4. **Content Search**
   - Natural language queries
   - Advanced filtering
   - Semantic matching
   - Context understanding

5. **Workflow Automation**
   - Multi-step processes
   - Conditional logic
   - Error handling
   - Progress tracking

### Natural Language Interface
- Chat-based interaction
- Intent recognition
- Context preservation
- Conversational flow

### MCP Integration
- Standard protocol support
- Tool discovery
- Streaming responses
- Error handling

## API Endpoints

### Public Endpoints
```
GET  /api/v1/agent/capabilities    - Get agent capabilities
GET  /api/v1/agent/docs           - Get API documentation
GET  /api/v1/agent/describe/:endpoint - Get endpoint description
```

### Protected Endpoints
```
POST /api/v1/agent/generate       - Generate content
POST /api/v1/agent/analyze        - Analyze performance
POST /api/v1/agent/publish        - Publish content
POST /api/v1/agent/search         - Search content
POST /api/v1/agent/workflow       - Execute workflows
POST /api/v1/agent/chat          - Natural language interface
```

## Request/Response Format

### Standard Request
```json
{
  "action": "video",
  "input": "Create a tutorial about TypeScript",
  "parameters": {
    "duration": 60,
    "style": "educational"
  },
  "context": {
    "agentId": "agent_123",
    "agentName": "MyAI",
    "capabilities": ["video", "text"]
  }
}
```

### Standard Response
```json
{
  "success": true,
  "data": {
    "jobId": "job_123",
    "status": "processing",
    "estimatedTime": 120
  },
  "metadata": {
    "requestId": "req_456",
    "timestamp": "2024-01-09T10:00:00Z",
    "processingTime": 150,
    "apiVersion": "1.0.0",
    "rateLimit": {
      "remaining": 59,
      "reset": "2024-01-09T10:01:00Z"
    }
  },
  "suggestions": [
    {
      "action": "enhance_prompt",
      "description": "Enhance your prompt for better results",
      "parameters": { "enhance": true },
      "confidence": 0.85
    }
  ]
}
```

## Natural Language Examples

### Generation Request
```
User: "Create a 30-second video about AI productivity tips"
Response: Video generation job started with modern style
```

### Analytics Request
```
User: "How did my content perform last week?"
Response: 50,000 views with 5.2% engagement, peak on weekends
```

### Search Request
```
User: "Find my videos about technology"
Response: Found 5 videos matching "technology"
```

## MCP Tools

### Available Tools
1. **generate_video** - Create videos from prompts
2. **publish_content** - Publish to platforms
3. **get_analytics** - Retrieve performance data
4. **search_content** - Search content library
5. **list_templates** - Get content templates

### Tool Discovery
Agents can discover available tools and their schemas through the MCP protocol.

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "GENERATION_ERROR",
    "message": "Failed to generate video",
    "details": {
      "reason": "Quota exceeded"
    },
    "recovery": "Upgrade your plan or wait for quota reset"
  },
  "metadata": {
    "requestId": "req_789",
    "timestamp": "2024-01-09T10:00:00Z"
  }
}
```

### Common Error Codes
- `INVALID_ACTION` - Unknown action type
- `GENERATION_ERROR` - Content generation failed
- `PUBLISH_ERROR` - Publishing failed
- `ANALYTICS_ERROR` - Analytics unavailable
- `QUOTA_EXCEEDED` - Usage limit reached
- `INTENT_NOT_RECOGNIZED` - Natural language not understood

## Rate Limiting

### Agent-Specific Limits
- Standard agents: 60 requests/minute
- Verified agents: 300 requests/minute
- Enterprise agents: 1000 requests/minute

### Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1704796860
```

## Best Practices

### For Agent Developers
1. **Include Context**: Always send agent identification
2. **Handle Suggestions**: Process returned suggestions
3. **Error Recovery**: Implement recovery strategies
4. **Batch Operations**: Use workflows for multiple tasks
5. **Cache Responses**: Respect rate limits

### Request Optimization
1. **Specific Prompts**: Be clear and detailed
2. **Use Parameters**: Leverage optional parameters
3. **Context Preservation**: Maintain conversation context
4. **Error Handling**: Parse error recovery hints

## Integration Examples

### Python
```python
import requests

response = requests.post(
    "https://api.burstlet.com/api/v1/agent/generate",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
    json={
        "action": "video",
        "input": "Create a tutorial",
        "parameters": {"duration": 60}
    }
)
```

### JavaScript
```javascript
const result = await fetch('/api/v1/agent/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'video',
    input: 'Create a tutorial',
    parameters: { duration: 60 }
  })
});
```

### MCP Client
```javascript
const client = new MCPClient('burstlet-mcp');
const result = await client.callTool('generate_video', {
  prompt: 'Create a tutorial',
  duration: 60
});
```

## Future Enhancements

### Planned Features
- Multi-modal input support
- Streaming responses
- Agent memory/context
- Custom tool creation
- Collaborative workflows
- Agent marketplace

### Advanced Capabilities
- Semantic understanding
- Predictive suggestions
- Learning from feedback
- Cross-agent communication
- Autonomous operations