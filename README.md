# Synthetic Dataset Generator using Llama 3.1

A Python application that generates synthetic datasets using Meta's Llama 3.1 model across multiple domains: Airline, E-Commerce, Social Media, and Healthcare.

## Features

- 🤖 **Llama 3.1 Integration**: Uses Meta-Llama-3.1-8B-Instruct model
- 🎯 **Domain-Specific Generation**: Optimized prompts for 4 different domains
- 🌐 **REST API**: Flask-based API for easy frontend integration
- 📊 **Flexible Output**: JSON-formatted datasets with metadata
- ⚡ **GPU Support**: Automatic GPU detection and usage if available

## Supported Domains

1. **Airline**: Flight bookings, delays, customer service, baggage issues
2. **E-Commerce**: Products, reviews, orders, shipping, returns
3. **Social Media**: Posts, comments, engagement, user profiles
4. **Healthcare**: Appointments, medical queries, patient records (fictional data only)

## Installation

### Prerequisites

- Python 3.8 or higher
- CUDA-capable GPU (optional, but recommended)
- HuggingFace account (for model access)

### Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 2: HuggingFace Authentication

You'll need to authenticate with HuggingFace to download the Llama 3.1 model:

1. Create a HuggingFace account at https://huggingface.co/
2. Request access to Llama 3.1 at https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct
3. Create an access token at https://huggingface.co/settings/tokens
4. Login via CLI:

```bash
huggingface-cli login
```

Or set environment variable:

```bash
export HF_TOKEN="your_token_here"
```

## Usage

### Option 1: Python Script (Direct Usage)

```python
from synthetic_dataset_generator import SyntheticDatasetGenerator

# Initialize generator
generator = SyntheticDatasetGenerator()

# Generate dataset
result = generator.generate_dataset(
    user_prompt="Generate customer reviews for laptops with ratings",
    domain="ecommerce",
    num_samples=5,
    temperature=0.8
)

# Save to file
generator.save_dataset(result, "output.json")

# Access the data
print(result['dataset'])
```

### Option 2: Flask API Server

Start the server:

```bash
python api_server.py
```

The API will be available at `http://localhost:5000`

#### API Endpoints

**1. Health Check**
```bash
GET /health
```

**2. Generate Dataset**
```bash
POST /api/generate
Content-Type: application/json

{
  "prompt": "Generate customer service chats about product returns",
  "domain": "ecommerce",
  "num_samples": 5,
  "temperature": 0.7,
  "max_length": 2048
}
```

**3. Get Available Domains**
```bash
GET /api/domains
```

**4. Get Example Prompts**
```bash
GET /api/examples
```

**5. Download Generated Dataset**
```bash
GET /api/download/<filename>
```

### Frontend Integration Example

```javascript
// JavaScript fetch example
async function generateDataset() {
  const response = await fetch('http://localhost:5000/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: 'Generate flight delay notifications with rebooking options',
      domain: 'airline',
      num_samples: 10,
      temperature: 0.7
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Generated dataset:', result.data.dataset);
  }
}
```

```python
# Python requests example
import requests

response = requests.post('http://localhost:5000/api/generate', json={
    'prompt': 'Generate patient appointment scheduling conversations',
    'domain': 'healthcare',
    'num_samples': 5,
    'temperature': 0.8
})

result = response.json()
print(result['data']['dataset'])
```

## Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | Description of desired dataset |
| `domain` | string | Yes | - | One of: airline, ecommerce, social_media, healthcare |
| `num_samples` | integer | No | 5 | Number of samples to generate (1-50) |
| `temperature` | float | No | 0.7 | Sampling temperature (0.0-2.0) |
| `max_length` | integer | No | 2048 | Maximum tokens to generate |
| `top_p` | float | No | 0.9 | Nucleus sampling parameter |

## Response Format

```json
{
  "success": true,
  "data": {
    "metadata": {
      "domain": "ecommerce",
      "prompt": "Generate product reviews...",
      "num_samples": 5,
      "timestamp": "2024-02-08T10:30:00",
      "model": "llama-3.1-8b-instruct"
    },
    "dataset": [
      {
        "id": 1,
        "data": {
          // Generated data here
        }
      }
    ],
    "raw_output": "..."
  },
  "file_path": "/home/claude/outputs/dataset_ecommerce_20240208_103000.json"
}
```

## Example Prompts

### Airline
- "Generate customer complaints about lost baggage with resolution requests"
- "Create flight delay notifications with rebooking options"
- "Generate loyalty program member interactions and point redemptions"

### E-Commerce
- "Create product reviews for smartphones with ratings from 1-5 stars"
- "Generate customer service chats about order tracking and delivery issues"
- "Create abandoned cart recovery emails with product recommendations"

### Social Media
- "Generate viral posts about AI trends with engagement metrics"
- "Create user profile bios for tech enthusiasts with interests"
- "Generate comment threads on trending topics with varied opinions"

### Healthcare
- "Create patient-doctor appointment scheduling conversations"
- "Generate symptom descriptions with preliminary diagnosis suggestions"
- "Create prescription refill requests with insurance verification"

## Configuration

### Model Selection

To use a different Llama 3.1 variant, modify the model name:

```python
# For larger model (requires more GPU memory)
generator = SyntheticDatasetGenerator(
    model_name="meta-llama/Meta-Llama-3.1-70B-Instruct"
)

# For smaller, faster model
generator = SyntheticDatasetGenerator(
    model_name="meta-llama/Meta-Llama-3.1-8B-Instruct"
)
```

### GPU Memory Optimization

If you encounter GPU memory issues:

```python
# Use 8-bit quantization
from transformers import BitsAndBytesConfig

quantization_config = BitsAndBytesConfig(load_in_8bit=True)

model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=quantization_config,
    device_map="auto"
)
```

## Performance Tips

1. **GPU Usage**: The model runs much faster on GPU (CUDA). Ensure PyTorch is installed with CUDA support.
2. **Batch Size**: For multiple generations, use the API's batch capability.
3. **Temperature**: Lower values (0.3-0.5) for more consistent data, higher (0.8-1.2) for diversity.
4. **Caching**: The model is loaded once at startup to avoid repeated loading.

## Troubleshooting

### Issue: "Model not found" or "Access denied"
- Ensure you've requested access to Llama 3.1 on HuggingFace
- Verify your HuggingFace token is valid
- Run `huggingface-cli login` to authenticate

### Issue: CUDA out of memory
- Use a smaller model (8B instead of 70B)
- Reduce `max_length` parameter
- Enable 8-bit quantization (see Configuration section)
- Close other GPU applications

### Issue: Slow generation
- Ensure you're using GPU (check with `torch.cuda.is_available()`)
- Reduce `num_samples` or `max_length`
- Consider using a smaller model variant

## Security Notes

- **Healthcare Data**: All generated healthcare data is completely fictional
- **PII**: The model is instructed to never generate real personal information
- **Rate Limiting**: Consider implementing rate limiting for production use
- **API Security**: Add authentication for production deployments

## File Structure

```
.
├── synthetic_dataset_generator.py  # Main generator class
├── api_server.py                   # Flask API server
├── requirements.txt                # Python dependencies
├── README.md                       # This file
└── outputs/                        # Generated datasets (auto-created)
```

## License

This project uses Meta's Llama 3.1 model. Please review Meta's license agreement for commercial use.

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review HuggingFace documentation: https://huggingface.co/docs
3. Check Llama 3.1 model card: https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct
