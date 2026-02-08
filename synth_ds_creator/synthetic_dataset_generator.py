"""
Synthetic Dataset Generator using Llama 3.1
Generates domain-specific datasets for: airline, ecommerce, social media, healthcare
"""

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import json
from typing import List, Dict, Optional
from datetime import datetime
import os

class SyntheticDatasetGenerator:
    def __init__(self, model_name: str = "meta-llama/Meta-Llama-3.1-8B-Instruct"):
        """
        Initialize the Llama 3.1 model for dataset generation
        
        Args:
            model_name: HuggingFace model identifier
        """
        print(f"Loading model: {model_name}")
        
        # Check if CUDA is available
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {self.device}")
        
        # Load tokenizer and model
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            device_map="auto" if self.device == "cuda" else None,
            low_cpu_mem_usage=True
        )
        
        # Create text generation pipeline
        self.generator = pipeline(
            "text-generation",
            model=self.model,
            tokenizer=self.tokenizer,
            device_map="auto" if self.device == "cuda" else None
        )
        
        print("Model loaded successfully!")
    
    def get_domain_context(self, domain: str) -> str:
        """
        Get domain-specific context and instructions
        
        Args:
            domain: One of 'airline', 'ecommerce', 'social_media', 'healthcare'
        
        Returns:
            Context string for the domain
        """
        contexts = {
            "airline": """You are generating synthetic data for the airline industry. 
            Focus on: flight bookings, cancellations, delays, customer service interactions, 
            baggage issues, loyalty programs, seat upgrades, and travel experiences.""",
            
            "ecommerce": """You are generating synthetic data for the e-commerce industry.
            Focus on: product searches, purchases, returns, customer reviews, shipping issues,
            payment problems, product recommendations, cart abandonment, and customer support.""",
            
            "social_media": """You are generating synthetic data for social media platforms.
            Focus on: user posts, comments, likes, shares, user profiles, content moderation,
            trending topics, user engagement, notifications, and community interactions.""",
            
            "healthcare": """You are generating synthetic data for the healthcare industry.
            Focus on: patient records, appointments, medical queries, prescriptions, 
            insurance claims, symptom descriptions, treatment plans, and doctor-patient communications.
            Note: Generate only fictional, non-identifying data."""
        }
        
        return contexts.get(domain.lower(), contexts["ecommerce"])
    
    def create_generation_prompt(self, user_prompt: str, domain: str, num_samples: int = 5) -> str:
        """
        Create a structured prompt for the model
        
        Args:
            user_prompt: The prompt from the frontend
            domain: Target domain
            num_samples: Number of samples to generate
        
        Returns:
            Formatted prompt string
        """
        domain_context = self.get_domain_context(domain)
        
        prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

{domain_context}

Generate {num_samples} diverse, realistic synthetic data samples in JSON format.
Each sample should be varied and represent different scenarios within the domain.
Ensure data is completely fictional and does not contain real personal information.<|eot_id|>

<|start_header_id|>user<|end_header_id|>

{user_prompt}

Generate the data as a JSON array with the following structure:
[
  {{
    "id": 1,
    "data": {{...}}
  }},
  ...
]<|eot_id|>

<|start_header_id|>assistant<|end_header_id|>

"""
        return prompt
    
    def generate_dataset(
        self, 
        user_prompt: str, 
        domain: str, 
        num_samples: int = 5,
        max_length: int = 2048,
        temperature: float = 0.7,
        top_p: float = 0.9
    ) -> Dict:
        """
        Generate synthetic dataset based on user prompt
        
        Args:
            user_prompt: Description of desired dataset
            domain: Target domain (airline/ecommerce/social_media/healthcare)
            num_samples: Number of samples to generate
            max_length: Maximum token length
            temperature: Sampling temperature (higher = more creative)
            top_p: Nucleus sampling parameter
        
        Returns:
            Dictionary containing generated dataset and metadata
        """
        # Create the prompt
        full_prompt = self.create_generation_prompt(user_prompt, domain, num_samples)
        
        print(f"Generating {num_samples} samples for domain: {domain}")
        
        # Generate
        outputs = self.generator(
            full_prompt,
            max_new_tokens=max_length,
            temperature=temperature,
            top_p=top_p,
            do_sample=True,
            num_return_sequences=1,
            pad_token_id=self.tokenizer.eos_token_id
        )
        
        generated_text = outputs[0]['generated_text']
        
        # Extract only the assistant's response
        if "<|start_header_id|>assistant<|end_header_id|>" in generated_text:
            generated_text = generated_text.split("<|start_header_id|>assistant<|end_header_id|>")[-1]
        
        # Clean up
        generated_text = generated_text.replace("<|eot_id|>", "").strip()
        
        # Try to parse as JSON
        try:
            # Find JSON array in the response
            start_idx = generated_text.find('[')
            end_idx = generated_text.rfind(']') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = generated_text[start_idx:end_idx]
                dataset = json.loads(json_str)
            else:
                # If no JSON found, wrap the text
                dataset = [{"id": 1, "raw_text": generated_text}]
        except json.JSONDecodeError:
            # Fallback: return as raw text
            dataset = [{"id": 1, "raw_text": generated_text}]
        
        result = {
            "metadata": {
                "domain": domain,
                "prompt": user_prompt,
                "num_samples": num_samples,
                "timestamp": datetime.now().isoformat(),
                "model": "llama-3.1-8b-instruct"
            },
            "dataset": dataset,
            "raw_output": generated_text
        }
        
        return result
    
    def save_dataset(self, result: Dict, output_path: str):
        """
        Save generated dataset to JSON file
        
        Args:
            result: Generated dataset result
            output_path: Path to save the JSON file
        """
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print(f"Dataset saved to: {output_path}")


def main():
    """
    Example usage of the SyntheticDatasetGenerator
    """
    # Initialize generator
    generator = SyntheticDatasetGenerator()
    
    # Example prompts for different domains
    examples = [
        {
            "domain": "airline",
            "prompt": "Generate customer service conversations about flight delays and rebooking requests"
        },
        {
            "domain": "ecommerce",
            "prompt": "Generate product reviews for electronic gadgets with ratings and customer feedback"
        },
        {
            "domain": "social_media",
            "prompt": "Generate user posts about technology trends with engagement metrics"
        },
        {
            "domain": "healthcare",
            "prompt": "Generate patient appointment scheduling conversations with doctors"
        }
    ]
    
    # Generate datasets for each example
    for idx, example in enumerate(examples, 1):
        print(f"\n{'='*60}")
        print(f"Example {idx}: {example['domain'].upper()}")
        print(f"{'='*60}")
        
        result = generator.generate_dataset(
            user_prompt=example['prompt'],
            domain=example['domain'],
            num_samples=3,
            temperature=0.8
        )
        
        # Save to file
        output_file = f"/home/claude/dataset_{example['domain']}_{idx}.json"
        generator.save_dataset(result, output_file)
        
        print(f"\nGenerated {len(result['dataset'])} samples")
        print(f"Preview: {json.dumps(result['dataset'][0], indent=2)[:200]}...")


if __name__ == "__main__":
    main()
