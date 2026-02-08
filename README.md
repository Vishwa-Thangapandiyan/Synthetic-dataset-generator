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

## License

This project uses Meta's Llama 3.1 model. Please review Meta's license agreement for commercial use.

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review HuggingFace documentation: https://huggingface.co/docs
3. Check Llama 3.1 model card: https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct
